import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO } from 'date-fns'
import { Plus, Search, Calendar, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['all', 'confirmed', 'checked_in', 'checked_out', 'enquiry', 'cancelled']

export default function Reservations() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [statusFilter, search])

  async function load() {
    setLoading(true)
    let query = supabase
      .from('reservations')
      .select('*, guests(first_name, last_name, vip_tier)')
      .order('check_in', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    const { data, error } = await query.limit(50)
    if (error) toast.error('Failed to load reservations')
    else {
      let results = data || []
      if (search) {
        results = results.filter(r =>
          `${r.guests?.first_name} ${r.guests?.last_name}`.toLowerCase().includes(search.toLowerCase())
        )
      }
      setReservations(results)
    }
    setLoading(false)
  }

  return (
    <>
      <Head><title>Reservations · Coraléa CRM</title></Head>

      <div className="mb-5 animate-fade-up">
        <span className="eyebrow">Bookings</span>
        <h1 className="module-title mt-1">
          <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Reservations</span>
        </h1>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guest..." className="input-box pl-9" />
        </div>
        <Link href="/reservations/new" className="btn-primary flex-shrink-0"><Plus size={14} /></Link>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="flex-shrink-0 font-cinzel text-[8px] px-3 py-1.5 transition-all"
            style={{
              letterSpacing: '0.3em', textTransform: 'uppercase', border: '1px solid',
              borderColor: statusFilter === s ? 'var(--sand)' : 'var(--border)',
              color: statusFilter === s ? 'var(--sand)' : 'var(--text-dim)',
              background: statusFilter === s ? 'rgba(196,168,130,0.08)' : 'transparent',
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Active', value: reservations.filter(r => ['confirmed','checked_in'].includes(r.status)).length },
          { label: "Check-ins Today", value: reservations.filter(r => r.check_in === format(new Date(), 'yyyy-MM-dd')).length },
          { label: 'Month Revenue', value: formatCurrency(reservations.reduce((s, r) => s + (r.total_amount || 0), 0)) },
        ].map(({ label, value }) => (
          <div key={label} className="card p-3 text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>{value}</div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded" />)}</div>
        ) : reservations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--text-dim)' }}>No reservations found</div>
            <Link href="/reservations/new" className="btn-primary mt-4 inline-flex"><Plus size={14} /> New Reservation</Link>
          </div>
        ) : (
          reservations.map((res, i) => (
            <Link href={`/reservations/${res.id}`} key={res.id}
              className="flex items-start gap-3 p-4 transition-all"
              style={{ borderBottom: i < reservations.length - 1 ? '1px solid rgba(196,168,130,0.06)' : 'none' }}>
              <div className="flex-shrink-0 mt-0.5">
                <Calendar size={14} style={{ color: 'var(--sand)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>
                    {res.guests?.first_name} {res.guests?.last_name}
                  </span>
                  <StatusBadge status={res.status} />
                </div>
                <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                  {res.accommodation_type?.replace(/_/g, ' ')}
                </div>
                <div className="font-raleway text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                  {format(parseISO(res.check_in), 'MMM d')} → {format(parseISO(res.check_out), 'MMM d, yyyy')}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-cormorant italic text-sm" style={{ color: 'var(--sand)' }}>
                  {formatCurrency(res.total_amount, res.currency)}
                </div>
                <ChevronRight size={12} style={{ color: 'var(--text-dim)', marginLeft: 'auto', marginTop: 4 }} />
              </div>
            </Link>
          ))
        )}
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
