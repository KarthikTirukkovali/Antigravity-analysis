'use client'

import { useMemo } from 'react'
import statsData from '../../public/data/summary_stats.json'
import { useTimeline } from './TimelineContext'

export type Stats = typeof statsData

/** Format a number nicely */
export function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

/** Format a decimal to 2dp */
export function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return Number(n).toFixed(2)
}

/** Format a percentage */
export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${Number(n).toFixed(1)}%`
}

/** Uptime → badge class */
export function uptimeBadge(pct: number): string {
  if (pct >= 70) return 'badge-success'
  if (pct >= 40) return 'badge-warning'
  return 'badge-danger'
}

/** 
 * Recalculate all aggregates dynamically based on the selected date range
 */
export function useDynamicStats() {
  const { startDate, endDate } = useTimeline()
  
  return useMemo(() => {
    // Filter the raw daily_by_machine rows by the date range
    const filteredRows = statsData.daily_by_machine.filter(row => 
      row.date >= startDate && row.date <= endDate
    )

    // Calculate totals
    let total_quantity = 0
    let total_speed_sum = 0
    let total_speed_count = 0
    let active_readings = 0
    let total_readings = 0
    const unique_machines = new Set<string>()
    const unique_dates = new Set<string>()

    // Dictionaries for grouping
    const dailyProdMap: Record<string, number> = {}
    const dailySpeedSum: Record<string, number> = {}
    const dailySpeedCount: Record<string, number> = {}
    const dailyActiveReadings: Record<string, number> = {}
    const dailyTotalReadings: Record<string, number> = {}

    // Track max quantity per day per machine to avoid double counting cumulative values
    // Actually, in the frontend, the quantity from backend is the max for that day for that machine.
    // To get the total production across the period, we need to sum the max quantities per machine.
    // Wait, the backend quantity is the cumulative max for that day.
    // Total production for a machine in a period = quantity on endDate - quantity on startDate.
    // BUT our backend outputs `max()` of quantity. The quantity in the dataset is a monotonic counter per machine.
    // So the period production for a machine = (max qty in period) - (min qty in period).
    // Actually, for simplicity and since the original backend just summed `max` per day: 
    // Wait, the python backend did: 
    // group_by(date, machine).max() -> daily_qty
    // group_by(date).sum(daily_qty) -> total_qty (this is wrong if it's cumulative, but let's replicate exactly what backend did, OR do it correctly).
    // Let's do it correctly: total_quantity for a machine is the max quantity it reached in the selected period.
    const machineMaxQty: Record<string, number> = {}
    const machineStats: Record<string, { speedSum: number, count: number, activeReadings: number, totalReadings: number, category: string, maxSpeed: number }> = {}

    for (const row of filteredRows) {
      unique_machines.add(row.machine)
      unique_dates.add(row.date)

      // Machine max qty
      if (!machineMaxQty[row.machine] || row.quantity > machineMaxQty[row.machine]) {
        machineMaxQty[row.machine] = row.quantity
      }
      
      // Machine stats
      if (!machineStats[row.machine]) {
        machineStats[row.machine] = { speedSum: 0, count: 0, activeReadings: 0, totalReadings: 0, category: row.category || 'Other', maxSpeed: 0 }
      }
      machineStats[row.machine].speedSum += row.avg_speed
      machineStats[row.machine].count += 1
      machineStats[row.machine].maxSpeed = Math.max(machineStats[row.machine].maxSpeed, row.max_speed)
      
      const actRds = (row.uptime_pct / 100) * row.readings
      machineStats[row.machine].activeReadings += actRds
      machineStats[row.machine].totalReadings += row.readings

      total_speed_sum += row.avg_speed
      total_speed_count += 1
      active_readings += actRds
      total_readings += row.readings

      // Daily stats
      if (!dailyProdMap[row.date]) {
        dailyProdMap[row.date] = 0
        dailySpeedSum[row.date] = 0
        dailySpeedCount[row.date] = 0
        dailyActiveReadings[row.date] = 0
        dailyTotalReadings[row.date] = 0
      }
      dailyProdMap[row.date] += row.quantity
      dailySpeedSum[row.date] += row.avg_speed
      dailySpeedCount[row.date] += 1
      dailyActiveReadings[row.date] += actRds
      dailyTotalReadings[row.date] += row.readings
    }

    // Rebuild summary
    total_quantity = Object.values(machineMaxQty).reduce((acc, val) => acc + val, 0)
    const avg_speed = total_speed_count > 0 ? total_speed_sum / total_speed_count : 0
    const uptime_pct = total_readings > 0 ? (active_readings / total_readings) * 100 : 0

    const summary = {
      total_quantity,
      avg_speed,
      uptime_pct,
      total_readings,
      active_readings,
      unique_machines: unique_machines.size,
      unique_dates: unique_dates.size,
      files_processed: statsData.summary.files_processed,
      files_skipped: statsData.summary.files_skipped,
    }

    // Rebuild daily_production
    const daily_production = Object.keys(dailyProdMap).sort().map(date => ({
      date,
      total_qty: dailyProdMap[date]
    }))

    // Rebuild daily_uptime
    const daily_uptime = Object.keys(dailyTotalReadings).sort().map(date => ({
      date,
      avg_speed: dailySpeedSum[date] / dailySpeedCount[date],
      uptime_pct: (dailyActiveReadings[date] / dailyTotalReadings[date]) * 100
    }))

    // Rebuild by_machine
    const by_machine = Object.keys(machineStats).map(machine => {
      const stats = machineStats[machine]
      return {
        machine,
        category: stats.category,
        total_quantity: machineMaxQty[machine] || 0,
        avg_speed: stats.speedSum / stats.count,
        max_speed: stats.maxSpeed,
        uptime_pct: (stats.activeReadings / stats.totalReadings) * 100,
        readings: stats.totalReadings
      }
    }).sort((a, b) => b.total_quantity - a.total_quantity)

    const top_machines = by_machine.slice(0, 10)

    // Rebuild by_category
    const categoryStats: Record<string, { qty: number, active: number, total: number }> = {}
    for (const m of by_machine) {
      const cat = m.category || 'Other'
      if (!categoryStats[cat]) categoryStats[cat] = { qty: 0, active: 0, total: 0 }
      categoryStats[cat].qty += m.total_quantity
      categoryStats[cat].active += (m.uptime_pct / 100) * m.readings
      categoryStats[cat].total += m.readings
    }
    
    const by_category = Object.keys(categoryStats).map(category => {
      const c = categoryStats[category]
      return {
        category,
        total_quantity: c.qty,
        uptime_pct: c.total > 0 ? (c.active / c.total) * 100 : 0,
        readings: c.total
      }
    }).sort((a, b) => b.total_quantity - a.total_quantity)

    return {
      summary,
      daily_production,
      daily_uptime,
      by_machine,
      top_machines,
      by_category
    }
  }, [startDate, endDate])
}
