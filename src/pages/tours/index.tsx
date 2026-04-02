import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns'
import { Plus, MapPin, Check, X, Clock } from 'lucide-react'

const TOUR_TYPES = ['in_person', 'virtual', 'sunset_tour']
const OUTCOMES   = ['completed', 'no_show', 'rescheduled', 'cancelled']

// Tours are stored in inquiry_leads using tour_requested / tour_scheduled_at / tour_completed
// We extend with a lightweight local state layer until a dedicated tours table is added

export default function Tours() {
  const [tours, setTours]         = useState<any[]>([])
  const [leads, setLeads]         = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [selected, setSelected]   = useState<any>(null)
  const [filter, setFilter]       = useState<'all'|'upcoming'|'today'|'past'>('all')
  const [form, setForm] = useState({
    lead_id: '', scheduled_at: '', tour_type: 'in_person', notes: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: t }, { data: l }] = await Promise.all([
      // Leads with tours scheduled or requested
      supabase.from('inquiry_leads')
        .select('*')
        .or('tour_requested.eq.true,tour_scheduled_at.not.is.null')
        .order('tour_scheduled_at', { ascending: true }),
      // All hot/warm leads eligible for tour booking
      supabase.from('inquiry_leads')
        .select('id, first_name, last_name, email, lead_tier, lead_score, event_type')
        .in('lead_tier', ['hot','warm'])
        .not('status', 'in', '("lost","booking_confirmed")')
        .order('lead_score', { ascending: false }),
    ])
    setTours(t ?? [])
    setLeads(l ?? [])
    setLoading(false)
  }

  async function scheduleTour(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('inquiry_leads').update({
      tour_requested:    true,
      tour_scheduled_at: new Date(form.scheduled_at).toISOString(),
      status:            'tour_scheduled',
      notes:             form.notes ? `[Tour: ${form.tour_type}] ${form.notes}` : `[Tour: ${form.tour_type}]`,
    }).eq('id', form.lead_id)
    setSaving(false)
    setShowForm(false)
    setForm({ lead_id: '', scheduled_at: '', tour_type: 'in_person', notes: '' })
    load()
  }

  async function markOutcome(id: string, outcome: string) {
    const update: any = { status: outcome === 'completed' ? 'tour_completed' : outcome === 'no_show' ? 'nurturing' : 'tour_scheduled' }
    if (outcome === 'completed') update.tour_completed = true
    await supabase.from('inquiry_leads').update(update).eq('id', id)
    load()
    if (selected?.id === id) setSelected((s: any) => ({ ...s, ...update }))
  }

  const filtered = tours.filter(t => {
    const ts = t.tour_scheduled_at
    if (!ts) return filter === 'all'
    const d  = parseISO(ts)
    if (filter === 'today')    return isToday(d)
    if (filter === 'upcoming') return isFuture(d) && !isToday(d)
    if (filter === 'past')     return isPast(d) && !isToday(d)
    return true
  })

  const stats = {
    booked:    tours.filter(t => t.status === 'tour_scheduled').length,
    completed: tours.filter(t => t.tour_completed).length,
    noShow:    tours.filter(t => t.status === 'nurturing' && t.tour_requested).length,
    today:     tours.filter(t => t.tour_scheduled_at && isToday(parseISO(t.tour_scheduled_at))).length,
  }
  const showRate = (stats.booked + stats.completed) > 0
    ? Math.round((stats.completed / (stats.completed + stats.noShow || 1)) * 100) : 0

  return (
    <>
      <Head><title>Tours — Coraléa CRM</title></Head>

      <div className="page-header-row">
        <div>
          <div className="page-eyebrow">Lead Generation</div>
          <div className="page-title">Site <em>Tours</em></div>
          <div className="page-subtitle">Schedule and track venue tours and site visits</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={13} /> Schedule Tour
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="card card-elevated">
          <div className="card-label">Tours Today</div>
          <div className="card-value" style={{ color: stats.today > 0 ? 'var(--gold)' : 'var(--text-primary)' }}>
            {stats.today}
          </div>
          <div className="card-sub">{stats.today > 0 ? 'Prepare venue' : 'No tours today'}</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Booked</div>
          <div className="card-value" style={{ color: 'var(--status-conf)' }}>{stats.booked}</div>
          <div className="card-sub">Upcoming scheduled</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Completed</div>
          <div className="card-value" style={{ color: 'var(--status-in)' }}>{stats.completed}</div>
          <div className="card-sub">All time</div>
        </div>
        <div className="card card-elevated" style={{ borderColor: showRate >= 85 ? 'rgba(74,222,128,0.25)' : 'rgba(251,191,36,0.25)' }}>
          <div className="card-label">Show Rate</div>
          <div className="card-value" style={{ color: showRate >= 85 ? 'var(--status-in)' : '#fbbf24' }}>
            {showRate}%
          </div>
          <div className="card-sub">Target: 85%</div>
        </div>
      </div>

      {/* Schedule form */}
      {showForm && (
        <div className="card card-elevated" style={{ marginBottom: 16 }}>
          <div className="card-label" style={{ marginBottom: 14 }}>Schedule a Tour</div>
          <form onSubmit={scheduleTour}>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Lead *</label>
                <select className="select" required value={form.lead_id}
                  onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}>
                  <option value="">Select a lead…</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.first_name} {l.last_name} — {(l.event_type ?? 'event').replace(/_/g,' ')} · Score {l.lead_score}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tour Type</label>
                <select className="select" value={form.tour_type}
                  onChange={e => setForm(f => ({ ...f, tour_type: e.target.value }))}>
                  <option value="in_person">In-Person Site Visit</option>
                  <option value="virtual">Virtual Tour (video call)</option>
                  <option value="sunset_tour">Sunset Tour (golden hour)</option>
                </select>
              </div>
            </div>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>Date & Time *</label>
                <input className="input" type="datetime-local" required value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input className="input" value={form.notes} placeholder="Arrival instructions, special prep…"
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Schedule Tour'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['all','today','upcoming','past'] as const).map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
            {f === 'today' && stats.today > 0 ? `Today (${stats.today})` : f}
          </button>
        ))}
      </div>

      {selected && <div className='split-panel-backdrop' onClick={() => setSelected(null)} />}
      <div className='split-panel' style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div className="card card-elevated">
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Lead</th><th>Event</th><th className="hide-mobile">Score</th><th className="hide-mobile">Tour Type</th>
                <th>Scheduled</th><th>Status</th><th>Outcome</th>
              </tr></thead>
              <tbody>
                {loading && Array.from({ length: 5 }).map((_,i) => (
                  <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 40 }} /></td></tr>
                ))}
                {!loading && filtered.map(tour => {
                  const ts = tour.tour_scheduled_at ? parseISO(tour.tour_scheduled_at) : null
                  const isUpcoming = ts && isFuture(ts)
                  const isPastDate = ts && isPast(ts) && !isToday(ts ?? new Date())

                  return (
                    <tr key={tour.id}
                      style={{ cursor: 'pointer', background: selected?.id === tour.id ? 'var(--gold-glow)' : ts && isToday(ts) ? 'rgba(201,169,110,0.04)' : undefined }}
                      onClick={() => setSelected(selected?.id === tour.id ? null : tour)}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{tour.first_name} {tour.last_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tour.email}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {(tour.event_type ?? '—').replace(/_/g,' ')}
                      </td>
                      <td className='hide-mobile' style={{ fontFamily: 'var(--font-editorial)', fontSize: 20, fontStyle: 'italic', color: (tour.lead_score ?? 0) >= 85 ? 'var(--status-cancel)' : '#fbbf24' }}>
                        {tour.lead_score ?? 0}
                      </td>
                      <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {(tour.notes ?? '').match(/\[Tour: ([^\]]+)\]/)?.[1]?.replace(/_/g,' ') ?? 'In Person'}
                      </td>
                      <td>
                        {ts ? (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: isToday(ts) ? 700 : 400, color: isToday(ts) ? 'var(--gold)' : 'var(--text-primary)' }}>
                              {isToday(ts) ? '🟡 Today ' : ''}{format(ts, 'dd MMM yyyy')}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(ts, 'HH:mm')}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>TBC</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          tour.tour_completed ? 'badge-completed'
                          : tour.status === 'tour_scheduled' ? 'badge-confirmed'
                          : 'badge-enquiry'
                        }`}>
                          {tour.tour_completed ? 'Completed' : tour.status === 'tour_scheduled' ? 'Scheduled' : 'Requested'}
                        </span>
                      </td>
                      <td>
                        {!tour.tour_completed && isPastDate && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-sm" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--status-in)', border: '1px solid rgba(74,222,128,0.25)', padding: '4px 8px', minHeight: 'unset' }}
                              onClick={e => { e.stopPropagation(); markOutcome(tour.id, 'completed') }}>
                              <Check size={11} />
                            </button>
                            <button className="btn btn-sm btn-danger" style={{ padding: '4px 8px', minHeight: 'unset' }}
                              onClick={e => { e.stopPropagation(); markOutcome(tour.id, 'no_show') }}>
                              <X size={11} />
                            </button>
                          </div>
                        )}
                        {tour.tour_completed && <span style={{ fontSize: 11, color: 'var(--status-in)' }}>✓ Done</span>}
                      </td>
                    </tr>
                  )
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    No tours in this view
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className='card card-elevated detail-panel' style={{ position: 'sticky', top: 16 }}>
            <div className="flex-between" style={{ marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{selected.first_name} {selected.last_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Lead score {selected.lead_score} · {selected.lead_tier}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            {selected.tour_scheduled_at && (
              <div style={{ background: 'var(--gold-glow)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={14} color="var(--gold)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>
                      {format(parseISO(selected.tour_scheduled_at), 'EEEE, dd MMMM yyyy')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {format(parseISO(selected.tour_scheduled_at), 'HH:mm')} · Coraléa Private Retreat
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick contact */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <a href={`mailto:${selected.email}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                Email
              </a>
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  Call
                </a>
              )}
              {selected.whatsapp_opted && selected.phone && (
                <a href={`https://wa.me/${selected.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                  className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.25)' }}>
                  WA
                </a>
              )}
            </div>

            {/* Lead details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 16 }}>
              {[
                ['Event',   (selected.event_type ?? '—').replace(/_/g,' ')],
                ['Date',    selected.event_date ? format(parseISO(selected.event_date), 'dd MMM yyyy') : 'Flexible'],
                ['Guests',  selected.guest_count ?? '—'],
                ['Budget',  selected.budget_range?.replace(/_/g,' ') ?? '—'],
                ['Country', selected.country ?? '—'],
                ['Source',  selected.utm_source ?? selected.how_found_us ?? '—'],
              ].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 12, textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Outcome buttons */}
            {!selected.tour_completed && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Record Outcome</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button className="btn btn-sm" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--status-in)', border: '1px solid rgba(74,222,128,0.25)', justifyContent: 'center' }}
                    onClick={() => markOutcome(selected.id, 'completed')}>
                    <Check size={11} /> Completed
                  </button>
                  <button className="btn btn-sm btn-danger" style={{ justifyContent: 'center' }}
                    onClick={() => markOutcome(selected.id, 'no_show')}>
                    <X size={11} /> No-Show
                  </button>
                </div>
              </div>
            )}

            {/* Post-tour actions */}
            {selected.tour_completed && (
              <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--status-in)', fontWeight: 600, marginBottom: 8 }}>✓ Tour completed — next steps:</div>
                <a href="/proposals" className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'center', marginBottom: 6 }}>
                  Generate Proposal
                </a>
                <a href={`mailto:${selected.email}?subject=Following up on your Coraléa tour&body=Dear ${selected.first_name},%0D%0A%0D%0AThank you for visiting Coraléa. It was a pleasure showing you our property.%0D%0A%0D%0AI will have your personalised proposal ready within the hour.`}
                  className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'center' }}>
                  Send Follow-Up
                </a>
              </div>
            )}

            {selected.notes && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-sm)' }}>
                {selected.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
