'use client'

import { useDynamicStats, fmtNum, fmt, fmtPct } from '@/lib/stats'
import TimelineSelector from '@/components/TimelineSelector'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts'

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#a855f7']

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#16161f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', fontSize:'0.8rem', color:'#f0f0f8' }}>
      <div style={{ fontWeight:700, marginBottom:4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || '#a5b4fc' }}>{p.name}: {typeof p.value === 'number' ? (p.value > 100 ? fmtNum(p.value) : `${Number(p.value).toFixed(1)}`) : p.value}</div>
      ))}
    </div>
  )
}

export default function ChartsPage() {
  const stats = useDynamicStats()
  const { daily_production, daily_uptime, by_machine, top_machines, by_category } = stats

  const dailyProd = (daily_production as any[]).map(d => ({
    date: d.date?.slice(5), qty: Math.round(d.total_qty),
  }))

  const dailyUptime = (daily_uptime as any[]).map(d => ({
    date: d.date?.slice(5), uptime: d.uptime_pct, speed: d.avg_speed,
  }))

  const top10 = (top_machines as any[]).slice(0, 10).map(m => ({
    name: m.machine.length > 22 ? m.machine.slice(0, 22) + '…' : m.machine,
    qty: Math.round(m.total_quantity),
    uptime: m.uptime_pct,
    speed: m.avg_speed,
  }))

  const cats = (by_category as any[]).slice(0, 8).map(c => ({
    name: c.category || 'Other', qty: Math.round(c.total_quantity), uptime: c.uptime_pct,
  }))

  // Uptime distribution (radar over top 8 machines)
  const radarData = top10.slice(0, 7).map(m => ({
    machine: m.name.slice(0, 12),
    'Uptime %': m.uptime,
    'Rel Speed': Math.min(100, Math.round((m.speed / (stats.summary.avg_speed * 2)) * 100)),
  }))

  // Speed vs Uptime scatter (by machine)
  const scatterData = (by_machine as any[]).slice(0, 40).map(m => ({
    x: Math.round(m.avg_speed * 10) / 10,
    y: m.uptime_pct,
    name: m.machine,
  }))

  return (
    <div className="section">
      <div className="container">
        <div className="section-header animate-fade-up">
          <div>
            <h1 className="section-title">Production Analytics</h1>
            <p className="section-subtitle">Telemetry insights from {stats.summary.unique_machines} machines across {stats.summary.unique_dates} days</p>
          </div>
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <TimelineSelector />
        </div>

        {/* Row 1: Daily prod + uptime side by side */}
        <div className="grid-2 animate-fade-up delay-1">
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-title">Daily Production Volume</div>
              <div className="chart-subtitle">Total quantity across all machines per day</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyProd}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={fmtNum} />
                <Tooltip content={<TT />} />
                <Bar dataKey="qty" name="Quantity" radius={[4,4,0,0]}>
                  {dailyProd.map((_:any,i:number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-title">Daily Uptime & Avg Speed</div>
              <div className="chart-subtitle">Fleet uptime % and average line speed by day</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyUptime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0,100]} />
                <YAxis yAxisId="r" orientation="right" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<TT />} />
                <Legend wrapperStyle={{ color:'#8888aa', fontSize:11 }} />
                <Line yAxisId="l" type="monotone" dataKey="uptime" name="Uptime %" stroke="#10b981" strokeWidth={2} dot={{ r:2 }} activeDot={{ r:4 }} />
                <Line yAxisId="r" type="monotone" dataKey="speed" name="Avg Speed" stroke="#6366f1" strokeWidth={2} dot={{ r:2 }} activeDot={{ r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Top 10 machines bar (full width) */}
        <div className="chart-card animate-fade-up delay-2" style={{ marginBottom:20 }}>
          <div className="chart-card-header">
            <div className="chart-title">Top 10 Machines — Highest Uptime %</div>
            <div className="chart-subtitle">Machines ranked by uptime percentage</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top10} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" width={180} tick={{ fill:'#c0c0d8', fontSize:10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="uptime" name="Uptime %" radius={[0,4,4,0]}>
                {top10.map((_:any,i:number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Row 3: Category + Radar */}
        <div className="grid-2 animate-fade-up delay-3">
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-title">Production by Machine Category</div>
              <div className="chart-subtitle">Grouped by machine type</div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={fmtNum} />
                <Tooltip content={<TT />} />
                <Bar dataKey="qty" name="Quantity" radius={[4,4,0,0]}>
                  {cats.map((_:any,i:number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-title">Machine Performance Radar</div>
              <div className="chart-subtitle">Uptime vs relative speed — top 7 machines</div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="machine" tick={{ fill:'#8888aa', fontSize:10 }} />
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fill:'#555577', fontSize:9 }} />
                <Radar name="Uptime %" dataKey="Uptime %" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                <Radar name="Rel Speed" dataKey="Rel Speed" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                <Legend wrapperStyle={{ color:'#8888aa', fontSize:11 }} />
                <Tooltip contentStyle={{ background:'#16161f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f0f0f8', fontSize:'0.8rem' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 4: Speed vs Uptime scatter */}
        <div className="chart-card animate-fade-up delay-4">
          <div className="chart-card-header">
            <div className="chart-title">Speed vs Uptime — Machine Scatter</div>
            <div className="chart-subtitle">Each dot is one machine. High-right = best performers</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="x" name="Avg Speed" type="number" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} label={{ value:'Avg Speed', position:'insideBottomRight', fill:'#8888aa', fontSize:10, offset:-5 }} />
              <YAxis dataKey="y" name="Uptime %" type="number" tick={{ fill:'#8888aa', fontSize:10 }} tickLine={false} axisLine={false} domain={[0,100]} tickFormatter={v => `${v}%`} label={{ value:'Uptime %', angle:-90, position:'insideLeft', fill:'#8888aa', fontSize:10 }} />
              <ZAxis range={[40,40]} />
              <Tooltip cursor={{ strokeDasharray:'3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div style={{ background:'#16161f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', fontSize:'0.78rem', color:'#f0f0f8', maxWidth:220 }}>
                      <div style={{ fontWeight:700, marginBottom:4, wordBreak:'break-word' }}>{d?.name}</div>
                      <div>Speed: {d?.x}</div>
                      <div>Uptime: {d?.y}%</div>
                    </div>
                  )
                }}
              />
              <Scatter data={scatterData} fill="#6366f1" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
