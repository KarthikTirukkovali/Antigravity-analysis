"""
etl_pipeline.py  ─  Manufacturing Machine Telemetry Pipeline
-------------------------------------------------------------
Reads all machine-*.csv files from:
  Raw data/<DDMMYYYY>/machines/*.csv
  Raw data/<DDMMYYYY>/MC/*.csv

Each CSV has columns: timestamp, quantity, speed
Filename encodes the machine name and date.

Outputs
-------
  output/master_data.csv       — full row-level data enriched with machine/date
  output/summary_stats.json    — aggregate KPIs for the dashboard
  output/pipeline.log          — full structured audit log
"""

import os
import sys
import re
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Optional

import polars as pl
from loguru import logger
from tqdm import tqdm

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent
_env_raw   = os.environ.get("RAW_DIR")
RAW_DIR    = Path(_env_raw) if _env_raw else BASE_DIR / "Raw data"
OUTPUT_DIR = BASE_DIR / "output"
LOG_FILE   = OUTPUT_DIR / "pipeline.log"

MAX_WORKERS = min(32, (os.cpu_count() or 4) * 2)

# ── Logging ────────────────────────────────────────────────────────────────
def setup_logging() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logger.remove()
    logger.add(
        sys.stderr, level="INFO",
        format="<green>{time:HH:mm:ss}</green> | <level>{level:<8}</level> | {message}"
    )
    logger.add(
        str(LOG_FILE), level="DEBUG", rotation="20 MB",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {message}"
    )
    logger.info(f"Pipeline started  RAW_DIR={RAW_DIR}")
    logger.info(f"Using {MAX_WORKERS} worker threads")


# ── Filename parser ────────────────────────────────────────────────────────
# Filename: machine-{MachineName}-{M}-{D}-{YYYY}.csv
# e.g.  machine-GC-Taping-A-8-1-2025.csv  →  machine_name="GC-Taping-A", date 2025-08-01
_DATE_RE = re.compile(r"-(\d{1,2})-(\d{1,2})-(\d{4})\.csv$", re.IGNORECASE)

def parse_filename(path: Path) -> tuple[str, str]:
    """
    Returns (machine_name, date_str) parsed from the CSV filename.
    date_str format: YYYY-MM-DD.
    """
    stem = path.stem  # strip .csv
    m = _DATE_RE.search(path.name)
    if m:
        month, day, year = m.group(1), m.group(2), m.group(3)
        # Strip trailing date part from the machine name
        machine = _DATE_RE.sub("", path.name)     # remove date + .csv
        machine = re.sub(r"^machine-", "", machine)   # remove leading "machine-"
        date_str = f"{year}-{int(month):02d}-{int(day):02d}"
    else:
        machine = path.stem
        date_str = "unknown"
    return machine.strip("-"), date_str


# ── Per-file reader (runs in thread pool) ─────────────────────────────────
def read_file(path: Path) -> Optional[pl.DataFrame]:
    """
    Read one machine CSV and enrich with metadata columns.
    Returns None on any failure (logged, never raised).
    """
    try:
        if path.stat().st_size == 0:
            logger.warning(f"SKIP [empty]        {path.name}")
            return None

        df = pl.read_csv(
            path,
            schema_overrides={"timestamp": pl.Utf8, "quantity": pl.Float64, "speed": pl.Float64},
            ignore_errors=True,
            infer_schema_length=20,
        )

        if df.is_empty():
            logger.warning(f"SKIP [no rows]      {path.name}")
            return None

        required = {"timestamp", "quantity", "speed"}
        if not required.issubset(set(df.columns)):
            logger.warning(f"SKIP [bad schema]   {path.name} cols={df.columns}")
            return None

        machine_name, date_str = parse_filename(path)

        # Determine subfolder type (machines vs MC)
        subfolder = path.parent.name  # "machines" or "MC"

        df = df.with_columns([
            pl.lit(machine_name).alias("machine"),
            pl.lit(date_str).alias("date"),
            pl.lit(subfolder).alias("source"),
            pl.col("timestamp").str.strptime(
                pl.Datetime, "%m/%d/%Y, %I:%M:%S %p", strict=False
            ).alias("ts"),
        ])

        # Drop rows where timestamp failed to parse
        before = len(df)
        df = df.drop_nulls(subset=["ts"])
        if len(df) == 0:
            logger.warning(f"SKIP [all ts null]  {path.name}")
            return None
        if before - len(df) > 0:
            logger.debug(f"Dropped {before - len(df)} unparseable timestamps in {path.name}")

        # Select final columns
        df = df.select(["ts", "date", "machine", "source", "quantity", "speed"])

        logger.debug(f"OK  {path.name} ({len(df)} rows)")
        return df

    except pl.exceptions.ComputeError as exc:
        logger.warning(f"SKIP [compute err]  {path.name} — {exc}")
    except Exception as exc:                                    # noqa: BLE001
        logger.error(f"SKIP [unexpected]   {path.name} — {type(exc).__name__}: {exc}")
    return None


