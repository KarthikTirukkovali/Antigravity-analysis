'use client'

import { useDynamicStats, fmtNum, fmt, fmtPct } from '@/lib/stats'

const LOG_SAMPLE = [
  { time:'12:12:36', level:'INFO',    msg:'Pipeline started  RAW_DIR=.../Raw data' },
  { time:'12:12:36', level:'INFO',    msg:'Using 16 worker threads (ThreadPoolExecutor)' },
  { time:'12:12:36', level:'INFO',    msg:'Discovered 1646 CSV files across 28 date folders (machines/ + MC/)' },
  { time:'12:12:36', level:'INFO',    msg:'Reading 1646 files with 16 threads ...' },
  { time:'12:12:37', level:'DEBUG',   msg:'OK  machine-60MM-PVC-EXTRUDER,-SUPERMAC-8-1-2025.csv (480 rows)' },
  { time:'12:12:37', level:'DEBUG',   msg:'OK  machine-GC-Taping-A-8-1-2025.csv (480 rows)' },
  { time:'12:12:37', level:'DEBUG',   msg:'OK  machine-RC-EXT-70A-8-31-2025.csv (480 rows)' },
  { time:'12:12:37', level:'DEBUG',   msg:'OK  machine-Sintering-Line-1-Old-salt-bath-8-31-2025.csv (480 rows)' },
  { time:'12:12:38', level:'INFO',    msg:'Ingestion done in 1.51s — 1646 succeeded, 0 skipped' },
  { time:'12:12:38', level:'INFO',    msg:'Merging frames ...' },
  { time:'12:12:38', level:'INFO',    msg:'Master: 2,065,416 rows x 7 cols (ts, date, machine, source, quantity, speed, is_active)' },
  { time:'12:12:38', level:'INFO',    msg:'Computing aggregate statistics ...' },
  { time:'12:12:39', level:'INFO',    msg:'Machines: 131 | Days: 30 | Uptime: 52.07% | Avg speed: 36.7' },
  { time:'12:12:39', level:'INFO',    msg:'Writing output/master_data.csv ...' },
  { time:'12:12:40', level:'INFO',    msg:'Writing output/summary_stats.json ...' },
  { time:'12:12:40', level:'SUCCESS', msg:'Pipeline complete — 2,065,416 rows | master_data.csv (163 MB) | summary_stats.json written.' },
]

const LEVEL_STYLE: Record<string, { color:string; bg:string }> = {
  INFO:    { color:'#60a5fa', bg:'rgba(96,165,250,0.1)'  },
  DEBUG:   { color:'#8888aa', bg:'rgba(136,136,170,0.08)' },
  WARNING: { color:'#fbbf24', bg:'rgba(251,191,36,0.1)'  },
  ERROR:   { color:'#f87171', bg:'rgba(248,113,113,0.1)' },
  SUCCESS: { color:'#34d399', bg:'rgba(52,211,153,0.12)' },
}

const TECH = [
  { icon:'🦀', name:'Polars',              version:'1.41.2', desc:'Rust-native DataFrame engine. Merges 2M rows from 1646 files in under 2 seconds.',                     color:'#6366f1' },
  { icon:'🔀', name:'ThreadPoolExecutor',  version:'stdlib', desc:'16 threads dispatch all 1646 CSV reads concurrently. I/O bound — ideal for parallel file reads.',       color:'#8b5cf6' },
  { icon:'📋', name:'Loguru',              version:'0.7.3',  desc:'Structured logging with rotation. Every skipped file audited; pipeline never crashes.',                  color:'#06b6d4' },
  { icon:'⏳', name:'tqdm',                version:'4.67.3', desc:'Real-time progress bar across 1646 futures — essential for monitoring large parallel ingestion.',        color:'#10b981' },
]

const STEPS = [
  { icon:'📂', label:'Discover Files',    desc:'Walk Raw data/<DDMMYYYY>/machines/ and MC/ — collect all *.csv paths' },
  { icon:'🔤', label:'Parse Filenames',   desc:'Extract machine name + date from filename pattern: machine-{Name}-{M}-{D}-{YYYY}.csv' },
  { icon:'⚡', label:'Parallel Ingest',   desc:'ThreadPoolExecutor(16) dispatches all 1646 file reads simultaneously' },
  { icon:'🧪', label:'Schema Validate',   desc:'Check timestamp, quantity, speed columns; parse timestamps; enrich with machine/date/source' },
  { icon:'🚩', label:'Uptime Flag',       desc:'is_active = (speed > 0) — marks every reading as active or idle' },
  { icon:'🔗', label:'Merge 1646 Frames', desc:'pl.concat with diagonal_relaxed — produces 2,065,416 row master DataFrame' },
  { icon:'📊', label:'Aggregate Stats',   desc:'Group by machine, date, category — compute production, uptime %, avg/max speed' },
  { icon:'💾', label:'Write Outputs',     desc:'master_data.csv (163 MB) + summary_stats.json → output/' },
]

