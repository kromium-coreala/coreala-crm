import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Edit, Shield, Star, Calendar, DollarSign, Sparkles, ChevronRight, Cake, Heart } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GuestDetail() {
  const router = useRouter()
  const { id } = router.query
  const [guest, setGuest] = useState<any>(null)
  const [reservations, setReservations] = useState<any[]>([])
  const [experiences, setExperiences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) loadGuest() }, [id])

  async function loadGuest() {
    const [guestRes, resRes, expRes] = await Promise.all([
      supabase.from('guests').select('*').eq('id', id).single(),
      supabase.from('reservations').select('*').eq('guest_id', id).order('check_in', { ascending: false }).limit(10),
      supabase.from('experiences').select('*').eq('guest_id', id).order('date', { ascending: false }).limit(10),
    ])
    setGuest(guestRes.data)
    setReservations(resRes.data || [])
    setExperiences(expRes.data || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="font-cormorant italic" style={{ color: 'var(--text-dim)' }}>Loading profile...</div>
    </div>
  )

  if (!guest) return (
    <div className="text-center py-12">
      <div className="font-cormorant italic text-xl" style={{ color: 'var(--text-dim)' }}>Guest not found</div>
      <Link href="/guests" className="btn-primary mt-4 inline-flex">Back to Guests</Link>
    </div>
  )

  return (
    <>
      <Head><title>{guest.first_name} {guest.last_name} · Coraléa CRM</title></Head>

      {/* Back */}
      <Link href="/guests" className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft size={14} />
        <span className="font-cinzel text-[9px] tracking-widest" style={{ letterSpacing: '0.3em' }}>ALL GUESTS</span>
      </Link>

      {/* Profile header */}
      <div className="card p-5 mb-4 animate-fade-up">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center relative"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <span className="font-cormorant italic text-2xl" style={{ color: 'var(--sand)' }}>
                {guest.first_name?.[0]}{guest.last_name?.[0]}
              </span>
              {guest.discretion_level === 'maximum' && (
                <div className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center"
                  style={{ background: 'var(--obsidian)', border: '1px solid rgba(196,168,130,0.3)' }}>
                  <Shield size={10} style={{ color: 'var(--sand)' }} />
                </div>
              )}
            </div>
            <div>
              <h1 className="font-cormorant text-2xl font-light" style={{ color: 'var(--text-primary)' }}>
                {guest.first_name} {guest.last_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <VIPBadge tier={guest.vip_tier} />
                {guest.discretion_level !== 'standard' && (
                  <span className="badge badge-danger">{guest.discretion_level} disc.</span>
                )}
              </div>
            </div>
          </div>
          <Link href={`/guests/${id}/edit`}>
            <Edit size={16} style={{ color: 'var(--text-dim)' }} />
          </Link>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>{guest.total_stays || 0}</div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Stays</div>
          </div>
          <div className="text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>
              {formatCurrency(guest.total_revenue || 0)}
            </div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Revenue</div>
          </div>
          <div className="text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>
              {guest.last_stay ? format(parseISO(guest.last_stay), 'MMM yy') : '—'}
            </div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Last Stay</div>
          </div>
        </div>
      </div>

      {/* Personal details */}
      <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="eyebrow" style={{ fontSize: '8px' }}>Personal Intelligence</span>
        </div>
        <div className="p-4 space-y-4">
          {[
            { label: 'Email', value: guest.email },
            { label: 'Phone', value: guest.phone || '—' },
            { label: 'Nationality', value: guest.nationality || '—' },
            { label: 'Preferred Currency', value: guest.preferred_currency || 'USD' },
            { label: 'Dietary Requirements', value: guest.dietary_requirements || 'None noted' },
            { label: 'Allergies', value: guest.allergies || 'None noted' },
            { label: 'Pillow Preference', value: guest.pillow_preference || 'Standard' },
            { label: 'Room Temperature', value: guest.room_temperature ? `${guest.room_temperature}°C` : '—' },
            { label: 'Preferred Activities', value: guest.preferred_activities?.join(', ') || '—' },
            { label: 'Arrival Preference', value: guest.arrival_preference || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="font-cinzel text-[8px] tracking-widest flex-shrink-0" style={{ color: 'var(--text-dim)', letterSpacing: '0.25em', minWidth: '120px' }}>
                {label}
              </span>
              <span className="font-raleway text-xs text-right" style={{ color: 'var(--text-muted)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Important dates */}
      {(guest.birthday || guest.anniversary_date) && (
        <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Important Dates</span>
          </div>
          <div className="p-4 space-y-3">
            {guest.birthday && (
              <div className="flex items-center gap-3">
                <Cake size={14} style={{ color: 'var(--sand)' }} />
                <div>
                  <div className="eyebrow" style={{ fontSize: '7px' }}>Birthday</div>
                  <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>
                    {format(parseISO(guest.birthday), 'MMMM d')}
                  </div>
                </div>
              </div>
            )}
            {guest.anniversary_date && (
              <div className="flex items-center gap-3">
                <Heart size={14} style={{ color: 'var(--sand)' }} />
                <div>
                  <div className="eyebrow" style={{ fontSize: '7px' }}>Anniversary</div>
                  <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>
                    {format(parseISO(guest.anniversary_date), 'MMMM d')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {guest.notes && (
        <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Concierge Notes</span>
          </div>
          <div className="p-4">
            <p className="font-raleway text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{guest.notes}</p>
          </div>
        </div>
      )}

      {/* Reservation history */}
      <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="eyebrow" style={{ fontSize: '8px' }}>Stay History</span>
          <Link href={`/reservations/new?guest_id=${id}`} className="btn-ghost" style={{ padding: '4px 12px', fontSize: '8px' }}>
            + NEW
          </Link>
        </div>
        {reservations.length === 0 ? (
          <div className="p-4 text-center font-cormorant italic" style={{ color: 'var(--text-dim)' }}>No stays recorded</div>
        ) : (
          reservations.map((res, i) => (
            <Link href={`/reservations/${res.id}`} key={res.id}
              className="flex items-center gap-3 p-4 transition-all"
              style={{ borderBottom: i < reservations.length - 1 ? '1px solid rgba(196,168,130,0.05)' : 'none' }}>
              <div className="flex-1">
                <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>
                  {res.accommodation_type?.replace(/_/g, ' ')}
                </div>
                <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  {format(parseISO(res.check_in), 'MMM d')} – {format(parseISO(res.check_out), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="text-right">
                <div className="font-cormorant italic text-sm" style={{ color: 'var(--sand)' }}>
                  {formatCurrency(res.total_amount, res.currency)}
                </div>
                <StatusBadge status={res.status} />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Experience history */}
      <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="eyebrow" style={{ fontSize: '8px' }}>Experience History</span>
        </div>
        {experiences.length === 0 ? (
          <div className="p-4 text-center font-cormorant italic" style={{ color: 'var(--text-dim)' }}>No experiences recorded</div>
        ) : (
          experiences.map((exp, i) => (
            <div key={exp.id} className="flex items-center gap-3 p-4"
              style={{ borderBottom: i < experiences.length - 1 ? '1px solid rgba(196,168,130,0.05)' : 'none' }}>
              <Sparkles size={13} style={{ color: 'var(--sand)', flexShrink: 0 }} />
              <div className="flex-1">
                <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{exp.name}</div>
                <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  {format(parseISO(exp.date), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="font-cormorant italic text-sm" style={{ color: 'var(--sand)' }}>
                {formatCurrency(exp.amount, exp.currency)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <Link href={`/reservations/new?guest_id=${id}`} className="btn-primary flex-1 justify-center">
          <Calendar size={14} /> New Reservation
        </Link>
        <Link href={`/guests/${id}/edit`} className="btn-ghost flex-1 justify-center text-center">
          Edit Profile
        </Link>
      </div>
    </>
  )
}

function VIPBadge({ tier }: { tier?: string }) {
  const map: Record<string, string> = {
    standard: 'badge badge-sand',
    silver: 'badge',
    gold: 'badge badge-warning',
    platinum: 'badge badge-platinum',
  }
  return <span className={map[tier || 'standard'] || 'badge badge-sand'}>{tier || 'STD'}</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'badge-success', checked_in: 'badge-info',
    checked_out: 'badge-sand', cancelled: 'badge-danger', enquiry: 'badge-warning',
  }
  return <span className={`badge ${map[status] || 'badge-sand'} mt-1 block text-right`}>{status?.replace(/_/g, ' ')}</span>
}