# ── Discover all CSV files ─────────────────────────────────────────────────
def discover_files() -> list[Path]:
    paths = list(RAW_DIR.rglob("*.csv"))
    logger.info(f"Discovered {len(paths)} CSV files across {RAW_DIR}")
    return paths


# ── Parallel ingestion ─────────────────────────────────────────────────────
def ingest_files(paths: list[Path]) -> list[pl.DataFrame]:
    frames: list[pl.DataFrame] = []
    skipped: list[str] = []

    logger.info(f"Reading {len(paths)} files with {MAX_WORKERS} threads ...")
    t0 = time.perf_counter()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_map = {executor.submit(read_file, p): p for p in paths}
        with tqdm(total=len(paths), unit="file", desc="Ingesting", ncols=90) as pbar:
            for future in as_completed(future_map):
                path = future_map[future]
                try:
                    result = future.result()
                    if result is not None:
                        frames.append(result)
                    else:
                        skipped.append(path.name)
                except Exception as exc:                        # noqa: BLE001
                    logger.error(f"Future error {path.name}: {exc}")
                    skipped.append(path.name)
                finally:
                    pbar.update(1)

    elapsed = time.perf_counter() - t0
    logger.info(
        f"Ingestion done in {elapsed:.2f}s — "
        f"{len(frames)} succeeded, {len(skipped)} skipped"
    )
    return frames


# ── Merge & clean ──────────────────────────────────────────────────────────
def merge_and_clean(frames: list[pl.DataFrame]) -> pl.DataFrame:
    logger.info("Merging frames ...")
    master = pl.concat(frames, how="diagonal_relaxed")

    master = master.with_columns([
        pl.col("quantity").cast(pl.Float64),
        pl.col("speed").cast(pl.Float64),
        pl.col("date").cast(pl.Utf8),
    ]).sort(["machine", "ts"])

    # Uptime flag: a machine is "active" if speed > 0
    master = master.with_columns(
        (pl.col("speed") > 0).alias("is_active")
    )

    logger.info(f"Master: {len(master):,} rows x {len(master.columns)} cols")
    return master


