import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { Plus, ChevronRight, CalendarDays } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

const STATUSES = ['all', 'confirmed', 'planning', 'enquiry', 'completed', 'cancelled']

export default function Events() {
  const [events, setEvents] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  useEffect(() => {
    setFiltered(status === 'all' ? events : events.filter(e => e.status === status))
  }, [events, status])

  async function load() {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  const totalRevenue = events.filter(e => e.status === 'completed').reduce((s, e) => s + (e.total_revenue || 0), 0)

  return (
    <>
      <Head><title>Events — Coraléa CRM</title></Head>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-eyebrow">Occasions</div>
          <div className="page-title">Events & <em>Private Dining</em></div>
          <div className="page-subtitle">{events.length} events on record</div>
        </div>
        <Link href="/events/new" className="btn btn-primary">
          <Plus size={13} /> New Event
        </Link>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="card card-elevated">
          <div className="card-label">Total Events</div>
          <div className="card-value">{events.length}</div>
          <div className="card-sub">All time</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Upcoming</div>
          <div className="card-value" style={{ color: 'var(--status-conf)' }}>{events.filter(e => ['confirmed', 'planning'].includes(e.status)).length}</div>
          <div className="card-sub">Confirmed or planning</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Events Revenue</div>
          <div className="card-value">{formatCurrency(totalRevenue, 'USD')}</div>
          <div className="card-sub">From completed events</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Largest Event</div>
          <div className="card-value">48</div>
          <div className="card-sub">Holloway-Prescott Wedding</div>
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      <div className="card card-elevated">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>No events found</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th className="hide-mobile">Type</th>
                  <th>Date</th>
                  <th>Guests</th>
                  <th className="hide-mobile">Contact</th>
                  <th className="hide-mobile">Budget</th>
                  <th className="hide-mobile">Revenue</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{e.notes?.slice(0, 60)}{e.notes?.length > 60 ? '…' : ''}</div>
                    </td>
                    <td className='hide-mobile' style={{ textTransform: 'capitalize', fontSize: 12, color: 'var(--text-secondary)' }}>{e.event_type?.replace('_', ' ')}</td>
                    <td style={{ fontSize: 12 }}>
                      <div>{format(parseISO(e.date), 'dd MMM yyyy')}</div>
                    </td>
                    <td style={{ fontSize: 13, textAlign: 'center' }}>{e.guest_count}</td>
                    <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{e.contact_name}</td>
                    <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.budget ? formatCurrency(e.budget, e.currency || 'USD') : '—'}</td>
                    <td className='hide-mobile' style={{ color: 'var(--gold)', fontSize: 13 }}>{e.total_revenue ? formatCurrency(e.total_revenue, e.currency || 'USD') : '—'}</td>
                    <td><span className={`badge badge-${e.status}`}>{e.status}</span></td>
                    <td>
                      <Link href={`/events/${e.id}`} className="btn btn-ghost btn-sm btn-icon">
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
