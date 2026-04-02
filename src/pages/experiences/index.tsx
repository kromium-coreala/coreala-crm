import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { Plus, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { useDiscretionMode } from '@/components/layout/Sidebar'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const TYPES = ['all', 'yacht_charter', 'spa_treatment', 'wellness', 'dining', 'excursion', 'event', 'other']
const TYPE_COLORS: Record<string, string> = {
  yacht_charter: '#c9a96e', spa_treatment: '#a78bfa', wellness: '#4ade80',
  dining: '#fb923c', excursion: '#60a5fa', event: '#f472b6', other: '#94a3b8',
}

export default function Experiences() {
  const { discretion } = useDiscretionMode()
  const [experiences, setExperiences] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [type, setType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  useEffect(() => {
    setFiltered(type === 'all' ? experiences : experiences.filter(e => e.experience_type === type))
  }, [experiences, type])

  async function load() {
    const { data } = await supabase
      .from('experiences')
      .select('*, guests(first_name, last_name, vip_tier, discretion_level)')
      .order('date', { ascending: false })
    setExperiences(data || [])
    setLoading(false)
  }

  const gname = (e: any) => {
    const g = e.guests
    if (!g) return '—'
    if (discretion && g.discretion_level === 'maximum') return '— Confidential —'
    if (discretion && g.discretion_level === 'high') return `${g.first_name?.[0]}. ${g.last_name?.[0]}.`
    return `${g.first_name} ${g.last_name}`
  }

  const totalRevenue = experiences.filter(e => e.status === 'completed').reduce((s, e) => s + (e.amount || 0), 0)
  const byType = TYPES.slice(1).map(t => ({
    name: t.replace('_', ' '),
    value: experiences.filter(e => e.experience_type === t).length,
    revenue: experiences.filter(e => e.experience_type === t && e.status === 'completed').reduce((s, e) => s + (e.amount || 0), 0),
    color: TYPE_COLORS[t],
  })).filter(t => t.value > 0)

  return (
    <>
      <Head><title>Experiences — Coraléa CRM</title></Head>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-eyebrow">Revenue</div>
          <div className="page-title">Experiences</div>
          <div className="page-subtitle">{experiences.length} experiences logged</div>
        </div>
        <Link href="/experiences/new" className="btn btn-primary">
          <Plus size={13} /> Log Experience
        </Link>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: 0 }}>
          <div className="card card-elevated">
            <div className="card-label">Total Experiences</div>
            <div className="card-value">{experiences.length}</div>
            <div className="card-sub">{experiences.filter(e => e.status === 'completed').length} completed</div>
          </div>
          <div className="card card-elevated">
            <div className="card-label">Experience Revenue</div>
            <div className="card-value">{formatCurrency(totalRevenue, 'USD')}</div>
            <div className="card-sub">Completed experiences</div>
          </div>
          <div className="card card-elevated">
            <div className="card-label">Pending</div>
            <div className="card-value" style={{ color: '#fbbf24' }}>{experiences.filter(e => e.status === 'pending').length}</div>
            <div className="card-sub">To confirm</div>
          </div>
          <div className="card card-elevated">
            <div className="card-label">Confirmed</div>
            <div className="card-value" style={{ color: 'var(--status-conf)' }}>{experiences.filter(e => e.status === 'confirmed').length}</div>
            <div className="card-sub">Upcoming</div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="card card-elevated">
          <div className="card-label" style={{ marginBottom: 12 }}>By Type</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={byType} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {byType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {byType.map(t => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{t.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => setType(t)} className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
            {t === 'all' ? 'All' : t.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card card-elevated">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Experience</th>
                  <th>Guest</th>
                  <th className="hide-mobile">Type</th>
                  <th>Date</th>
                  <th className="hide-mobile">Duration</th>
                  <th className="hide-mobile">Amount</th>
                  <th>Status</th>
                  <th className="hide-mobile">Vendor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500, fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{gname(e)}</div>
                      {e.guests?.vip_tier && <span className={`badge badge-${e.guests.vip_tier}`} style={{ fontSize: 9 }}>{e.guests.vip_tier}</span>}
                    </td>
                    <td className='hide-mobile'>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: TYPE_COLORS[e.experience_type] || '#94a3b8' }} />
                        {e.experience_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(parseISO(e.date), 'dd MMM yyyy')}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.duration_hours ? `${e.duration_hours}h` : '—'}</td>
                    <td style={{ color: 'var(--gold)', fontSize: 13 }}>{e.amount ? formatCurrency(e.amount, e.currency || 'USD') : '—'}</td>
                    <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.vendor || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
