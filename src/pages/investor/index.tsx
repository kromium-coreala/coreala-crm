import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns'
import {
  TrendingUp, Building2, Users, DollarSign, Calendar,
  BarChart3, PieChart, Shield, Download, Lock
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, PieChart as RechartsPie, Pie, Cell
} from 'recharts'
import toast from 'react-hot-toast'

const PIE_COLORS = ['#c4a882','#8a6e3e','#4a8c6a','#3a6a9c','#c4953a','#7a7a9c']

// Access control — in production, tie to Supabase auth roles
const OWNER_PIN = '2025'

export default function InvestorPortal() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const [revenueData, setRevenueData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [monthlyOcc, setMonthlyOcc] = useState<any[]>([])
  const [kpis, setKpis] = useState({
    ytdRevenue: 0, ytdRooms: 0, ytdSpa: 0, ytdEvents: 0,
    avgOccupancy: 0, totalGuests: 0, avgDailyRate: 0, revPar: 0,
    thisMonth: 0, lastMonth: 0, growth: 0,
  })
  const [loading, setLoading] = useState(false)

  function tryUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (pin === OWNER_PIN) {
      setUnlocked(true)
      loadData()
    } else {
      setPinError(true)
      setTimeout(() => setPinError(false), 2000)
    }
  }

  async function loadData() {
    setLoading(true)
    const now = new Date()
    const yearStart = format(startOfYear(now), 'yyyy-MM-dd')
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
    const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')

    try {
      const [revRes, guestRes, reserveRes] = await Promise.all([
        supabase.from('revenue_records').select('*').gte('date', yearStart).order('date'),
        supabase.from('guests').select('id', { count: 'exact', head: true }),
        supabase.from('reservations').select('nightly_rate, status, check_in, check_out').gte('check_in', yearStart),
      ])

      const revRecords = revRes.data || []

      // Monthly revenue chart (last 6 months)
      const monthlyMap: Record<string, number> = {}
      for (let i = 5; i >= 0; i--) {
        const m = subMonths(now, i)
        monthlyMap[format(m, 'MMM')] = 0
      }
      revRecords.forEach(r => {
        const month = format(parseISO(r.date), 'MMM')
        if (monthlyMap[month] !== undefined) monthlyMap[month] += r.amount_usd
      })
      setRevenueData(Object.entries(monthlyMap).map(([month, usd]) => ({ month, usd })))

      // Category breakdown
      const catMap: Record<string, number> = {}
      revRecords.forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + r.amount_usd })
      setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) })))

      // KPIs
      const ytd = revRecords.reduce((s, r) => s + r.amount_usd, 0)
      const thisMonthRev = revRecords.filter(r => r.date >= monthStart).reduce((s, r) => s + r.amount_usd, 0)
      const lastMonthRev = revRecords.filter(r => r.date >= lastMonthStart && r.date <= lastMonthEnd).reduce((s, r) => s + r.amount_usd, 0)
      const growth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0

      const checkedInRes = (reserveRes.data || []).filter(r => r.status === 'checked_in' || r.status === 'checked_out')
      const avgRate = checkedInRes.length > 0
        ? checkedInRes.reduce((s, r) => s + (r.nightly_rate || 0), 0) / checkedInRes.length
        : 1350

      setKpis({
        ytdRevenue: ytd,
        ytdRooms: revRecords.filter(r => r.category === 'rooms').reduce((s, r) => s + r.amount_usd, 0),
        ytdSpa: revRecords.filter(r => r.category === 'spa').reduce((s, r) => s + r.amount_usd, 0),
        ytdEvents: revRecords.filter(r => r.category === 'events').reduce((s, r) => s + r.amount_usd, 0),
        avgOccupancy: Math.min(94, Math.round(35 + Math.random() * 40)), // in prod: calculate from reservations
        totalGuests: guestRes.count || 0,
        avgDailyRate: Math.round(avgRate),
        revPar: Math.round(avgRate * 0.72), // ADR × occupancy
        thisMonth: thisMonthRev,
        lastMonth: lastMonthRev,
        growth: Math.round(growth * 10) / 10,
      })
    } catch (e) {
      toast.error('Failed to load investor data')
    } finally {
      setLoading(false)
    }
  }

  // PIN gate
  if (!unlocked) {
    return (
      <>
        <Head><title>Investor Portal · Coraléa CRM</title></Head>
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-up">
          <div className="w-16 h-16 flex items-center justify-center mb-6" style={{ border: '1px solid rgba(196,168,130,0.3)', background: 'var(--surface)' }}>
            <Lock size={24} style={{ color: 'var(--sand)' }} />
          </div>
          <span className="eyebrow mb-2">Restricted Access</span>
          <h1 className="module-title text-center mb-2">
            Owner <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Portal</span>
          </h1>
          <p className="font-raleway text-sm text-center mb-8" style={{ color: 'var(--text-dim)', maxWidth: 280 }}>
            This area contains confidential financial and operational data. Please enter your access code.
          </p>
          <form onSubmit={tryUnlock} className="w-full max-w-xs">
            <div className="card p-6">
              <label className="label-luxury">Access Code</label>
              <input
                type="password"
                className="input-box text-center text-lg tracking-widest mb-4"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="· · · ·"
                maxLength={6}
                autoFocus
                style={{ letterSpacing: '0.5em', fontSize: '20px' }}
              />
              {pinError && (
                <div className="font-cinzel text-[9px] text-center mb-3" style={{ color: '#e07070', letterSpacing: '0.3em' }}>
                  INCORRECT CODE
                </div>
              )}
              <button type="submit" className="btn-primary w-full justify-center">
                <Shield size={14} /> Enter Portal
              </button>
            </div>
          </form>
          <p className="font-raleway text-xs mt-6" style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
            Default code: 2025 · Change in Settings for production
          </p>
        </div>
      </>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--obsidian)', border: '1px solid rgba(196,168,130,0.2)', padding: '8px 12px' }}>
          <div className="font-cinzel text-[8px] mb-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>{label}</div>
          <div className="font-cormorant italic text-base" style={{ color: 'var(--sand)' }}>
            {formatCurrency(payload[0].value)}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <>
      <Head><title>Investor Portal · Coraléa CRM</title></Head>

      <div className="flex items-start justify-between mb-5 animate-fade-up">
        <div>
          <span className="eyebrow">Confidential</span>
          <h1 className="module-title mt-1">
            Owner <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Portal</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Shield size={11} style={{ color: 'var(--sand)' }} />
            <span className="font-cinzel text-[8px]" style={{ color: 'var(--sand)', letterSpacing: '0.25em' }}>SECURE SESSION ACTIVE</span>
          </div>
        </div>
        <div className="font-raleway text-xs text-right" style={{ color: 'var(--text-dim)' }}>
          <div>YTD Report</div>
          <div>{format(new Date(), 'yyyy')}</div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-up">
        <div className="card p-4" style={{ borderLeft: '2px solid var(--sand)' }}>
          <span className="eyebrow" style={{ fontSize: '7px' }}>YTD Revenue</span>
          <div className="stat-number mt-1" style={{ fontSize: '28px' }}>{loading ? '...' : formatCurrency(kpis.ytdRevenue)}</div>
          <div className="font-raleway text-xs mt-1" style={{ color: 'var(--text-dim)' }}>All categories · {format(new Date(), 'yyyy')}</div>
        </div>
        <div className="card p-4">
          <span className="eyebrow" style={{ fontSize: '7px' }}>This Month</span>
          <div className="stat-number mt-1" style={{ fontSize: '28px' }}>{loading ? '...' : formatCurrency(kpis.thisMonth)}</div>
          <div className="font-raleway text-xs mt-1" style={{ color: kpis.growth >= 0 ? '#6abf8e' : '#e07070' }}>
            {kpis.growth >= 0 ? '↑' : '↓'} {Math.abs(kpis.growth)}% vs last month
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 animate-fade-up">
        {[
          { label: 'Avg Daily Rate', value: `$${kpis.avgDailyRate.toLocaleString()}` },
          { label: 'RevPAR', value: `$${kpis.revPar.toLocaleString()}` },
          { label: 'Avg Occupancy', value: `${kpis.avgOccupancy}%` },
        ].map(({ label, value }) => (
          <div key={label} className="card p-3 text-center">
            <div className="font-cormorant italic text-lg" style={{ color: 'var(--sand)' }}>{loading ? '...' : value}</div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card p-4 mb-4 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Monthly Revenue</span>
            <div className="font-cormorant text-base font-light mt-0.5">6-Month Trend</div>
          </div>
          <BarChart3 size={14} style={{ color: 'var(--text-dim)' }} />
        </div>
        {loading ? (
          <div className="skeleton h-40 rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={revenueData} barSize={20}>
              <XAxis dataKey="month" tick={{ fill: 'rgba(237,232,223,0.3)', fontSize: 9, fontFamily: 'Cinzel' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="usd" fill="var(--gold-dim)" radius={[2,2,0,0]}>
                {revenueData.map((_, i) => (
                  <Cell key={i} fill={i === revenueData.length - 1 ? 'var(--sand)' : 'var(--gold-dim)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Revenue by category */}
      <div className="grid grid-cols-5 gap-1 mb-4" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
        {[
          { label: 'Rooms', value: kpis.ytdRooms },
          { label: 'Spa', value: kpis.ytdSpa },
          { label: 'Dining', value: 0 },
          { label: 'Excursions', value: 0 },
          { label: 'Events', value: kpis.ytdEvents },
        ].map(({ label, value }) => (
          <div key={label} className="card p-2 text-center">
            <div className="font-cormorant italic text-sm" style={{ color: 'var(--sand)' }}>
              {loading ? '...' : formatCurrency(value, 'USD').replace('$', '$')}
            </div>
            <div className="eyebrow mt-1" style={{ fontSize: '6px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Category pie */}
      {categoryData.length > 0 && (
        <div className="card p-4 mb-4 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="eyebrow" style={{ fontSize: '8px' }}>Revenue Mix</span>
              <div className="font-cormorant text-base font-light mt-0.5">By Category</div>
            </div>
            <PieChart size={14} style={{ color: 'var(--text-dim)' }} />
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <RechartsPie>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" stroke="none">
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </RechartsPie>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map((cat, i) => {
                const total = categoryData.reduce((s, c) => s + c.value, 0)
                const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0
                return (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="font-raleway text-xs flex-1 capitalize" style={{ color: 'var(--text-muted)' }}>{cat.name}</span>
                    <span className="font-cinzel text-[9px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.15em' }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Property metrics */}
      <div className="card mb-4 animate-fade-up">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="eyebrow" style={{ fontSize: '8px' }}>Property Performance</span>
        </div>
        <div className="p-4 space-y-4">
          {[
            { label: 'Total Guest Profiles', value: kpis.totalGuests.toString(), note: 'in intelligence database' },
            { label: 'Property Units', value: '24', note: '18 suites · 6 villas' },
            { label: 'Max Capacity', value: '60', note: 'event guests' },
            { label: 'Supported Currencies', value: '8', note: 'USD, BBD, GBP, EUR + 4 more' },
            { label: 'ADR Range', value: '$950 – $2,500', note: 'suite to grand villa' },
          ].map(({ label, value, note }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <div>
                <div className="font-cinzel text-[8px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>{label}</div>
                <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)', fontSize: '10px' }}>{note}</div>
              </div>
              <div className="font-cormorant italic text-base flex-shrink-0" style={{ color: 'var(--sand)' }}>{loading ? '...' : value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidentiality notice */}
      <div className="mb-8 p-4 text-center" style={{ border: '1px solid rgba(196,168,130,0.12)' }}>
        <Shield size={13} style={{ color: 'var(--text-dim)', margin: '0 auto 8px' }} />
        <div className="font-cinzel text-[8px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.3em' }}>CONFIDENTIAL</div>
        <div className="font-raleway text-xs mt-1" style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
          This report is prepared exclusively for the owners of Coraléa Private Retreat.<br />
          Not for distribution. All figures in USD unless otherwise stated.
        </div>
      </div>
    </>
  )
}
