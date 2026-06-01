'use client'

import React, { createContext, useContext, useState, useMemo } from 'react'
import statsData from '../../public/data/summary_stats.json'

// Get all unique dates from the daily_by_machine data and sort them chronologically
const ALL_DATES = Array.from(new Set(statsData.daily_by_machine.map(d => d.date))).sort()

type TimelineContextType = {
  startDate: string
  endDate: string
  setStartDate: (d: string) => void
  setEndDate: (d: string) => void
  allDates: string[]
  setPreset: (days: number) => void
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined)

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  const [startDate, setStartDate] = useState<string>(ALL_DATES[0] || '')
  const [endDate, setEndDate] = useState<string>(ALL_DATES[ALL_DATES.length - 1] || '')

  const setPreset = (days: number) => {
    if (ALL_DATES.length === 0) return
    if (days === 0) { // All time
      setStartDate(ALL_DATES[0])
      setEndDate(ALL_DATES[ALL_DATES.length - 1])
    } else {
      const end = ALL_DATES[ALL_DATES.length - 1]
      const startIdx = Math.max(0, ALL_DATES.length - days)
      const start = ALL_DATES[startIdx]
      setStartDate(start)
      setEndDate(end)
    }
  }

  const value = useMemo(() => ({
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    allDates: ALL_DATES,
    setPreset
  }), [startDate, endDate])

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  )
}

export function useTimeline() {
  const ctx = useContext(TimelineContext)
  if (!ctx) throw new Error('useTimeline must be used within TimelineProvider')
  return ctx
}
