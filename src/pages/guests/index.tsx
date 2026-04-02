import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { Search, Plus, ChevronRight, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { useDiscretionMode } from '@/components/layout/Sidebar'

const TIERS = ['all', 'platinum', 'gold', 'silver', 'standard']

export default function Guests() {
  const { discretion } = useDiscretionMode()
  const [guests, setGuests] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('all')
  const [sort, setSort] = useState('last_stay')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, platinum: 0, gold: 0, silver: 0, ltv: 0 })

  useEffect(() => { load() }, [])

  useEffect(() => {
    let list = [...guests]
    if (tier !== 'all') list = list.filter(g => g.vip_tier === tier)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(g =>
        `${g.first_name} ${g.last_name}`.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.nationality?.toLowerCase().includes(q)
      )
    }
    if (sort === 'last_stay') list.sort((a, b) => (b.last_stay || '').localeCompare(a.last_stay || ''))
    if (sort === 'revenue') list.sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
    if (sort === 'name') list.sort((a, b) => a.last_name.localeCompare(b.last_name))
    if (sort === 'stays') list.sort((a, b) => (b.total_stays || 0) - (a.total_stays || 0))
    setFiltered(list)
  }, [guests, search, tier, sort])

  async function load() {
    const { data } = await supabase.from('guests').select('*').order('last_stay', { ascending: false, nullsFirst: false })
    const all = data || []
    setGuests(all)
    setStats({
      total: all.length,
      platinum: all.filter(g => g.vip_tier === 'platinum').length,
      gold: all.filter(g => g.vip_tier === 'gold').length,
      silver: all.filter(g => g.vip_tier === 'silver').length,
      ltv: all.reduce((s, g) => s + (g.total_revenue || 0), 0),
    })
    setLoading(false)
  }

  const name = (g: any) => {
    if (discretion && g.discretion_level === 'maximum') return '— Confidential —'
    if (discretion && g.discretion_level === 'high') return `${g.first_name?.[0]}. ${g.last_name?.[0]}.`
    return `${g.first_name} ${g.last_name}`
  }

  const initials = (g: any) => {
    if (discretion && g.discretion_level === 'maximum') return '?'
    return `${g.first_name?.[0] || ''}${g.last_name?.[0] || ''}`
  }

  return (
    <>
      <Head><title>Guests — Coraléa CRM</title></Head>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-eyebrow">Intelligence</div>
          <div className="page-title">Guest <em>Profiles</em></div>
          <div className="page-subtitle">{stats.total} profiles across all tiers</div>
        </div>
        <Link href="/guests/new" className="btn btn-primary">
          <Plus size={13} /> New Guest
        </Link>
      </div>

      {/* Stat row */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="card card-elevated">
          <div className="card-label">Total Guests</div>
          <div className="card-value">{stats.total}</div>
          <div className="card-sub">All profiles</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Platinum</div>
          <div className="card-value" style={{ color: 'var(--gold)' }}>{stats.platinum}</div>
          <div className="card-sub">{stats.gold} gold · {stats.silver} silver</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Total Lifetime Value</div>
          <div className="card-value">{formatCurrency(stats.ltv, 'USD')}</div>
          <div className="card-sub">Across all guests</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Avg. LTV</div>
          <div className="card-value">{stats.total ? formatCurrency(Math.round(stats.ltv / stats.total), 'USD') : '—'}</div>
          <div className="card-sub">Per guest profile</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-elevated" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name, email, nationality…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {TIERS.map(t => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`btn btn-sm ${tier === t ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {t}
              </button>
            ))}
          </div>
          <select className="select" style={{ width: 160 }} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="last_stay">Sort: Last Stay</option>
            <option value="revenue">Sort: Revenue</option>
            <option value="stays">Sort: Stays</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      {/* Guest list */}
      <div className="card card-elevated">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            No guests found
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Tier</th>
                  <th className="hide-mobile">Nationality</th>
                  <th className="hide-mobile">Stays</th>
                  <th className="hide-mobile">Last Stay</th>
                  <th>Lifetime Value</th>
                  <th className="hide-mobile">Discretion</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => (
                  <tr key={g.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--gold-glow)',
                          border: '1px solid var(--border-mid)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 11,
                          color: 'var(--gold)', flexShrink: 0,
                          letterSpacing: '0.05em',
                        }}>
                          {initials(g)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{name(g)}</div>
                          {!discretion && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${g.vip_tier}`}>{g.vip_tier}</span></td>
                    <td className='hide-mobile' style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{g.nationality || '—'}</td>
                    <td className='hide-mobile' style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{g.total_stays || 0}</td>
                    <td className='hide-mobile' style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {g.last_stay ? format(parseISO(g.last_stay), 'dd MMM yyyy') : '—'}
                    </td>
                    <td style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 500 }}>
                      {g.total_revenue ? formatCurrency(g.total_revenue, 'USD') : '—'}
                    </td>
                    <td className='hide-mobile'>
                      {g.discretion_level !== 'standard' && (
                        <span className={`badge badge-${g.discretion_level}`}>{g.discretion_level}</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/guests/${g.id}`} className="btn btn-ghost btn-sm btn-icon">
                        <ChevronRight size={14} />
                      </Link>
                    </td>
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
