import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Edit, Cake, Gift, Star, Plane, Utensils, Bed, Heart } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { useDiscretionMode } from '@/components/layout/Sidebar'
import PersonalisationEngine from '@/components/PersonalisationEngine'

export default function GuestProfile() {
  const router = useRouter()
  const { id } = router.query
  const { discretion } = useDiscretionMode()
  const [guest, setGuest] = useState<any>(null)
  const [reservations, setReservations] = useState<any[]>([])
  const [experiences, setExperiences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    const [gRes, rRes, eRes] = await Promise.all([
      supabase.from('guests').select('*').eq('id', id).single(),
      supabase.from('reservations').select('*').eq('guest_id', id).order('check_in', { ascending: false }),
      supabase.from('experiences').select('*').eq('guest_id', id).order('date', { ascending: false }),
    ])
    setGuest(gRes.data)
    setReservations(rRes.data || [])
    setExperiences(eRes.data || [])
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div>
  if (!guest) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Guest not found</div>

  const maskedName = () => {
    if (discretion && guest.discretion_level === 'maximum') return '— Confidential —'
    if (discretion && guest.discretion_level === 'high') return `${guest.first_name?.[0]}. ${guest.last_name?.[0]}.`
    return `${guest.first_name} ${guest.last_name}`
  }

  return (
    <>
      <Head><title>{maskedName()} — Coraléa CRM</title></Head>

      <div style={{ marginBottom: 24 }}>
        <Link href="/guests" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
          <ArrowLeft size={13} /> Back to Guests
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--gold-glow)', border: '2px solid var(--border-mid)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gold)',
              letterSpacing: '0.05em', flexShrink: 0,
            }}>
              {discretion && guest.discretion_level === 'maximum' ? '?' : `${guest.first_name?.[0]}${guest.last_name?.[0]}`}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 28, fontWeight: 300, color: 'var(--text-primary)' }}>{maskedName()}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span className={`badge badge-${guest.vip_tier}`}>{guest.vip_tier}</span>
                {guest.discretion_level !== 'standard' && <span className={`badge badge-${guest.discretion_level}`}>{guest.discretion_level} disc.</span>}
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{guest.nationality}</span>
              </div>
            </div>
          </div>
          <Link href={`/guests/${id}/edit`} className="btn btn-ghost">
            <Edit size={13} /> Edit Profile
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="card card-elevated">
          <div className="card-label">Total Stays</div>
          <div className="card-value">{guest.total_stays || 0}</div>
          <div className="card-sub">Lifetime visits</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Lifetime Value</div>
          <div className="card-value">{formatCurrency(guest.total_revenue || 0, 'USD')}</div>
          <div className="card-sub">Room revenue</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Experiences</div>
          <div className="card-value">{experiences.length}</div>
          <div className="card-sub">{experiences.filter(e => e.status === 'completed').length} completed</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Last Stay</div>
          <div className="card-value-md" style={{ marginTop: 4 }}>
            {guest.last_stay ? format(parseISO(guest.last_stay), 'MMM yyyy') : '—'}
          </div>
          <div className="card-sub">Most recent visit</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Preferences */}
          <div className="card card-elevated">
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 16 }}>Guest Preferences</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              {[
                { icon: Utensils, label: 'Dietary', value: guest.dietary_requirements || '—' },
                { icon: Heart, label: 'Allergies', value: guest.allergies || '—' },
                { icon: Bed, label: 'Pillow', value: guest.pillow_preference || '—' },
                { icon: Heart, label: 'Room Temp', value: guest.room_temperature ? `${guest.room_temperature}°C` : '—' },
                { icon: Plane, label: 'Arrival', value: guest.arrival_preference || '—' },
                { icon: Star, label: 'Currency', value: guest.preferred_currency || 'USD' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon size={12} color="var(--gold)" />
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
            {guest.preferred_activities?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Preferred Activities</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {guest.preferred_activities.map((a: string) => (
                    <span key={a} className="badge badge-standard">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stay history */}
          <div className="card card-elevated">
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 16 }}>Stay History</div>
            {reservations.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No reservations found</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Room</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {reservations.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em' }}>{r.room_number}</td>
                        <td style={{ fontSize: 12 }}>{format(parseISO(r.check_in), 'dd MMM yyyy')}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(parseISO(r.check_out), 'dd MMM yyyy')}</td>
                        <td style={{ color: 'var(--gold)', fontSize: 13 }}>{formatCurrency(r.total_amount, r.currency)}</td>
                        <td><span className={`badge badge-${r.status}`}>{r.status.replace('_', ' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Experiences */}
          <div className="card card-elevated">
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 16 }}>Experiences</div>
            {experiences.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No experiences logged</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Experience</th><th>Type</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {experiences.map(e => (
                      <tr key={e.id}>
                        <td style={{ fontSize: 13, fontWeight: 500 }}>{e.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{e.experience_type?.replace('_', ' ')}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(parseISO(e.date), 'dd MMM yyyy')}</td>
                        <td style={{ color: 'var(--gold)', fontSize: 13 }}>{e.amount ? formatCurrency(e.amount, e.currency || 'USD') : '—'}</td>
                        <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Personalisation Engine */}
          <PersonalisationEngine
            guest={guest}
            reservations={reservations}
            experiences={experiences}
          />

          {/* Important dates */}
          <div className="card card-elevated">
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 16 }}>Important Dates</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {guest.birthday && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(251,191,36,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(251,191,36,0.15)' }}>
                  <Cake size={14} color="#fbbf24" />
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Birthday</div>
                    <div style={{ fontSize: 13 }}>{format(parseISO(guest.birthday), 'dd MMMM')}</div>
                  </div>
                </div>
              )}
              {guest.anniversary_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--gold-glow)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)' }}>
                  <Gift size={14} color="var(--gold)" />
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Anniversary</div>
                    <div style={{ fontSize: 13 }}>{format(parseISO(guest.anniversary_date), 'dd MMMM yyyy')}</div>
                  </div>
                </div>
              )}
              {!guest.birthday && !guest.anniversary_date && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No dates recorded</div>
              )}
            </div>
          </div>

          {/* Contact & passport */}
          {!discretion && (
            <div className="card card-elevated">
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 16 }}>Contact Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Email', value: guest.email },
                  { label: 'Phone', value: guest.phone || '—' },
                  { label: 'Passport', value: guest.passport_number || '—' },
                  { label: 'Nationality', value: guest.nationality || '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concierge notes */}
          {guest.notes && (
            <div className="card card-elevated">
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 12 }}>Concierge Notes</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{guest.notes}</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
