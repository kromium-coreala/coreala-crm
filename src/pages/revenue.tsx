import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { formatCurrency } from '@/lib/currency'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const CATEGORIES = ['rooms', 'spa', 'dining', 'excursions', 'events', 'other']
const CAT_COLORS: Record<string, string> = {
  rooms: '#c9a96e', spa: '#a78bfa', dining: '#fb923c',
  excursions: '#60a5fa', events: '#4ade80', other: '#94a3b8',
}

export default function Revenue() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('revenue_records').select('*').order('date', { ascending: true })
    setRecords(data || [])
    setLoading(false)
  }

  // Group by month
  const monthMap: Record<string, Record<string, number>> = {}
  records.forEach(r => {
    const m = r.date.slice(0, 7)
    if (!monthMap[m]) monthMap[m] = {}
    monthMap[m][r.category] = (monthMap[m][r.category] || 0) + (r.amount_usd || 0)
  })
  const monthlyData = Object.entries(monthMap).map(([month, cats]) => ({
    month: format(parseISO(month + '-01'), 'MMM yy'),
    total: Object.values(cats).reduce((s, v) => s + v, 0),
    ...cats,
  }))

  // Category totals
  const catTotals = CATEGORIES.map(c => ({
    name: c,
    value: records.filter(r => r.category === c).reduce((s, r) => s + (r.amount_usd || 0), 0),
    color: CAT_COLORS[c],
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value)

  const grandTotal = records.reduce((s, r) => s + (r.amount_usd || 0), 0)
  const currentYear = new Date().getFullYear()
  const thisYear = records.filter(r => r.date.startsWith(String(currentYear))).reduce((s, r) => s + (r.amount_usd || 0), 0)
  const lastYear = records.filter(r => r.date.startsWith(String(currentYear - 1))).reduce((s, r) => s + (r.amount_usd || 0), 0)
  const yoy = lastYear ? Math.round(((thisYear - lastYear) / lastYear) * 100) : 0

  // Last 12 months for bar chart
  const last12 = monthlyData.slice(-12)

  return (
    <>
      <Head><title>Revenue — Coraléa CRM</title></Head>

      <div className="page-header">
        <div className="page-eyebrow">Finance</div>
        <div className="page-title">Revenue & <em>Financial Overview</em></div>
        <div className="page-subtitle">All figures in USD · {records.length} records</div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <div className="card card-elevated">
          <div className="card-label">Total Revenue</div>
          <div className="card-value">{formatCurrency(grandTotal, 'USD')}</div>
          <div className="card-sub">All time</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">{currentYear} Revenue</div>
          <div className="card-value">{formatCurrency(thisYear, 'USD')}</div>
          <div className="card-sub" style={{ color: yoy >= 0 ? 'var(--status-in)' : 'var(--status-cancel)' }}>
            {yoy >= 0 ? '↑' : '↓'} {Math.abs(yoy)}% vs {currentYear - 1}
          </div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Top Category</div>
          <div className="card-value-md" style={{ color: 'var(--gold)', textTransform: 'capitalize', marginTop: 4 }}>{catTotals[0]?.name || '—'}</div>
          <div className="card-sub">{formatCurrency(catTotals[0]?.value || 0, 'USD')} total</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">{currentYear - 1} Revenue</div>
          <div className="card-value">{formatCurrency(lastYear, 'USD')}</div>
          <div className="card-sub">Full year</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        {/* Monthly bar chart */}
        <div className="card card-elevated">
          <div className="card-label" style={{ marginBottom: 4 }}>Monthly Revenue</div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 20 }}>Last 12 Months</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last12} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={44} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 8, fontFamily: 'var(--font-ui)', fontSize: 12 }}
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']}
              />
              <Bar dataKey="rooms"     fill={CAT_COLORS.rooms}     stackId="a" radius={[0,0,0,0]} />
              <Bar dataKey="spa"       fill={CAT_COLORS.spa}       stackId="a" />
              <Bar dataKey="dining"    fill={CAT_COLORS.dining}    stackId="a" />
              <Bar dataKey="excursions"fill={CAT_COLORS.excursions}stackId="a" />
              <Bar dataKey="events"    fill={CAT_COLORS.events}    stackId="a" />
              <Bar dataKey="other"     fill={CAT_COLORS.other}     stackId="a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="card card-elevated">
          <div className="card-label" style={{ marginBottom: 4 }}>By Category</div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 20 }}>All Time</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={catTotals} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" strokeWidth={0}>
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
                <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>
                  {Math.round((c.value / grandTotal) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent records table */}
      <div className="card card-elevated">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)' }}>Recent Records</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount (USD)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.slice().reverse().slice(0, 30).map(r => (
                <tr key={r.id}>
                  <td style={{ fontSize: 12 }}>{format(parseISO(r.date), 'dd MMM yyyy')}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[r.category] || '#94a3b8' }} />
                      {r.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 500 }}>{formatCurrency(r.amount_usd, 'USD')}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
