import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO, isFuture, isPast, isToday } from 'date-fns'
import { Plus, PartyPopper, ChevronRight, LayoutList, Calendar, ArrowLeft, Save, X } from 'lucide-react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

export default function Events() {
  const router = useRouter()
  const isNew = router.pathname === '/events/new'
  return isNew ? <NewEvent /> : <EventsList />
}

function EventsList() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')

  useEffect(() => { load() }, [filter])

  async function load() {
    let query = supabase.from('events').select('*').order('date', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setEvents(data || [])
    setLoading(false)
  }

  const totalRevenue = events.filter(e => e.status === 'completed').reduce((s, e) => s + (e.total_revenue || 0), 0)

  return (
    <>
      <Head><title>Events · Coraléa CRM</title></Head>

      <div className="mb-5 animate-fade-up">
        <span className="eyebrow">Private</span>
        <h1 className="module-title mt-1">
          <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Events</span>
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="card p-3 text-center">
          <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>{events.length}</div>
          <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Total Events</div>
        </div>
        <div className="card p-3 text-center">
          <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>
            {events.filter(e => ['planning','confirmed'].includes(e.status)).length}
          </div>
          <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Active</div>
        </div>
        <div className="card p-3 text-center">
          <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>{formatCurrency(totalRevenue)}</div>
          <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Revenue</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all','enquiry','planning','confirmed','completed','cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="flex-shrink-0 font-cinzel text-[8px] px-3 py-1.5 transition-all capitalize"
            style={{
              letterSpacing: '0.25em', border: '1px solid',
              borderColor: filter === s ? 'var(--sand)' : 'var(--border)',
              color: filter === s ? 'var(--sand)' : 'var(--text-dim)',
              background: filter === s ? 'rgba(196,168,130,0.08)' : 'transparent',
            }}>
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <Link href="/events/new" className="btn-primary"><Plus size={14} /> New Event</Link>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('list')} className="p-2 transition-all"
            style={{ border: '1px solid', borderColor: viewMode === 'list' ? 'var(--sand)' : 'var(--border)', color: viewMode === 'list' ? 'var(--sand)' : 'var(--text-dim)' }}>
            <LayoutList size={14} />
          </button>
          <button onClick={() => setViewMode('timeline')} className="p-2 transition-all"
            style={{ border: '1px solid', borderColor: viewMode === 'timeline' ? 'var(--sand)' : 'var(--border)', color: viewMode === 'timeline' ? 'var(--sand)' : 'var(--text-dim)' }}>
            <Calendar size={14} />
          </button>
        </div>
      </div>

      {/* TIMELINE VIEW */}
      {viewMode === 'timeline' && !loading && (
        <div className="space-y-2 mb-4">
          {events.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="font-cormorant italic text-xl" style={{ color: 'var(--text-dim)' }}>No events found</div>
            </div>
          ) : events.map(ev => {
            const evDate = parseISO(ev.date)
            const upcoming = isFuture(evDate)
            const today_ = isToday(evDate)
            return (
              <Link href={`/events/${ev.id}`} key={ev.id}
                className="flex gap-4 p-4 transition-all"
                style={{ background: 'var(--surface)', border: `1px solid ${today_ ? 'var(--border-active)' : 'var(--border)'}` }}>
                {/* Date column */}
                <div className="flex-shrink-0 w-12 text-center" style={{ borderRight: '1px solid var(--border)', paddingRight: '12px' }}>
                  <div className="font-cinzel text-[8px]" style={{ color: upcoming ? '#6abf8e' : 'var(--text-dim)', letterSpacing: '0.2em' }}>
                    {format(evDate, 'MMM')}
                  </div>
                  <div className="font-cormorant italic text-2xl" style={{ color: upcoming ? 'var(--sand)' : 'var(--text-dim)', lineHeight: 1.1 }}>
                    {format(evDate, 'd')}
                  </div>
                  <div className="font-cinzel text-[7px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
                    {format(evDate, 'EEE').toUpperCase()}
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{ev.name}</div>
                      <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                        {ev.event_type?.replace(/_/g, ' ')} · {ev.guest_count} guests
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <StatusBadge status={ev.status} />
                      {ev.total_revenue && (
                        <div className="font-cormorant italic text-xs mt-1" style={{ color: 'var(--sand)' }}>
                          {formatCurrency(ev.total_revenue, ev.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight size={13} style={{ color: 'var(--text-dim)', flexShrink: 0, marginTop: 2 }} />
              </Link>
            )
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
      <div className="card">
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded" />)}</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--text-dim)' }}>No events found</div>
          </div>
        ) : (
          events.map((ev, i) => (
            <Link href={`/events/${ev.id}`} key={ev.id}
              className="flex items-start gap-3 p-4 transition-all"
              style={{ borderBottom: i < events.length - 1 ? '1px solid rgba(196,168,130,0.06)' : 'none' }}>
              <PartyPopper size={14} style={{ color: 'var(--sand)', flexShrink: 0, marginTop: 3 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{ev.name}</span>
                  <StatusBadge status={ev.status} />
                </div>
                <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                  {ev.event_type?.replace(/_/g, ' ')} · {ev.guest_count} guests
                </div>
                <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  {format(parseISO(ev.date), 'MMMM d, yyyy')}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {ev.budget && (
                  <div className="font-cormorant italic text-sm" style={{ color: 'var(--sand)' }}>
                    {formatCurrency(ev.budget, ev.currency)}
                  </div>
                )}
                <ChevronRight size={12} style={{ color: 'var(--text-dim)', marginLeft: 'auto', marginTop: 4 }} />
              </div>
            </Link>
          ))
        )}
      </div>
      )}
    </>
  )
}

function NewEvent() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', event_type: 'wedding', date: '',
    guest_count: 20, contact_name: '', contact_email: '',
    contact_phone: '', budget: '', currency: 'USD',
    status: 'enquiry', notes: '',
  })

  function set(k: string, v: any) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('events').insert({
        ...form,
        budget: form.budget ? Number(form.budget) : null,
        guest_count: Number(form.guest_count),
      })
      if (error) throw error
      toast.success('Event created')
      router.push('/events')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, children }: any) => <div><label className="label-luxury">{label}</label>{children}</div>

  return (
    <>
      <Head><title>New Event · Coraléa CRM</title></Head>
      <Link href="/events" className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft size={14} />
        <span className="font-cinzel text-[9px] tracking-widest" style={{ letterSpacing: '0.3em' }}>EVENTS</span>
      </Link>
      <div className="mb-5">
        <span className="eyebrow">Private Event</span>
        <h1 className="module-title mt-1">Create <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Event</span></h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Event Details</span>
          </div>
          <div className="p-4 space-y-4">
            <Field label="Event Name *">
              <input className="input-box" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Williams Wedding Reception" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select className="input-box" value={form.event_type} onChange={e => set('event_type', e.target.value)}>
                  {['wedding','corporate','birthday','anniversary','private_dinner','other'].map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date *">
                <input type="date" className="input-box" value={form.date} onChange={e => set('date', e.target.value)} required />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Guest Count">
                <input type="number" min="1" max="60" className="input-box" value={form.guest_count} onChange={e => set('guest_count', e.target.value)} />
              </Field>
              <Field label="Status">
                <select className="input-box" value={form.status} onChange={e => set('status', e.target.value)}>
                  {['enquiry','planning','confirmed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Budget">
                <input type="number" className="input-box" value={form.budget} onChange={e => set('budget', e.target.value)} />
              </Field>
              <Field label="Currency">
                <select className="input-box" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {['USD','BBD','GBP','EUR','CAD','KYD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Contact Details</span>
          </div>
          <div className="p-4 space-y-4">
            <Field label="Contact Name *">
              <input className="input-box" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} required />
            </Field>
            <Field label="Contact Email *">
              <input type="email" className="input-box" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} required />
            </Field>
            <Field label="Contact Phone">
              <input className="input-box" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            </Field>
            <Field label="Notes">
              <textarea className="input-box" rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
            <Save size={14} /> {saving ? 'Creating...' : 'Create Event'}
          </button>
          <Link href="/events" className="btn-ghost text-center" style={{ flex: 1 }}>Cancel</Link>
        </div>
      </form>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'badge-success', planning: 'badge-info',
    completed: 'badge-sand', cancelled: 'badge-danger', enquiry: 'badge-warning',
  }
  return <span className={`badge ${map[status] || 'badge-sand'}`}>{status}</span>
}
