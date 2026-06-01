'use client'

import { useState, useMemo } from 'react'
import { useDynamicStats, fmtNum, fmt, fmtPct, uptimeBadge } from '@/lib/stats'
import TimelineSelector from '@/components/TimelineSelector'

const PAGE_SIZE = 25

export default function MachinesPage() {
  const stats = useDynamicStats()
  const allMachines = stats.by_machine as any[]

  const [search, setSearch]   = useState('')
  const [sortCol, setSortCol] = useState<string>('total_quantity')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage]       = useState(1)

  const filtered = useMemo(() => {
    let rows = allMachines
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r.machine?.toLowerCase().includes(q))
    }
    return [...rows].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol]
      if (typeof av === 'number') return sortAsc ? av - bv : bv - av
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
  }, [allMachines, search, sortCol, sortAsc])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageRows   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const handleSort = (col: string) => {
    if (col === sortCol) setSortAsc(!sortAsc)
    else { setSortCol(col); setSortAsc(false) }
    setPage(1)
  }
  const SortIcon = ({ col }: { col: string }) =>
    sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ' ·'

  const maxQty = allMachines[0]?.total_quantity ?? 1

  return (
    <div className="section">
      <div className="container">
        <div className="section-header animate-fade-up">
          <div>
            <h1 className="section-title">Machine Fleet</h1>
            <p className="section-subtitle">
              All {allMachines.length} machines — production, speed &amp; uptime metrics
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <TimelineSelector />
        </div>

        {/* Search */}
        <div className="card animate-fade-up delay-1" style={{ marginBottom:20 }}>
          <div className="filter-row">
            <div className="search-wrapper" style={{ flex:1 }}>
              <span className="search-icon">🔍</span>
              <input id="machine-search" className="search-input" type="text"
                placeholder="Search by machine name…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
              {filtered.length} machines
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper animate-fade-up delay-2">
          <table>
            <thead>
              <tr>
                <th style={{ cursor:'pointer' }} onClick={() => handleSort('machine')}>
                  MACHINE <SortIcon col="machine" />
                </th>
                <th style={{ cursor:'pointer', textAlign:'right' }} onClick={() => handleSort('total_quantity')}>
                  TOTAL QTY <SortIcon col="total_quantity" />
                </th>
                <th style={{ cursor:'pointer', textAlign:'right' }} onClick={() => handleSort('avg_speed')}>
                  AVG SPEED <SortIcon col="avg_speed" />
                </th>
                <th style={{ cursor:'pointer', textAlign:'right' }} onClick={() => handleSort('max_speed')}>
                  MAX SPEED <SortIcon col="max_speed" />
                </th>
                <th style={{ cursor:'pointer', textAlign:'right' }} onClick={() => handleSort('uptime_pct')}>
                  UPTIME <SortIcon col="uptime_pct" />
                </th>
                <th style={{ cursor:'pointer', textAlign:'right' }} onClick={() => handleSort('readings')}>
                  READINGS <SortIcon col="readings" />
                </th>
                <th>PRODUCTION BAR</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((m: any, i: number) => {
                const barPct = (m.total_quantity / maxQty) * 100
                return (
                  <tr key={`${m.machine}-${i}`}>
                    <td style={{ fontWeight:600, fontSize:'0.82rem', maxWidth:260 }}>
                      <span title={m.machine} style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {m.machine}
                      </span>
                    </td>
                    <td style={{ textAlign:'right', fontWeight:700 }}>{fmtNum(m.total_quantity)}</td>
                    <td style={{ textAlign:'right' }}>{fmt(m.avg_speed)}</td>
                    <td style={{ textAlign:'right' }}>{fmt(m.max_speed)}</td>
                    <td style={{ textAlign:'right' }}>
                      <span className={`badge ${uptimeBadge(m.uptime_pct)}`}>
                        {fmtPct(m.uptime_pct)}
                      </span>
                    </td>
                    <td style={{ textAlign:'right', color:'var(--text-secondary)' }}>{fmtNum(m.readings)}</td>
                    <td style={{ minWidth:120 }}>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width:`${barPct}%` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination animate-fade-up delay-3">
          <span>
            Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination-btns">
            <button id="prev-page" className="page-btn" disabled={page<=1} onClick={() => setPage(page-1)}>← Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page-2, totalPages-4)) + i
              return (
                <button key={p} id={`page-btn-${p}`}
                  className={`page-btn ${p===page ? 'active' : ''}`}
                  onClick={() => setPage(p)}>{p}</button>
              )
            })}
            <button id="next-page" className="page-btn" disabled={page>=totalPages} onClick={() => setPage(page+1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
