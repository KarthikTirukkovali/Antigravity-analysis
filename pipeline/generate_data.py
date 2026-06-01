"""
generate_data.py
----------------
Generates 1000 synthetic CSV sales-transaction files in ../raw_data/.
~5% are intentionally corrupt/empty to exercise the pipeline's error handling.
"""

import os
import random
import csv
import string
from datetime import datetime, timedelta

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "raw_data")
NUM_FILES = 1000
ROWS_PER_FILE = random.randint  # will call per file
CORRUPT_RATIO = 0.05            # 5 % corrupt files
SEED = 42

random.seed(SEED)

PRODUCTS = [
    "Laptop", "Keyboard", "Mouse", "Monitor", "Webcam",
    "Headset", "USB Hub", "SSD Drive", "RAM Module", "GPU Card",
    "Smartphone", "Tablet", "Charger", "Cable", "Desk Lamp",
]
CATEGORIES = {
    "Laptop": "Computers", "Keyboard": "Peripherals", "Mouse": "Peripherals",
    "Monitor": "Displays", "Webcam": "Peripherals", "Headset": "Audio",
    "USB Hub": "Accessories", "SSD Drive": "Storage", "RAM Module": "Components",
    "GPU Card": "Components", "Smartphone": "Mobile", "Tablet": "Mobile",
    "Charger": "Accessories", "Cable": "Accessories", "Desk Lamp": "Furniture",
}
REGIONS = ["North", "South", "East", "West", "Central"]
STATUSES = ["Completed", "Pending", "Refunded", "Cancelled"]
STATUS_WEIGHTS = [0.70, 0.15, 0.10, 0.05]

UNIT_PRICES = {
    "Laptop": (699, 1999), "Keyboard": (25, 150), "Mouse": (15, 120),
    "Monitor": (199, 799), "Webcam": (39, 199), "Headset": (49, 399),
    "USB Hub": (15, 75), "SSD Drive": (69, 499), "RAM Module": (39, 299),
    "GPU Card": (299, 1599), "Smartphone": (299, 1299), "Tablet": (199, 899),
    "Charger": (15, 60), "Cable": (8, 35), "Desk Lamp": (19, 99),
}


def random_date(start: datetime, end: datetime) -> str:
    delta = end - start
    return (start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))).strftime("%Y-%m-%d")


def random_customer_id() -> str:
    return "CUST-" + "".join(random.choices(string.digits, k=6))


def random_order_id(file_idx: int, row_idx: int) -> str:
    return f"ORD-{file_idx:04d}-{row_idx:04d}"


def generate_row(file_idx: int, row_idx: int) -> dict:
    product = random.choice(PRODUCTS)
    lo, hi = UNIT_PRICES[product]
    unit_price = round(random.uniform(lo, hi), 2)
    quantity = random.randint(1, 10)
    return {
        "order_id":    random_order_id(file_idx, row_idx),
        "customer_id": random_customer_id(),
        "product":     product,
        "category":    CATEGORIES[product],
        "quantity":    quantity,
        "unit_price":  unit_price,
        "total":       round(unit_price * quantity, 2),
        "date":        random_date(datetime(2022, 1, 1), datetime(2025, 12, 31)),
        "region":      random.choice(REGIONS),
        "status":      random.choices(STATUSES, STATUS_WEIGHTS)[0],
    }


FIELDNAMES = ["order_id", "customer_id", "product", "category",
              "quantity", "unit_price", "total", "date", "region", "status"]


def write_clean_file(path: str, file_idx: int) -> None:
    n_rows = random.randint(50, 200)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for row_idx in range(n_rows):
            writer.writerow(generate_row(file_idx, row_idx))


def write_corrupt_file(path: str, kind: str) -> None:
    """Write an intentionally bad file."""
    with open(path, "w", encoding="utf-8") as f:
        if kind == "empty":
            pass  # zero bytes
        elif kind == "header_only":
            f.write(",".join(FIELDNAMES) + "\n")
        elif kind == "garbled":
            f.write("!!! CORRUPTED DATA !!!\n" + "xyz" * 200)
        elif kind == "partial":
            f.write("order_id,customer_id\n")
            f.write("ORD-9999-0001,CUST-000001\n")


def main():
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    corrupt_indices = set(random.sample(range(NUM_FILES), int(NUM_FILES * CORRUPT_RATIO)))
    corrupt_kinds = ["empty", "header_only", "garbled", "partial"]

    print(f"Generating {NUM_FILES} files -> {RAW_DATA_DIR}")
    for i in range(NUM_FILES):
        filename = f"sales_{i+1:04d}.csv"
        path = os.path.join(RAW_DATA_DIR, filename)
        if i in corrupt_indices:
            kind = random.choice(corrupt_kinds)
            write_corrupt_file(path, kind)
        else:
            write_clean_file(path, i + 1)

    total_corrupt = len(corrupt_indices)
    print(f"Done. {NUM_FILES - total_corrupt} clean files, {total_corrupt} corrupt files.")


if __name__ == "__main__":
    main()
