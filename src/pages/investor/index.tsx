import { useState, useEffect } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { formatCurrency } from '@/lib/currency'
import { Lock, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const PIN = '2025'
const CAT_COLORS: Record<string, string> = {
  rooms: '#c9a96e', spa: '#a78bfa', dining: '#fb923c',
  excursions: '#60a5fa', events: '#4ade80', other: '#94a3b8',
}

export default function Investor() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  function tryPin() {
    if (pin === PIN) { setUnlocked(true); setError('') }
    else { setError('Incorrect PIN'); setPin('') }
  }

  useEffect(() => {
    if (unlocked) loadData()
  }, [unlocked])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('revenue_records').select('*').order('date', { ascending: true })
    setRecords(data || [])
    setLoading(false)
  }

  // Monthly aggregation
  const monthMap: Record<string, number> = {}
  records.forEach(r => {
    const m = r.date.slice(0, 7)
    monthMap[m] = (monthMap[m] || 0) + (r.amount_usd || 0)
  })
  const monthlyData = Object.entries(monthMap).map(([m, total]) => ({
    month: format(parseISO(m + '-01'), 'MMM yy'), total,
  }))

  const totalRevenue = records.reduce((s, r) => s + (r.amount_usd || 0), 0)
  const currentYear = new Date().getFullYear()
  const ytd = records.filter(r => r.date.startsWith(String(currentYear))).reduce((s, r) => s + (r.amount_usd || 0), 0)
  const lastYear = records.filter(r => r.date.startsWith(String(currentYear - 1))).reduce((s, r) => s + (r.amount_usd || 0), 0)

  const catTotals = Object.entries(CAT_COLORS).map(([cat, color]) => ({
    name: cat, color,
    value: records.filter(r => r.category === cat).reduce((s, r) => s + (r.amount_usd || 0), 0),
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value)

  // Room revenue for RevPAR calc (approximate)
  const roomRevenue = records.filter(r => r.category === 'rooms').reduce((s, r) => s + (r.amount_usd || 0), 0)
  const months = Object.keys(monthMap).length
  const revpar = months > 0 ? Math.round(roomRevenue / (months * 24 * 30.4)) : 0
  const adr = months > 0 ? Math.round(roomRevenue / Math.max(records.filter(r => r.category === 'rooms').length, 1)) : 0

  if (!unlocked) {
    return (
      <>
        <Head><title>Investor Portal — Coraléa</title></Head>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
          <div className="card card-elevated" style={{ width: 360, textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-md)',
              background: 'var(--gold-glow)', border: '1px solid var(--border-mid)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Lock size={22} color="var(--gold)" />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.16em', color: 'var(--gold)', marginBottom: 4 }}>INVESTOR PORTAL</div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 22, color: 'var(--text-primary)', marginBottom: 8 }}>Restricted Access</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28 }}>Enter your PIN to access financial reporting</div>
            <input
              type="password"
              className="input"
              placeholder="Enter PIN"
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tryPin()}
              style={{ textAlign: 'center', letterSpacing: '0.3em', marginBottom: 12, fontSize: 20 }}
              maxLength={6}
            />
            {error && <div style={{ fontSize: 12, color: 'var(--status-cancel)', marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary w-full" onClick={tryPin} style={{ justifyContent: 'center' }}>
              Unlock Portal
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>Investor Portal — Coraléa</title></Head>

      <div className="page-header">
        <div className="page-eyebrow">Confidential</div>
        <div className="page-title">Investor <em>Reporting</em></div>
        <div className="page-subtitle">Coraléa Private Retreat · West Coast Barbados · Confidential</div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <div className="card card-elevated">
          <div className="card-label">Total Revenue</div>
          <div className="card-value">{formatCurrency(totalRevenue, 'USD')}</div>
          <div className="card-sub">All time</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">{currentYear} YTD</div>
          <div className="card-value">{formatCurrency(ytd, 'USD')}</div>
          <div className="card-sub">Year to date</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">RevPAR</div>
          <div className="card-value">{formatCurrency(revpar, 'USD')}</div>
          <div className="card-sub">Revenue per available room</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">{currentYear - 1} Full Year</div>
          <div className="card-value">{formatCurrency(lastYear, 'USD')}</div>
          <div className="card-sub">Prior year total</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="card card-elevated">
          <div className="card-label" style={{ marginBottom: 4 }}>Revenue Trend</div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 20 }}>Monthly Performance</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={44} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 8, fontFamily: 'var(--font-ui)', fontSize: 12 }}
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="total" stroke="var(--gold)" strokeWidth={2} fill="url(#invGrad)" dot={false} activeDot={{ r: 4, fill: 'var(--gold)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-elevated">
          <div className="card-label" style={{ marginBottom: 4 }}>Revenue Mix</div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 16 }}>By Category</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={catTotals} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                {catTotals.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {catTotals.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{c.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{formatCurrency(c.value, 'USD')}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 34, textAlign: 'right' }}>
                  {Math.round((c.value / totalRevenue) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key metrics table */}
      <div className="card card-elevated">
        <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 20 }}>Key Performance Indicators</div>
        <div className="grid-3">
          {[
            { label: 'Total Suites', value: '18' },
            { label: 'Total Villas', value: '6' },
            { label: 'Total Units', value: '24' },
            { label: 'ADR Range', value: '$950 – $2,500' },
            { label: 'Avg Monthly Revenue', value: formatCurrency(Math.round(totalRevenue / Math.max(months, 1)), 'USD') },
            { label: 'Room Revenue Share', value: `${Math.round((catTotals.find(c => c.name === 'rooms')?.value || 0) / totalRevenue * 100)}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '14px 16px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 22, color: 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
