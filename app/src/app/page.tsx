'use client'

import { useDynamicStats, fmt, fmtNum, fmtPct } from '@/lib/stats'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, ComposedChart
} from 'recharts'
import TimelineSelector from '@/components/TimelineSelector'

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#a855f7']

export default function HomePage() {
  const stats = useDynamicStats()
  const { summary, daily_production, daily_uptime, top_machines, by_category } = stats

  const kpis = [
    {
      label: 'Total Production',
      value: fmtNum(summary.total_quantity),
      sub: 'Cumulative quantity across all machines',
      icon: '🏭',
      color: '#6366f1',
      trend: `${summary.unique_machines} machines active`,
    },
    {
      label: 'Fleet Uptime',
      value: `${summary.uptime_pct}%`,
      sub: `${fmtNum(summary.active_readings)} active / ${fmtNum(summary.total_readings)} total readings`,
      icon: '⚡',
      color: summary.uptime_pct >= 70 ? '#10b981' : summary.uptime_pct >= 50 ? '#f59e0b' : '#ef4444',
      trend: summary.uptime_pct >= 70 ? '✓ Healthy' : summary.uptime_pct >= 50 ? '⚠ Moderate' : '⚠ Low uptime',
    },
    {
      label: 'Avg Speed',
      value: fmt(summary.avg_speed),
      sub: 'Average line speed across all readings',
      icon: '🔄',
      color: '#06b6d4',
      trend: 'Across all machine types',
    },
    {
      label: 'Days Covered',
      value: `${summary.unique_dates}`,
      sub: `${summary.files_processed} CSV files processed`,
      icon: '📅',
      color: '#8b5cf6',
      trend: `${summary.files_skipped} files skipped`,
    },
  ]

  const dailyProdData = (daily_production as any[]).map(d => ({
    date: d.date?.slice(5),  // MM-DD
    qty: Math.round(d.total_qty),
  }))

  const dailyUptimeData = (daily_uptime as any[]).map(d => ({
    date: d.date?.slice(5),
    uptime: d.uptime_pct,
    speed: d.avg_speed,
  }))

  const topMachineData = (top_machines as any[]).slice(0, 8).map(m => ({
    name: m.machine.length > 18 ? m.machine.slice(0, 18) + '…' : m.machine,
    qty: Math.round(m.total_quantity),
    uptime: m.uptime_pct,
  }))

  const categoryData = (by_category as any[]).slice(0, 6).map(c => ({
    name: c.category || 'Other',
    qty: Math.round(c.total_quantity),
    uptime: c.uptime_pct,
  }))

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container">
          <div className="hero-tag">
            <span className="status-dot" />
            Live Manufacturing Intelligence
          </div>
          <h1>Cable Factory<br />Machine Dashboard</h1>
          <p>
            Real-time telemetry from <strong>{summary.unique_machines} machines</strong> across{' '}
            <strong>{summary.unique_dates} production days</strong>.{' '}
            {fmtNum(summary.total_readings)} sensor readings processed in parallel using
            Polars + ThreadPoolExecutor.
          </p>
          <div className="hero-actions">
            <Link href="/charts" className="btn btn-primary">📈 Analytics</Link>
            <Link href="/machines" className="btn btn-outline">🤖 All Machines</Link>
            <Link href="/pipeline" className="btn btn-outline">⚙️ Pipeline</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <TimelineSelector />
          
          {/* ── KPI Cards ───────────────────────────────── */}
          <div className="grid-4" style={{ marginTop: 24 }}>
            {kpis.map((k, i) => (
              <div key={k.label} className={`card animate-fade-up delay-${i+1}`}
                style={{ borderLeft: `3px solid ${k.color}` }}>
                <div className="card-header">
                  <span className="card-title">{k.label}</span>
                  <div className="card-icon" style={{ background: `${k.color}22` }}>{k.icon}</div>
                </div>
                <div className="card-value" style={{ color: k.color }}>{k.value}</div>
                <div className="card-sub">{k.sub}</div>
                <div className="card-trend trend-up" style={{ marginTop: 8, fontSize: '0.78rem' }}>{k.trend}</div>
              </div>
            ))}
          </div>

          {/* ── Daily Production + Uptime ─────────────── */}
          <div className="grid-2 animate-fade-up delay-2">
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-title">Day-Wise Analysis (Volume vs Uptime)</div>
                <div className="chart-subtitle">Daily production volume and fleet uptime %</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={dailyUptimeData.map((d,i) => ({...d, qty: dailyProdData[i]?.qty || 0}))}>
                  <defs>
                    <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v => fmtNum(v)} />
                  <YAxis yAxisId="right" orientation="right" domain={[0,100]} tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ background:'#16161f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f0f0f8', fontSize:'0.8rem' }} />
                  <Area yAxisId="left" type="monotone" dataKey="qty" name="Quantity" stroke="#6366f1" strokeWidth={2} fill="url(#prodGrad)" />
                  <Line yAxisId="right" type="monotone" dataKey="uptime" name="Uptime %" stroke="#10b981" strokeWidth={2} dot={{ r:3 }} activeDot={{ r:5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-title">Daily Fleet Uptime %</div>
                <div className="chart-subtitle">Percentage of readings with speed &gt; 0</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dailyUptimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0,100]} tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ background:'#16161f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f0f0f8', fontSize:'0.8rem' }}
                    formatter={(v:any) => [`${Number(v).toFixed(1)}%`, 'Uptime']} />
                  <Line type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2}
                    dot={{ r:3, fill:'#10b981' }} activeDot={{ r:5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Top Machines + Categories ─────────────── */}
          <div className="grid-2 animate-fade-up delay-3">
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-title">Top 8 Machines by Production</div>
                <div className="chart-subtitle">Highest cumulative quantity output</div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topMachineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false}
                    tickFormatter={v => fmtNum(v)} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background:'#16161f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f0f0f8', fontSize:'0.8rem' }}
                    formatter={(v:any) => [fmtNum(v), 'Quantity']} />
                  <Bar dataKey="qty" radius={[0,4,4,0]}>
                    {topMachineData.map((_:any, i:number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-title">Production by Machine Category</div>
                <div className="chart-subtitle">Grouped by machine type prefix</div>
              </div>
              <div className="rank-list" style={{ marginTop: 8 }}>
                {categoryData.map((c:any, i:number) => {
                  const max = categoryData[0]?.qty ?? 1
                  const pct = (c.qty / max) * 100
                  return (
                    <div key={c.name} className="rank-item">
                      <div className="rank-num">{i+1}</div>
                      <div className="rank-info">
                        <div className="rank-name">{c.name}</div>
                        <div className="progress-bar-track" style={{ marginTop:5 }}>
                          <div className="progress-bar-fill"
                            style={{ width:`${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                        <div className="rank-meta">{c.uptime}% uptime</div>
                      </div>
                      <div className="rank-value">{fmtNum(c.qty)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  )
}
