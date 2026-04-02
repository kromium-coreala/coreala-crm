import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Plus } from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
  google: '#4285f4', meta: '#1877f2', instagram: '#e1306c',
  tiktok: '#69c9d0', email: '#c9a96e', referral: '#4ade80',
  organic: '#a78bfa', other: '#94a3b8',
}

const TAB = ['overview', 'campaigns', 'funnel'] as const
type Tab = typeof TAB[number]

function fmt$(n: number) {
  if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n/1000).toFixed(0)}K`
  return `$${Math.round(n)}`
}
function pct(n: number, d: number) { return d ? `${((n/d)*100).toFixed(1)}%` : '0%' }

export default function Attribution() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [leads, setLeads]         = useState<any[]>([])
  const [tab, setTab]             = useState<Tab>('overview')
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)
  const [form, setForm] = useState({
    name: '', platform: 'instagram', status: 'active', objective: '',
    daily_budget_usd: '', total_spend_usd: '', start_date: '',
    leads_total: '', leads_qualified: '', tours_booked: '',
    bookings_confirmed: '', revenue_usd: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('ad_campaigns').select('*').order('total_spend_usd', { ascending: false }),
      supabase.from('inquiry_leads').select('utm_source, utm_campaign, lead_tier, lead_score, status, budget_range').limit(500),
    ])
    setCampaigns(c ?? [])
    setLeads(l ?? [])
    setLoading(false)
  }

  async function saveCampaign(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('ad_campaigns').insert({
      name:               form.name,
      platform:           form.platform,
      status:             form.status,
      objective:          form.objective || null,
      daily_budget_usd:   Number(form.daily_budget_usd) || 0,
      total_spend_usd:    Number(form.total_spend_usd)  || 0,
      start_date:         form.start_date || null,
      leads_total:        Number(form.leads_total)        || 0,
      leads_qualified:    Number(form.leads_qualified)    || 0,
      tours_booked:       Number(form.tours_booked)       || 0,
      bookings_confirmed: Number(form.bookings_confirmed) || 0,
      revenue_usd:        Number(form.revenue_usd)        || 0,
    })
    setSaving(false); setShowForm(false); load()
  }

  const totals = campaigns.reduce((acc, c) => ({
    spend:    acc.spend    + (c.total_spend_usd    ?? 0),
    leads:    acc.leads    + (c.leads_total         ?? 0),
    qual:     acc.qual     + (c.leads_qualified     ?? 0),
    tours:    acc.tours    + (c.tours_booked        ?? 0),
    bookings: acc.bookings + (c.bookings_confirmed  ?? 0),
    revenue:  acc.revenue  + (c.revenue_usd         ?? 0),
  }), { spend:0, leads:0, qual:0, tours:0, bookings:0, revenue:0 })

  const roi = totals.spend > 0 ? Math.round(((totals.revenue - totals.spend) / totals.spend) * 100) : 0

  // By platform (from actual inquiry_leads)
  const bySource = leads.reduce((acc: Record<string, number>, l) => {
    const src = l.utm_source || 'organic'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})
  const sourceData = Object.entries(bySource).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Funnel
  const funnel = [
    { stage: 'Total Leads',         value: totals.leads    || leads.length },
    { stage: 'Qualified (65+)',      value: totals.qual     || leads.filter(l => (l.lead_score ?? 0) >= 65).length },
    { stage: 'Tours Booked',         value: totals.tours },
    { stage: 'Bookings Confirmed',   value: totals.bookings },
  ]
  const maxFunnel = funnel[0].value || 1

  // Bar chart data by platform
  const barData = campaigns.reduce((acc: Record<string, any>, c) => {
    if (!acc[c.platform]) acc[c.platform] = { platform: c.platform, leads: 0, revenue: 0 }
    acc[c.platform].leads   += c.leads_total ?? 0
    acc[c.platform].revenue += c.revenue_usd ?? 0
    return acc
  }, {})
  const bars = Object.values(barData)

  return (
    <>
      <Head><title>Attribution — Coraléa CRM</title></Head>

      <div className="page-header-row">
        <div>
          <div className="page-eyebrow">Lead Generation</div>
          <div className="page-title">Attribution <em>& ROI</em></div>
          <div className="page-subtitle">Ad campaign performance and revenue attribution</div>
        </div>
        {tab === 'campaigns' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={13} /> Add Campaign
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: 20 }}>
        <div className="card card-elevated">
          <div className="card-label">Total Ad Spend</div>
          <div className="card-value-md" style={{ color: 'var(--gold)' }}>{fmt$(totals.spend)}</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Revenue Attributed</div>
          <div className="card-value-md" style={{ color: 'var(--status-in)' }}>{fmt$(totals.revenue)}</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Total Leads</div>
          <div className="card-value-md">{totals.leads || leads.length}</div>
          <div className="card-sub">Avg score {leads.length ? Math.round(leads.reduce((s,l)=>s+(l.lead_score??0),0)/leads.length) : 0}</div>
        </div>
        <div className="card card-elevated" style={{ borderColor: roi > 1000 ? 'rgba(74,222,128,0.25)' : 'var(--border-subtle)' }}>
          <div className="card-label">Overall ROI</div>
          <div className="card-value-md" style={{ color: roi > 1000 ? 'var(--status-in)' : '#fbbf24' }}>
            {roi.toLocaleString()}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TAB.map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card card-elevated">
            <div className="card-label" style={{ marginBottom: 16 }}>Leads by Platform</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bars} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="platform" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', fontSize: 12 }} />
                <Bar dataKey="leads" fill="var(--gold)" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card card-elevated">
            <div className="card-label" style={{ marginBottom: 12 }}>Source Distribution</div>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                    {sourceData.map((entry, i) => (
                      <Cell key={i} fill={PLATFORM_COLORS[entry.name] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No source data yet — UTM parameters will appear here once leads arrive from ads.
              </div>
            )}
          </div>
          {/* Key metrics */}
          <div className="card card-elevated" style={{ gridColumn: '1 / -1' }}>
            <div className="card-label" style={{ marginBottom: 14 }}>Key Metrics</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'var(--border-subtle)' }}>
              {[
                ['Cost Per Lead',        totals.leads > 0     ? fmt$(totals.spend / totals.leads)    : '—'],
                ['Cost Per Qualified',   totals.qual > 0      ? fmt$(totals.spend / totals.qual)     : '—'],
                ['Cost Per Tour',        totals.tours > 0     ? fmt$(totals.spend / totals.tours)    : '—'],
                ['Cost Per Booking',     totals.bookings > 0  ? fmt$(totals.spend / totals.bookings) : '—'],
                ['Qualification Rate',   pct(totals.qual, totals.leads || leads.length)],
                ['Tour Booking Rate',    pct(totals.tours, totals.qual)],
                ['Close Rate',           pct(totals.bookings, totals.tours)],
                ['Overall Conversion',   pct(totals.bookings, totals.leads || leads.length)],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'var(--bg-elevated)', padding: '14px 16px' }}>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 22, color: 'var(--text-primary)', fontWeight: 300 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGNS */}
      {tab === 'campaigns' && (
        <>
          {showForm && (
            <div className="card card-elevated" style={{ marginBottom: 16 }}>
              <div className="card-label" style={{ marginBottom: 14 }}>Add Campaign</div>
              <form onSubmit={saveCampaign}>
                <div className="form-row" style={{ marginBottom: 12 }}>
                  <div className="form-group"><label>Campaign Name *</label>
                    <input className="input" required value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Barbados Wedding — Instagram" /></div>
                  <div className="form-group"><label>Platform</label>
                    <select className="select" value={form.platform}
                      onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                      {Object.keys(PLATFORM_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
                    </select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
                  {[
                    ['total_spend_usd','Total Spend (USD)'],['leads_total','Total Leads'],
                    ['leads_qualified','Qualified Leads'],['tours_booked','Tours Booked'],
                    ['bookings_confirmed','Bookings'],['revenue_usd','Revenue (USD)'],
                  ].map(([key, lbl]) => (
                    <div className="form-group" key={key}>
                      <label>{lbl}</label>
                      <input className="input" type="number" placeholder="0"
                        value={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Campaign'}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          <div className="card card-elevated">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Campaign</th><th>Platform</th><th className="hide-mobile">Spend</th><th>Leads</th>
                  <th className="hide-mobile">Qual.</th><th className="hide-mobile">Tours</th><th>Won</th><th>Revenue</th><th>ROI</th><th className="hide-mobile">CPL</th><th className="hide-mobile">Status</th>
                </tr></thead>
                <tbody>
                  {loading && <tr><td colSpan={11}><div className="skeleton" style={{ height: 40 }} /></td></tr>}
                  {campaigns.map(c => {
                    const cRoi = c.total_spend_usd > 0 ? Math.round(((c.revenue_usd - c.total_spend_usd) / c.total_spend_usd) * 100) : null
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 500, fontSize: 13, maxWidth: 200 }}>{c.name}</td>
                        <td><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: PLATFORM_COLORS[c.platform] ?? 'var(--text-muted)' }}>{c.platform}</span></td>
                        <td style={{ fontSize: 12 }}>{fmt$(c.total_spend_usd ?? 0)}</td>
                        <td style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--gold)' }}>{c.leads_total ?? 0}</td>
                        <td className="hide-mobile" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.leads_qualified ?? 0}</td>
                        <td className="hide-mobile" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.tours_booked ?? 0}</td>
                        <td style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--status-in)' }}>{c.bookings_confirmed ?? 0}</td>
                        <td style={{ fontSize: 12, color: 'var(--status-in)' }}>{c.revenue_usd > 0 ? fmt$(c.revenue_usd) : '—'}</td>
                        <td style={{ fontSize: 12, fontWeight: 600, color: cRoi && cRoi > 1000 ? 'var(--status-in)' : '#fbbf24' }}>
                          {cRoi !== null ? `${cRoi.toLocaleString()}%` : '—'}
                        </td>
                        <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {c.leads_total > 0 ? fmt$(c.total_spend_usd / c.leads_total) : '—'}
                        </td>
                        <td><span className={`badge ${c.status === 'active' ? 'badge-completed' : c.status === 'paused' ? 'badge-enquiry' : 'badge-standard'}`}>{c.status}</span></td>
                      </tr>
                    )
                  })}
                  {!loading && campaigns.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>No campaigns yet — add your first above</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* FUNNEL */}
      {tab === 'funnel' && (
        <div className="grid-2">
          <div className="card card-elevated">
            <div className="card-label" style={{ marginBottom: 20 }}>Conversion Funnel</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {funnel.map((step, i) => {
                const w = maxFunnel > 0 ? ((step.value / maxFunnel) * 100) : 0
                const opacity = 1 - i * 0.18
                return (
                  <div key={step.stage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ width: `${w}%`, minWidth: 40, background: `rgba(201,169,110,${opacity})`, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', margin: '0 auto' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bg-base)' }}>{step.stage}</span>
                        <span style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--bg-base)', fontWeight: 300 }}>{step.value}</span>
                      </div>
                    </div>
                    {i > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--status-cancel)', minWidth: 36, textAlign: 'right' }}>
                        {pct(step.value, funnel[i-1].value)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="card card-elevated">
            <div className="card-label" style={{ marginBottom: 14 }}>Benchmark Targets</div>
            {[
              { label: 'Qualification Rate',  actual: pct(totals.qual, totals.leads || leads.length), target: '65%' },
              { label: 'Tour Booking Rate',   actual: pct(totals.tours, totals.qual || 1), target: '50%' },
              { label: 'Tour Show Rate',      actual: '—', target: '85%' },
              { label: 'Close Rate',          actual: pct(totals.bookings, totals.tours || 1), target: '40%' },
              { label: 'Avg Response Time',   actual: '< 2h target', target: '< 1h' },
            ].map(({ label, actual, target }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                <div style={{ display: 'flex', gap: 14 }}>
                  <span style={{ fontFamily: 'var(--font-editorial)', fontSize: 16, color: 'var(--gold)', fontStyle: 'italic' }}>{actual}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>tgt {target}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20, background: 'var(--gold-glow)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
              <div className="card-label">Overall ROI</div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 36, color: roi > 0 ? 'var(--status-in)' : 'var(--status-cancel)', fontWeight: 300 }}>
                {roi.toLocaleString()}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {fmt$(totals.spend)} spent → {fmt$(totals.revenue)} attributed
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
