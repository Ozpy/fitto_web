import React, { useState, useEffect, useRef } from 'react'
import * as Icons from 'lucide-react'
import { Question } from '@/types/onboarding'

type Props = {
  question: Question
  value: string | null
  onChange: (value: string) => void
}

export default function DatePicker({ question, value, onChange }: Props) {
  // Parse initial YYYY-MM-DD value
  const initialYear = value ? value.split('-')[0] : ''
  const initialMonth = value ? value.split('-')[1] : ''
  const initialDay = value ? value.split('-')[2] : ''

  const [day, setDay] = useState(initialDay)
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)

  const dayRef = useRef<HTMLInputElement>(null)
  const monthRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)

  // Sync state if value changes from parent (e.g., initial load or F5 rehydration)
  useEffect(() => {
    if (value) {
      const parts = value.split('-')
      if (parts.length === 3) {
        setYear(parts[0])
        setMonth(parts[1])
        setDay(parts[2])
      }
    }
  }, [value])

  // Propagate combined YYYY-MM-DD back to parent onChange whenever inputs change
  const propagateChange = (d: string, m: string, y: string) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      const formatted = `${y}-${m}-${d}`
      onChange(formatted)
    } else {
      onChange('')
    }
  }

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 2) val = val.slice(0, 2)

    setDay(val)
    propagateChange(val, month, year)

    if (val.length === 2) {
      monthRef.current?.focus()
    }
  }

  const handleDayBlur = () => {
    if (!day) return
    let num = parseInt(day, 10)
    if (isNaN(num)) return
    if (num > 31) num = 31
    if (num < 1) num = 1
    const formatted = String(num).padStart(2, '0')
    setDay(formatted)
    propagateChange(formatted, month, year)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 2) val = val.slice(0, 2)

    setMonth(val)
    propagateChange(day, val, year)

    if (val.length === 2) {
      yearRef.current?.focus()
    }
  }

  const handleMonthBlur = () => {
    if (!month) return
    let num = parseInt(month, 10)
    if (isNaN(num)) return
    if (num > 12) num = 12
    if (num < 1) num = 1
    const formatted = String(num).padStart(2, '0')
    setMonth(formatted)
    propagateChange(day, formatted, year)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 4) val = val.slice(0, 4)

    setYear(val)
    propagateChange(day, month, val)
  }

  const handleYearBlur = () => {
    if (!year) return
    let num = parseInt(year, 10)
    if (isNaN(num)) return
    const currentYear = new Date().getFullYear()
    if (num > currentYear) num = currentYear
    if (num < 1900) num = 1900
    const formatted = String(num)
    setYear(formatted)
    propagateChange(day, month, formatted)
  }

  const handleMonthKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !month) {
      dayRef.current?.focus()
    }
  }

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !year) {
      monthRef.current?.focus()
    }
  }

  // Pre-fill a standard default date of birth if nothing is specified yet (so user has a quick-jump baseline)
  const handleUseDefault = () => {
    const defaultDate = new Date()
    defaultDate.setFullYear(defaultDate.getFullYear() - 25) // 25 years ago
    const y = String(defaultDate.getFullYear())
    const m = '01'
    const d = '01'
    setDay(d)
    setMonth(m)
    setYear(y)
    onChange(`${y}-${m}-${d}`)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 3 Input Boxes lined up horizontally */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {/* Dia */}
        <div className="flex flex-col gap-1.5 bg-muted/20 border border-border/80 rounded-2xl p-3 focus-within:border-primary transition-all">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">
            Día
          </label>
          <input
            ref={dayRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={day}
            onChange={handleDayChange}
            onBlur={handleDayBlur}
            placeholder="DD"
            className="w-full bg-transparent border-none text-center text-xl font-black text-foreground outline-none focus:outline-none focus:ring-0 placeholder-muted-foreground/45"
          />
        </div>

        {/* Mes */}
        <div className="flex flex-col gap-1.5 bg-muted/20 border border-border/80 rounded-2xl p-3 focus-within:border-primary transition-all">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">
            Mes
          </label>
          <input
            ref={monthRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={month}
            onChange={handleMonthChange}
            onBlur={handleMonthBlur}
            onKeyDown={handleMonthKeyDown}
            placeholder="MM"
            className="w-full bg-transparent border-none text-center text-xl font-black text-foreground outline-none focus:outline-none focus:ring-0 placeholder-muted-foreground/45"
          />
        </div>

        {/* Año */}
        <div className="flex flex-col gap-1.5 bg-muted/20 border border-border/80 rounded-2xl p-3 focus-within:border-primary transition-all">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">
            Año
          </label>
          <input
            ref={yearRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={year}
            onChange={handleYearChange}
            onBlur={handleYearBlur}
            onKeyDown={handleYearKeyDown}
            placeholder="AAAA"
            className="w-full bg-transparent border-none text-center text-xl font-black text-foreground outline-none focus:outline-none focus:ring-0 placeholder-muted-foreground/45"
          />
        </div>
      </div>

      {/* Quick Option for "No estoy seguro" / IA Default birth date (25 years ago) */}
      <button
        type="button"
        onClick={handleUseDefault}
        className="w-full py-3.5 px-4 rounded-2xl border border-border bg-card hover:bg-accent/40 text-xs font-black text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Icons.Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <span>No sé / Usar promedio estándar (25 años)</span>
      </button>
    </div>
  )
}
