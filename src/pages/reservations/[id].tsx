import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ArrowLeft, User, Calendar, DollarSign, Plane, Edit, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_FLOW = ['enquiry', 'confirmed', 'checked_in', 'checked_out']

export default function ReservationDetail() {
  const router = useRouter()
  const { id } = router.query
  const [res, setRes] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    const { data } = await supabase
      .from('reservations')
      .select('*, guests(*)')
      .eq('id', id)
      .single()
    setRes(data)
    setLoading(false)
  }

  async function updateStatus(status: string) {
    setUpdating(true)
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
    if (error) toast.error('Failed to update')
    else { toast.success(`Status updated to ${status}`); setRes((r: any) => ({ ...r, status })) }
    setUpdating(false)
  }

  async function deleteReservation() {
    if (!confirm('Delete this reservation? This cannot be undone.')) return
    const { error } = await supabase.from('reservations').delete().eq('id', id)
    if (error) toast.error('Failed to delete')
    else { toast.success('Reservation deleted'); router.push('/reservations') }
  }

  if (loading) return <div className="flex items-center justify-center min-h-64"><div className="font-cormorant italic" style={{ color: 'var(--text-dim)' }}>Loading...</div></div>
  if (!res) return <div className="text-center py-12"><div className="font-cormorant italic" style={{ color: 'var(--text-dim)' }}>Not found</div></div>

  const nights = differenceInDays(parseISO(res.check_out), parseISO(res.check_in))
  const currentStatusIdx = STATUS_FLOW.indexOf(res.status)

  return (
    <>
      <Head><title>Reservation · Coraléa CRM</title></Head>

      <Link href="/reservations" className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft size={14} />
        <span className="font-cinzel text-[9px] tracking-widest" style={{ letterSpacing: '0.3em' }}>RESERVATIONS</span>
      </Link>

      {/* Header card */}
      <div className="card p-5 mb-4 animate-fade-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <StatusBadge status={res.status} />
            <h1 className="font-cormorant text-xl font-light mt-2" style={{ color: 'var(--text-primary)' }}>
              {res.accommodation_type?.replace(/_/g, ' ')}
            </h1>
            {res.room_number && (
              <div className="font-cinzel text-[9px] tracking-widest mt-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.3em' }}>
                {res.room_number}
              </div>
            )}
          </div>
          <button onClick={deleteReservation}><Trash2 size={15} style={{ color: 'var(--danger)' }} /></button>
        </div>

        {/* Status progress */}
        <div className="flex items-center gap-1 mb-4">
          {STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <button onClick={() => updateStatus(s)} disabled={updating}
                className="flex-1 py-1.5 font-cinzel text-[7px] tracking-widest transition-all"
                style={{
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  background: i <= currentStatusIdx ? 'rgba(196,168,130,0.15)' : 'var(--surface-2)',
                  borderTop: `1px solid ${i <= currentStatusIdx ? 'var(--sand)' : 'var(--border)'}`,
                  borderBottom: `1px solid ${i <= currentStatusIdx ? 'var(--sand)' : 'var(--border)'}`,
                  borderLeft: i === 0 ? `1px solid ${i <= currentStatusIdx ? 'var(--sand)' : 'var(--border)'}` : 'none',
                  borderRight: i === STATUS_FLOW.length - 1 ? `1px solid ${i <= currentStatusIdx ? 'var(--sand)' : 'var(--border)'}` : 'none',
                  color: i <= currentStatusIdx ? 'var(--sand)' : 'var(--text-dim)',
                }}>
                {s.replace(/_/g, ' ')}
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>{nights}</div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Nights</div>
          </div>
          <div className="text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>
              {formatCurrency(res.total_amount, res.currency)}
            </div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Total</div>
          </div>
          <div className="text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>{res.adults + res.children}</div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Guests</div>
          </div>
        </div>
      </div>

      {/* Guest */}
      {res.guests && (
        <Link href={`/guests/${res.guest_id}`} className="card p-4 mb-4 flex items-center gap-3 block animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span className="font-cormorant italic text-base" style={{ color: 'var(--sand)' }}>
              {res.guests.first_name?.[0]}{res.guests.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1">
            <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>
              {res.guests.first_name} {res.guests.last_name}
            </div>
            <div className="eyebrow mt-0.5" style={{ fontSize: '7px' }}>View Full Profile →</div>
          </div>
          <VIPBadge tier={res.guests.vip_tier} />
        </Link>
      )}

      {/* Details */}
      <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="eyebrow" style={{ fontSize: '8px' }}>Stay Details</span>
        </div>
        <div className="p-4 space-y-3">
          {[
            { label: 'Check-in', value: format(parseISO(res.check_in), 'EEEE, MMMM d, yyyy') },
            { label: 'Check-out', value: format(parseISO(res.check_out), 'EEEE, MMMM d, yyyy') },
            { label: 'Nightly Rate', value: formatCurrency(res.nightly_rate, res.currency) },
            { label: 'Arrival Method', value: res.arrival_method?.replace(/_/g, ' ') || '—' },
            { label: 'Occasion', value: res.occasion || '—' },
            { label: 'Pre-arrival', value: res.pre_arrival_completed ? '✓ Completed' : '○ Pending' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="font-cinzel text-[8px] tracking-widest" style={{ color: 'var(--text-dim)', letterSpacing: '0.25em', minWidth: '110px' }}>{label}</span>
              <span className="font-raleway text-xs text-right" style={{ color: 'var(--text-muted)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Requests & Notes */}
      {res.special_requests && (
        <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Special Requests</span>
          </div>
          <div className="p-4">
            <p className="font-raleway text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{res.special_requests}</p>
          </div>
        </div>
      )}

      {res.concierge_notes && (
        <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Concierge Notes</span>
          </div>
          <div className="p-4">
            <p className="font-raleway text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{res.concierge_notes}</p>
          </div>
        </div>
      )}

      {/* Quick status actions */}
      <div className="grid grid-cols-2 gap-3 mb-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        {res.status === 'confirmed' && (
          <button onClick={() => updateStatus('checked_in')} className="btn-primary justify-center" disabled={updating}>
            <CheckCircle size={14} /> Check In
          </button>
        )}
        {res.status === 'checked_in' && (
          <button onClick={() => updateStatus('checked_out')} className="btn-primary justify-center" disabled={updating}>
            <CheckCircle size={14} /> Check Out
          </button>
        )}
        <Link href={`/experiences/new?reservation_id=${id}&guest_id=${res.guest_id}`} className="btn-ghost text-center col-span-1">
          Add Experience
        </Link>
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'badge-success', checked_in: 'badge-info',
    checked_out: 'badge-sand', cancelled: 'badge-danger', enquiry: 'badge-warning',
  }
  return <span className={`badge ${map[status] || 'badge-sand'}`}>{status?.replace(/_/g, ' ')}</span>
}

function VIPBadge({ tier }: { tier?: string }) {
  const map: Record<string, string> = {
    standard: 'badge badge-sand', silver: 'badge',
    gold: 'badge badge-warning', platinum: 'badge badge-platinum',
  }
  return <span className={map[tier || 'standard'] || 'badge badge-sand'}>{tier || 'STD'}</span>
}
