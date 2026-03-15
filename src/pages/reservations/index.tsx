import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { Search, Plus, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { useDiscretionMode } from '@/components/layout/Sidebar'

const STATUSES = ['all', 'checked_in', 'confirmed', 'checked_out', 'enquiry', 'cancelled']

export default function Reservations() {
  const { discretion } = useDiscretionMode()
  const [reservations, setReservations] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  useEffect(() => {
    let list = [...reservations]
    if (status !== 'all') list = list.filter(r => r.status === status)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        `${r.guests?.first_name} ${r.guests?.last_name}`.toLowerCase().includes(q) ||
        r.room_number?.toLowerCase().includes(q) ||
        r.occasion?.toLowerCase().includes(q)
      )
    }
    setFiltered(list)
  }, [reservations, search, status])

  async function load() {
    const { data } = await supabase
      .from('reservations')
      .select('*, guests(first_name, last_name, vip_tier, nationality, discretion_level)')
      .order('check_in', { ascending: false })
    setReservations(data || [])
    setLoading(false)
  }

  const gname = (r: any) => {
    const g = r.guests
    if (!g) return '—'
    if (discretion && g.discretion_level === 'maximum') return '— Confidential —'
    if (discretion && g.discretion_level === 'high') return `${g.first_name?.[0]}. ${g.last_name?.[0]}.`
    return `${g.first_name} ${g.last_name}`
  }

  const stats = {
    checkedIn: reservations.filter(r => r.status === 'checked_in').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    total: reservations.length,
    revenue: reservations.filter(r => r.status !== 'cancelled').reduce((s, r) => s + (r.total_amount || 0), 0),
  }

  return (
    <>
      <Head><title>Reservations — Coraléa CRM</title></Head>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-eyebrow">Bookings</div>
          <div className="page-title">Reservations</div>
          <div className="page-subtitle">{stats.total} total bookings on record</div>
        </div>
        <Link href="/reservations/new" className="btn btn-primary">
          <Plus size={13} /> New Reservation
        </Link>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="card card-elevated">
          <div className="card-label">Checked In</div>
          <div className="card-value" style={{ color: 'var(--status-in)' }}>{stats.checkedIn}</div>
          <div className="card-sub">Currently in-house</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Confirmed</div>
          <div className="card-value" style={{ color: 'var(--status-conf)' }}>{stats.confirmed}</div>
          <div className="card-sub">Upcoming arrivals</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Total Bookings</div>
          <div className="card-value">{stats.total}</div>
          <div className="card-sub">All time</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Total Revenue</div>
          <div className="card-value">{formatCurrency(stats.revenue, 'USD')}</div>
          <div className="card-sub">Room revenue booked</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-elevated" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 36 }} placeholder="Search guest, room, occasion…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card card-elevated">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 56 }} />)}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Nights</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Arrival</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const nights = Math.round((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000)
                  return (
                    <tr key={r.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{gname(r)}</div>
                          {r.guests?.vip_tier && <span className={`badge badge-${r.guests.vip_tier}`} style={{ fontSize: 9, marginTop: 3 }}>{r.guests.vip_tier}</span>}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--gold)', letterSpacing: '0.08em' }}>{r.room_number}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.accommodation_type?.replace(/_/g, ' ')}</td>
                      <td style={{ fontSize: 12 }}>{format(parseISO(r.check_in), 'dd MMM yyyy')}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(parseISO(r.check_out), 'dd MMM yyyy')}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>{nights}</td>
                      <td style={{ color: 'var(--gold)', fontSize: 13 }}>{formatCurrency(r.total_amount, r.currency)}</td>
                      <td><span className={`badge badge-${r.status}`}>{r.status.replace('_', ' ')}</span></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.arrival_method?.replace('_', ' ')}</td>
                      <td>
                        <Link href={`/reservations/${r.id}`} className="btn btn-ghost btn-sm btn-icon">
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