export default function PipelinePage() {
  const { summary } = useDynamicStats()

  const chips = [
    { label:'Files',        value: fmtNum(summary.files_processed), color:'#6366f1' },
    { label:'Rows',         value: fmtNum(summary.total_readings),  color:'#8b5cf6' },
    { label:'Machines',     value: String(summary.unique_machines),  color:'#06b6d4' },
    { label:'Days',         value: String(summary.unique_dates),     color:'#10b981' },
    { label:'Fleet Uptime', value: fmtPct(summary.uptime_pct),      color:'#f59e0b' },
    { label:'Run Time',     value:'~1.5 seconds',                    color:'#ec4899' },
  ]

  return (
    <div className="section">
      <div className="container">
        <div className="section-header animate-fade-up">
          <div>
            <h1 className="section-title">Pipeline Architecture</h1>
            <p className="section-subtitle">
              How 1,646 machine telemetry files are processed in parallel to produce 2M+ row analytics
            </p>
          </div>
          <div className="pipeline-status">
            <span className="status-dot" />
            Last run successful
          </div>
        </div>

        {/* Chips */}
        <div style={{ display:'flex', gap:12, marginBottom:28, flexWrap:'wrap' }} className="animate-fade-up delay-1">
          {chips.map(c => (
            <div key={c.label} style={{ padding:'10px 18px', background:`${c.color}15`, border:`1px solid ${c.color}40`, borderRadius:100, display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:'0.75rem', color:'#8888aa', fontWeight:600 }}>{c.label}</span>
              <span style={{ fontSize:'0.9rem', color:c.color, fontWeight:800 }}>{c.value}</span>
            </div>
          ))}
        </div>

        <div className="grid-2 animate-fade-up delay-2">
          {/* Steps */}
          <div className="card">
            <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:16 }}>Pipeline Steps</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {STEPS.map((s, i) => (
                <div key={s.label} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'11px 13px', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width:30, height:30, borderRadius:7, background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>{s.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:'0.875rem', display:'flex', justifyContent:'space-between' }}>
                      <span>{i+1}. {s.label}</span>
                      <span style={{ fontSize:'0.72rem', color:'#34d399' }}>✓</span>
                    </div>
                    <div style={{ fontSize:'0.77rem', color:'var(--text-secondary)', marginTop:3 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack */}
          <div className="card">
            <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:16 }}>Technology Stack</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {TECH.map(t => (
                <div key={t.name} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'12px 14px', background:`${t.color}0a`, borderRadius:10, border:`1px solid ${t.color}25` }}>
                  <div style={{ fontSize:'1.5rem' }}>{t.icon}</div>
                  <div>
                    <div style={{ fontWeight:700, color:t.color, fontSize:'0.9rem' }}>
                      {t.name}
                      <span style={{ fontWeight:400, color:'var(--text-muted)', fontSize:'0.75rem', marginLeft:6 }}>v{t.version}</span>
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginTop:3 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Log viewer */}
        <div className="chart-card animate-fade-up delay-3">
          <div className="chart-card-header">
            <div className="chart-title">Pipeline Log — Last Run</div>
            <div className="chart-subtitle">output/pipeline.log — structured audit trail</div>
          </div>
          <div style={{ background:'#0a0a0f', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', padding:16, fontFamily:'"Fira Code","Cascadia Code",monospace', fontSize:'0.78rem', lineHeight:1.8, maxHeight:380, overflowY:'auto' }}>
            {LOG_SAMPLE.map((entry, i) => {
              const s = LEVEL_STYLE[entry.level] ?? LEVEL_STYLE.INFO
              return (
                <div key={i} style={{ padding:'2px 8px', borderRadius:4, background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.015)', display:'flex', gap:12 }}>
                  <span style={{ color:'var(--text-muted)', flexShrink:0 }}>{entry.time}</span>
                  <span style={{ ...s, padding:'0 6px', borderRadius:3, fontWeight:700, fontSize:'0.72rem', flexShrink:0, display:'inline-flex', alignItems:'center', minWidth:64, justifyContent:'center' }}>{entry.level}</span>
                  <span style={{ color:'#c8c8e0' }}>{entry.msg}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
