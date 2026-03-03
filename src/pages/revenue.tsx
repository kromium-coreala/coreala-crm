import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { formatCurrency, CURRENCIES, CurrencyCode } from '@/lib/currency'
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = { rooms: '#c4a882', spa: '#8a6e3e', dining: '#b8965a', excursions: '#dfc9a8', events: '#6a8e7a', other: '#4a6a8e' }

export default function Revenue() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  const [addForm, setAddForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'rooms',
    amount_usd: '',
    currency: 'USD',
    notes: '',
  })

  useEffect(() => { load() }, [period])

  async function load() {
    const now = new Date()
    const from = period === 'week' ? subDays(now, 7)
      : period === 'month' ? startOfMonth(now)
      : new Date(now.getFullYear(), 0, 1)

    const { data, error } = await supabase
      .from('revenue_records')
      .select('*')
      .gte('date', format(from, 'yyyy-MM-dd'))
      .order('date', { ascending: true })

    if (error) toast.error('Failed to load revenue')
    else setRecords(data || [])
    setLoading(false)
  }

  async function addRecord(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const rate = CURRENCIES[addForm.currency as CurrencyCode].rate
      const usd = parseFloat(addForm.amount_usd) / rate
      const { error } = await supabase.from('revenue_records').insert({
        date: addForm.date,
        category: addForm.category,
        amount_usd: usd,
        amount_local: parseFloat(addForm.amount_usd),
        currency: addForm.currency,
        notes: addForm.notes,
      })
      if (error) throw error
      toast.success('Revenue record added')
      setShowAdd(false)
      load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Aggregate by day
  const byDay = records.reduce((acc, r) => {
    const day = r.date
    if (!acc[day]) acc[day] = { date: day, total: 0, rooms: 0, spa: 0, dining: 0, excursions: 0, events: 0, other: 0 }
    acc[day][r.category] = (acc[day][r.category] || 0) + r.amount_usd
    acc[day].total += r.amount_usd
    return acc
  }, {} as Record<string, any>)
  const chartData = Object.values(byDay).slice(-30)

  // By category
  const byCategory = records.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount_usd
    return acc
  }, {} as Record<string, number>)
  const catData = Object.entries(byCategory).map(([name, value]) => ({ name, value: Math.round(value as number) }))

  const totalRevenue = records.reduce((s, r) => s + r.amount_usd, 0)
  const roomRevenue = records.filter(r => r.category === 'rooms').reduce((s, r) => s + r.amount_usd, 0)
  const expRevenue = records.filter(r => r.category !== 'rooms').reduce((s, r) => s + r.amount_usd, 0)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--obsidian)', border: '1px solid rgba(196,168,130,0.2)', padding: '10px 14px' }}>
        <div className="font-cinzel text-[9px] mb-2" style={{ color: 'var(--text-dim)', letterSpacing: '0.3em' }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="font-raleway text-xs" style={{ color: p.color }}>
            {p.dataKey}: {formatCurrency(p.value)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <Head><title>Revenue · Coraléa CRM</title></Head>

      <div className="mb-5 animate-fade-up">
        <span className="eyebrow">Analytics</span>
        <h1 className="module-title mt-1">
          <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Revenue</span> Intelligence
        </h1>
      </div>

      {/* Period + Currency toggles */}
      <div className="flex gap-2 mb-4">
        <div className="flex gap-1 flex-1">
          {(['week','month','year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="flex-1 font-cinzel text-[8px] py-2 transition-all capitalize"
              style={{
                letterSpacing: '0.25em', border: '1px solid',
                borderColor: period === p ? 'var(--sand)' : 'var(--border)',
                color: period === p ? 'var(--sand)' : 'var(--text-dim)',
                background: period === p ? 'rgba(196,168,130,0.08)' : 'transparent',
              }}>
              {p}
            </button>
          ))}
        </div>
        <select className="input-box" style={{ width: 'auto', padding: '6px 10px', fontSize: 11 }}
          value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)}>
          {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        <div className="card p-4" style={{ background: 'rgba(196,168,130,0.04)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow mb-2" style={{ fontSize: '8px' }}>Total {period} Revenue</div>
              <div className="stat-number">{formatCurrency(totalRevenue, currency)}</div>
            </div>
            <TrendingUp size={20} style={{ color: 'var(--sand)', opacity: 0.5 }} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-3">
          <div className="eyebrow mb-1" style={{ fontSize: '7px' }}>Room Revenue</div>
          <div className="font-cormorant italic text-lg" style={{ color: 'var(--sand)' }}>{formatCurrency(roomRevenue, currency)}</div>
          <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {totalRevenue ? Math.round(roomRevenue / totalRevenue * 100) : 0}% of total
          </div>
        </div>
        <div className="card p-3">
          <div className="eyebrow mb-1" style={{ fontSize: '7px' }}>Experience Revenue</div>
          <div className="font-cormorant italic text-lg" style={{ color: 'var(--sand-light)' }}>{formatCurrency(expRevenue, currency)}</div>
          <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {totalRevenue ? Math.round(expRevenue / totalRevenue * 100) : 0}% of total
          </div>
        </div>
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="card p-4 mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <span className="eyebrow mb-4 block" style={{ fontSize: '8px' }}>Daily Revenue Breakdown</span>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} barSize={8}>
              <XAxis dataKey="date" tick={{ fill: 'rgba(237,232,223,0.3)', fontSize: 8, fontFamily: 'Cinzel' }}
                tickFormatter={d => format(parseISO(d), 'MMM d')} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rooms" fill={COLORS.rooms} stackId="a" />
              <Bar dataKey="spa" fill={COLORS.spa} stackId="a" />
              <Bar dataKey="dining" fill={COLORS.dining} stackId="a" />
              <Bar dataKey="excursions" fill={COLORS.excursions} stackId="a" />
              <Bar dataKey="events" fill={COLORS.events} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
                <span className="font-raleway text-xs capitalize" style={{ color: 'var(--text-dim)' }}>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category pie */}
      {catData.length > 0 && (
        <div className="card p-4 mb-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <span className="eyebrow mb-3 block" style={{ fontSize: '8px' }}>Revenue by Category</span>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.name as keyof typeof COLORS] || 'var(--sand)'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--obsidian)', border: '1px solid rgba(196,168,130,0.2)', borderRadius: 0, fontFamily: 'Cinzel', fontSize: 10 }} formatter={(v: any) => formatCurrency(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {catData.sort((a,b) => b.value - a.value).map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORS[d.name as keyof typeof COLORS] || 'var(--sand)' }} />
                  <span className="font-raleway text-xs capitalize flex-1" style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                  <span className="font-cormorant italic text-xs" style={{ color: 'var(--sand)' }}>{formatCurrency(d.value, currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add record */}
      <button onClick={() => setShowAdd(!showAdd)} className="btn-primary w-full justify-center mb-4">
        <Plus size={14} /> Add Revenue Record
      </button>

      {showAdd && (
        <div className="card mb-4 animate-fade-in">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Manual Revenue Entry</span>
          </div>
          <form onSubmit={addRecord} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-luxury">Date</label>
                <input type="date" className="input-box" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label className="label-luxury">Category</label>
                <select className="input-box" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>
                  {['rooms','spa','dining','excursions','events','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-luxury">Amount</label>
                <input type="number" className="input-box" value={addForm.amount_usd} onChange={e => setAddForm(f => ({ ...f, amount_usd: e.target.value }))} required />
              </div>
              <div>
                <label className="label-luxury">Currency</label>
                <select className="input-box" value={addForm.currency} onChange={e => setAddForm(f => ({ ...f, currency: e.target.value }))}>
                  {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label-luxury">Notes</label>
              <input className="input-box" value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
              {saving ? 'Saving...' : 'Add Record'}
            </button>
          </form>
        </div>
      )}

      {/* Recent records */}
      <div className="card animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="eyebrow" style={{ fontSize: '8px' }}>Recent Records</span>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded" />)}</div>
        ) : records.length === 0 ? (
          <div className="p-6 text-center font-cormorant italic" style={{ color: 'var(--text-dim)' }}>No records for this period</div>
        ) : (
          records.slice(-20).reverse().map((rec, i) => (
            <div key={rec.id} className="flex items-center gap-3 p-3"
              style={{ borderBottom: i < Math.min(records.length, 20) - 1 ? '1px solid rgba(196,168,130,0.05)' : 'none' }}>
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORS[rec.category as keyof typeof COLORS] || 'var(--sand)' }} />
              <div className="flex-1">
                <div className="font-raleway text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{rec.category}</div>
                <div className="font-cinzel text-[8px] mt-0.5" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
                  {format(parseISO(rec.date), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="font-cormorant italic text-sm" style={{ color: 'var(--sand)' }}>
                {formatCurrency(rec.amount_usd, currency)}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