# ── Aggregate statistics ───────────────────────────────────────────────────
def compute_stats(df: pl.DataFrame, n_ok: int, n_skip: int) -> dict:
    logger.info("Computing aggregate statistics ...")

    total_quantity  = float(df["quantity"].max() or 0)   # cumulative counter
    avg_speed       = float(df["speed"].mean() or 0)
    total_readings  = len(df)
    active_readings = int(df["is_active"].sum())
    uptime_pct      = round(active_readings / total_readings * 100, 2) if total_readings else 0
    unique_machines = df["machine"].n_unique()
    unique_dates    = df["date"].n_unique()

    # ── Daily production (max quantity per machine per date, summed) ──────
    daily_prod = (
        df.group_by(["date", "machine"])
          .agg(pl.col("quantity").max().alias("daily_qty"))
          .group_by("date")
          .agg(pl.col("daily_qty").sum().alias("total_qty"))
          .sort("date")
    )

    # ── Per-machine summary ───────────────────────────────────────────────
    by_machine = (
        df.group_by("machine")
          .agg([
              pl.col("quantity").max().alias("total_quantity"),
              pl.col("speed").mean().alias("avg_speed"),
              pl.col("speed").max().alias("max_speed"),
              pl.col("is_active").mean().mul(100).round(1).alias("uptime_pct"),
              pl.len().alias("readings"),
          ])
          .sort("total_quantity", descending=True)
    )

    # ── Daily uptime % ────────────────────────────────────────────────────
    daily_uptime = (
        df.group_by("date")
          .agg(
              pl.col("is_active").mean().mul(100).round(1).alias("uptime_pct"),
              pl.col("speed").mean().round(2).alias("avg_speed"),
          )
          .sort("date")
    )

    # ── Top 10 machines by uptime ─────────────────────────────────────────
    top_machines = by_machine.sort("uptime_pct", descending=True).head(10)

    # ── Source split (machines vs MC) ─────────────────────────────────────
    by_source = (
        df.group_by("source")
          .agg([
              pl.col("quantity").max().alias("total_quantity"),
              pl.col("is_active").mean().mul(100).round(1).alias("uptime_pct"),
              pl.len().alias("readings"),
          ])
    )

    # ── Machine category (derived from name prefix) ────────────────────────
    df2 = df.with_columns(
        pl.col("machine").str.extract(r"^([A-Za-z0-9]+(?:-[A-Za-z]+)?)", 0).alias("category")
    )
    by_category = (
        df2.group_by("category")
           .agg([
               pl.col("quantity").max().alias("total_quantity"),
               pl.col("is_active").mean().mul(100).round(1).alias("uptime_pct"),
               pl.len().alias("readings"),
           ])
           .sort("total_quantity", descending=True)
           .head(10)
    )

    # ── Daily Granular Data (For Frontend Filtering) ──────────────────────
    daily_by_machine = (
        df2.group_by(["date", "machine", "category", "source"])
           .agg([
               pl.col("quantity").max().alias("quantity"),
               pl.col("speed").mean().alias("avg_speed"),
               pl.col("speed").max().alias("max_speed"),
               pl.col("is_active").mean().mul(100).round(1).alias("uptime_pct"),
               pl.len().alias("readings"),
           ])
           .sort(["date", "machine"])
    )

    def to_records(frame: pl.DataFrame) -> list[dict]:
        return frame.to_dicts()

    stats = {
        "summary": {
            "total_quantity":   round(total_quantity, 2),
            "avg_speed":        round(avg_speed, 2),
            "uptime_pct":       uptime_pct,
            "total_readings":   total_readings,
            "active_readings":  active_readings,
            "unique_machines":  unique_machines,
            "unique_dates":     unique_dates,
            "files_processed":  n_ok,
            "files_skipped":    n_skip,
        },
        "daily_by_machine": to_records(daily_by_machine),
        # Legacy static stats (kept for fallback)
        "daily_production": to_records(daily_prod),
        "daily_uptime":     to_records(daily_uptime),
        "by_machine":       to_records(by_machine),
        "top_machines":     to_records(top_machines),
        "by_source":        to_records(by_source),
        "by_category":      to_records(by_category),
    }

    logger.info(
        f"Machines: {unique_machines} | Days: {unique_dates} | "
        f"Uptime: {uptime_pct}% | Avg speed: {avg_speed:.1f}"
    )
    return stats


# ── Write outputs ──────────────────────────────────────────────────────────
def write_outputs(master: pl.DataFrame, stats: dict) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    master_path = OUTPUT_DIR / "master_data.csv"
    stats_path  = OUTPUT_DIR / "summary_stats.json"

    logger.info(f"Writing {master_path} ...")
    # Serialise Datetime → string for CSV
    out = master.with_columns(pl.col("ts").dt.to_string("%Y-%m-%d %H:%M:%S"))
    out.write_csv(str(master_path))

    logger.info(f"Writing {stats_path} ...")
    def _serialise(obj):
        import datetime
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return str(obj)
        raise TypeError(f"Not serialisable: {type(obj)}")

    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, default=_serialise)

    logger.success(
        f"Pipeline complete — {len(master):,} rows | "
        f"master_data.csv ({master_path.stat().st_size // 1024} KB) | "
        f"summary_stats.json written."
    )


# ── Entry point ────────────────────────────────────────────────────────────
def main() -> None:
    setup_logging()

    paths = discover_files()
    if not paths:
        logger.error(f"No CSV files found under {RAW_DIR}")
        sys.exit(1)

    frames = ingest_files(paths)
    if not frames:
        logger.error("No valid frames loaded — aborting.")
        sys.exit(1)

    n_ok   = len(frames)
    n_skip = len(paths) - n_ok

    master = merge_and_clean(frames)
    stats  = compute_stats(master, n_ok, n_skip)
    write_outputs(master, stats)


if __name__ == "__main__":
    main()
