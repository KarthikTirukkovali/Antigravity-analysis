'use client'

import { useTimeline } from '@/lib/TimelineContext'

export default function TimelineSelector() {
  const { startDate, endDate, setStartDate, setEndDate, allDates, setPreset } = useTimeline()

  if (!allDates.length) return null

  return (
    <div className="timeline-selector" style={{ display:'flex', alignItems:'center', gap:16, background:'rgba(255,255,255,0.03)', padding:'10px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', flexWrap:'wrap' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:600 }}>Timeline:</span>
        <select value={startDate} onChange={e => setStartDate(e.target.value)} className="select-input" style={{ background:'#16161f', color:'#fff', border:'1px solid rgba(255,255,255,0.1)', padding:'4px 8px', borderRadius:4, fontSize:'0.85rem' }}>
          {allDates.map(d => <option key={`start-${d}`} value={d}>{d}</option>)}
        </select>
        <span style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>to</span>
        <select value={endDate} onChange={e => setEndDate(e.target.value)} className="select-input" style={{ background:'#16161f', color:'#fff', border:'1px solid rgba(255,255,255,0.1)', padding:'4px 8px', borderRadius:4, fontSize:'0.85rem' }}>
          {allDates.map(d => <option key={`end-${d}`} value={d}>{d}</option>)}
        </select>
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => setPreset(7)} className="preset-btn" style={presetBtnStyle}>Last 7 Days</button>
        <button onClick={() => setPreset(15)} className="preset-btn" style={presetBtnStyle}>Last 15 Days</button>
        <button onClick={() => setPreset(0)} className="preset-btn" style={presetBtnStyle}>All Time</button>
      </div>
    </div>
  )
}

const presetBtnStyle = {
  background: 'rgba(99,102,241,0.1)',
  border: '1px solid rgba(99,102,241,0.3)',
  color: '#818cf8',
  padding: '4px 12px',
  borderRadius: 4,
  fontSize: '0.75rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}
