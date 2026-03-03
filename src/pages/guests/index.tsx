import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO } from 'date-fns'
import { Search, Plus, Star, Shield, ChevronRight, Users, TrendingUp, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDiscretionMode } from '@/components/layout/Sidebar'

const VIP_TIERS = ['all', 'platinum', 'gold', 'silver', 'standard']
const SORT_OPTIONS = [
  { value: 'last_stay', label: 'Last Stay' },
  { value: 'total_revenue', label: 'Total Revenue' },
  { value: 'total_stays', label: 'Total Stays' },
  { value: 'created_at', label: 'Date Added' },
]

export default function Guests() {
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { discretion } = useDiscretionMode()

  function maskName(guest: any) {
    if (!discretion) return `${guest.first_name} ${guest.last_name}`
    if (guest.discretion_level === 'maximum' || guest.discretion_level === 'high') return '— Confidential Guest —'
    return `${guest.first_name[0]}. ${guest.last_name[0]}.`
  }
  const [vipFilter, setVipFilter] = useState('all')
  const [sortBy, setSortBy] = useState('last_stay')
  const [stats, setStats] = useState({ total: 0, platinum: 0, gold: 0, totalRevenue: 0 })

  useEffect(() => { loadGuests() }, [search, vipFilter, sortBy])

  async function loadGuests() {
    setLoading(true)
    let query = supabase
      .from('guests')
      .select('*')
      .order(sortBy, { ascending: false, nullsFirst: false })

    if (search.trim()) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,nationality.ilike.%${search}%`
      )
    }
    if (vipFilter !== 'all') query = query.eq('vip_tier', vipFilter)

    const { data, error } = await query.limit(100)
    if (error) toast.error('Failed to load guests')
    else {
      const all = data || []
      setGuests(all)
      // Load stats on first load only
      if (!search && vipFilter === 'all') {
        setStats({
          total: all.length,
          platinum: all.filter(g => g.vip_tier === 'platinum').length,
          gold: all.filter(g => g.vip_tier === 'gold').length,
          totalRevenue: all.reduce((s, g) => s + (g.total_revenue || 0), 0),
        })
      }
    }
    setLoading(false)
  }

  const VIP_COLORS: Record<string, string> = {
    platinum: 'var(--sand-light)', gold: 'var(--sand)',
    silver: '#c0c8d4', standard: 'var(--text-dim)',
  }

  return (
    <>
      <Head><title>Guests · Coraléa CRM</title></Head>

      <div className="mb-5 animate-fade-up">
        <span className="eyebrow">Intelligence</span>
        <h1 className="module-title mt-1">
          Guest <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Profiles</span>
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2 mb-4 animate-fade-up">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'var(--sand)' },
          { label: 'Platinum', value: stats.platinum, icon: Crown, color: 'var(--sand-light)' },
          { label: 'Gold', value: stats.gold, icon: Star, color: 'var(--gold)' },
          { label: 'LTV', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'var(--sand)', small: true },
        ].map(({ label, value, icon: Icon, color, small }) => (
          <div key={label} className="card p-3 text-center">
            <Icon size={12} style={{ color, margin: '0 auto 4px' }} />
            <div className="font-cormorant italic" style={{ color, fontSize: small ? '13px' : '20px', lineHeight: 1 }}>{value}</div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-3 px-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <Search size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
        <input
          className="flex-1 bg-transparent py-3 font-raleway text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
          placeholder="Search by name, email, nationality..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ color: 'var(--text-dim)', padding: '4px' }}>×</button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex gap-1 overflow-x-auto pb-0.5 flex-1">
          {VIP_TIERS.map(tier => (
            <button
              key={tier}
              onClick={() => setVipFilter(tier)}
              className="flex-shrink-0 font-cinzel text-[8px] px-3 py-1.5 transition-all capitalize"
              style={{
                letterSpacing: '0.2em', border: '1px solid',
                borderColor: vipFilter === tier ? 'var(--sand)' : 'var(--border)',
                color: vipFilter === tier ? 'var(--sand)' : 'var(--text-dim)',
                background: vipFilter === tier ? 'rgba(196,168,130,0.08)' : 'transparent',
              }}>
              {tier}
            </button>
          ))}
        </div>
        <select
          className="font-cinzel text-[8px] px-2 py-1.5 flex-shrink-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)', letterSpacing: '0.15em', outline: 'none' }}
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex justify-end mb-3">
        <Link href="/guests/new" className="btn-primary flex items-center gap-2">
          <Plus size={14} /> New Guest
        </Link>
      </div>

      {/* Guest list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 rounded" />)}
        </div>
      ) : guests.length === 0 ? (
        <div className="card p-10 text-center">
          <Users size={28} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
          <div className="font-cormorant italic text-xl mb-2" style={{ color: 'var(--text-dim)' }}>
            {search ? 'No guests match your search' : 'No guest profiles yet'}
          </div>
          {!search && (
            <Link href="/guests/new" className="btn-primary mt-2 inline-flex items-center gap-2">
              <Plus size={14} /> Add First Guest
            </Link>
          )}
        </div>
      ) : (
        <div className="card">
          {guests.map((guest, i) => (
            <Link
              key={guest.id}
              href={`/guests/${guest.id}`}
              className="flex items-center gap-3 p-4 transition-all"
              style={{ borderBottom: i < guests.length - 1 ? '1px solid rgba(196,168,130,0.05)' : 'none' }}
            >
              {/* Avatar */}
              <div
                className="w-10 h-10 flex items-center justify-center flex-shrink-0 relative"
                style={{ background: 'var(--surface-2)', border: `1px solid ${VIP_COLORS[guest.vip_tier] || 'var(--border)'}22` }}
              >
                <span className="font-cormorant italic text-base" style={{ color: VIP_COLORS[guest.vip_tier] || 'var(--sand)' }}>
                  {guest.first_name?.[0]}{guest.last_name?.[0]}
                </span>
                {guest.discretion_level === 'maximum' && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center"
                    style={{ background: 'var(--obsidian)', border: '1px solid rgba(196,168,130,0.3)' }}>
                    <Shield size={8} style={{ color: 'var(--sand)' }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-cormorant text-base" style={{ color: 'var(--text-primary)' }}>
                    {maskName(guest)}
                  </span>
                  <VIPBadge tier={guest.vip_tier} />
                  {guest.discretion_level !== 'standard' && (
                    <span className="badge badge-danger" style={{ fontSize: '7px' }}>
                      {guest.discretion_level === 'maximum' ? 'MAX DISC' : 'HIGH DISC'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                    {guest.nationality || 'Guest'}
                  </span>
                  {guest.total_stays > 0 && (
                    <span className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                      {guest.total_stays} stay{guest.total_stays !== 1 ? 's' : ''}
                    </span>
                  )}
                  {guest.last_stay && (
                    <span className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                      Last: {format(parseISO(guest.last_stay), 'MMM yyyy')}
                    </span>
                  )}
                </div>
              </div>

              {/* Revenue + arrow */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {guest.total_revenue > 0 && (
                  <div className="font-cormorant italic text-sm" style={{ color: 'var(--sand)' }}>
                    {formatCurrency(guest.total_revenue)}
                  </div>
                )}
                <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {guests.length > 0 && (
        <div className="mt-3 mb-8 text-center">
          <span className="font-cinzel text-[8px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.3em' }}>
            {guests.length} PROFILE{guests.length !== 1 ? 'S' : ''} SHOWN
          </span>
        </div>
      )}
    </>
  )
}

function VIPBadge({ tier }: { tier?: string }) {
  const map: Record<string, string> = {
    standard: 'badge badge-sand', silver: 'badge',
    gold: 'badge badge-warning', platinum: 'badge badge-platinum',
  }
  return <span className={map[tier || 'standard'] || 'badge badge-sand'}>{tier?.toUpperCase() || 'STD'}</span>
}
