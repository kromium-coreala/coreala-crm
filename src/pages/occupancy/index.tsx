import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { BedDouble, Users, ArrowRight, Plus } from 'lucide-react'
import { useDiscretionMode } from '@/components/layout/Sidebar'

const SUITES = Array.from({ length: 18 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`)
const VILLAS = ['V01', 'V02', 'V03', 'V04', 'V05', 'V06']
const GRAND = 'V06'

export default function Occupancy() {
  const { discretion } = useDiscretionMode()
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('reservations')
      .select('*, guests(first_name, last_name, vip_tier, nationality, discretion_level)')
      .in('status', ['checked_in', 'confirmed'])
      .order('check_in', { ascending: true })
    setReservations(data || [])
    setLoading(false)
  }

  const getUnit = (room: string) =>
    reservations.find(r => r.room_number === room)

  const checkedIn = reservations.filter(r => r.status === 'checked_in').length
  const confirmed = reservations.filter(r => r.status === 'confirmed').length
  const occupancyPct = Math.round((checkedIn / 24) * 100)

  const guestName = (g: any) => {
    if (!g) return '—'
    if (discretion && g.discretion_level === 'maximum') return '— Confidential —'
    if (discretion && g.discretion_level === 'high') return `${g.first_name?.[0]}.${g.last_name?.[0]}.`
    return `${g.first_name} ${g.last_name}`
  }

  const UnitCard = ({ room, type }: { room: string; type: string }) => {
    const res = getUnit(room)
    const isIn = res?.status === 'checked_in'
    const isConf = res?.status === 'confirmed'
    const isGrand = room === GRAND

    return (
      <div style={{
        background: isIn ? 'rgba(74,222,128,0.06)' : isConf ? 'rgba(96,165,250,0.06)' : 'var(--bg-surface)',
        border: `1px solid ${isIn ? 'rgba(74,222,128,0.25)' : isConf ? 'rgba(96,165,250,0.2)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        transition: 'all 150ms',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--gold)', marginBottom: 2 }}>
              {room}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {isGrand ? 'Grand Villa' : type}
            </div>
          </div>
          <span className={`badge badge-${res ? res.status : 'standard'}`} style={{ fontSize: 9 }}>
            {res ? res.status.replace('_', ' ') : 'Vacant'}
          </span>
        </div>

        {res ? (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              {guestName(res.guests)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {res.guests?.vip_tier && <span className={`badge badge-${res.guests.vip_tier}`} style={{ fontSize: 9, marginRight: 6 }}>{res.guests.vip_tier}</span>}
              {format(parseISO(res.check_in), 'dd MMM')} → {format(parseISO(res.check_out), 'dd MMM')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {res.adults} adult{res.adults !== 1 ? 's' : ''}{res.children > 0 ? ` · ${res.children} child` : ''}
              {' · '}{res.currency} {Number(res.nightly_rate).toLocaleString()}/night
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Available</div>
        )}
      </div>
    )
  }

  return (
    <>
      <Head><title>Occupancy — Coraléa CRM</title></Head>

      <div className="page-header">
        <div className="page-eyebrow">Live Map</div>
        <div className="page-title">Occupancy <em>Overview</em></div>
        <div className="page-subtitle">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
      </div>

      {/* KPIs */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <div className="card card-elevated">
          <div className="card-label">Occupancy Rate</div>
          <div className="card-value">{occupancyPct}%</div>
          <div className="progress-bar" style={{ margin: '10px 0 6px' }}>
            <div className="progress-fill" style={{ width: `${occupancyPct}%` }} />
          </div>
          <div className="card-sub">{checkedIn} of 24 units</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Checked In</div>
          <div className="card-value" style={{ color: 'var(--status-in)' }}>{checkedIn}</div>
          <div className="card-sub">Currently in-house</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Confirmed</div>
          <div className="card-value" style={{ color: 'var(--status-conf)' }}>{confirmed}</div>
          <div className="card-sub">Upcoming arrivals</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Available</div>
          <div className="card-value">{24 - checkedIn - confirmed}</div>
          <div className="card-sub">Units open to book</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Suites */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div className="page-eyebrow" style={{ marginBottom: 2 }}>Accommodation</div>
                <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: 20, fontWeight: 300, color: 'var(--text-primary)' }}>
                  Private Suites <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>S01 – S18</span>
                </h2>
              </div>
              <Link href="/reservations/new" className="btn btn-primary btn-sm">
                <Plus size={12} /> New Booking
              </Link>
            </div>
            <div className="occupancy-grid">
              {SUITES.map(room => (
                <UnitCard key={room} room={room} type="Private Suite" />
              ))}
            </div>
          </div>

          {/* Villas */}
          <div>
            <div style={{ marginBottom: 14 }}>
              <div className="page-eyebrow" style={{ marginBottom: 2 }}>Oceanfront</div>
              <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: 20, fontWeight: 300, color: 'var(--text-primary)' }}>
                Villas <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>V01 – V06</span>
              </h2>
            </div>
            <div className="occupancy-grid">
              {VILLAS.map(room => (
                <UnitCard key={room} room={room} type="Oceanfront Villa" />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
