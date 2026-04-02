import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

type Status = 'available' | 'hold' | 'booked' | 'maintenance'
const STATUS_COLORS: Record<Status, { bg: string; text: string; label: string }> = {
  available:   { bg: 'transparent',                    text: 'var(--text-primary)', label: 'Available' },
  hold:        { bg: 'rgba(251,191,36,0.15)',          text: '#fbbf24',             label: 'On Hold'   },
  booked:      { bg: 'rgba(248,113,113,0.15)',         text: 'var(--status-cancel)',label: 'Booked'    },
  maintenance: { bg: 'rgba(148,163,184,0.12)',         text: '#94a3b8',             label: 'Maintenance' },
}

const VENUE_AREAS = ['property','beach','pavilion','villa_grand','villa_ocean','suite']

export default function Availability() {
  const [month, setMonth]       = useState(new Date())
  const [availability, setAv]   = useState<any[]>([])
  const [leads, setLeads]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [area, setArea]         = useState('property')
  const [form, setForm] = useState({
    venue_area: 'property', date: '', status: 'booked' as Status, notes: '', lead_id: '',
  })

  useEffect(() => { load() }, [month, area])

  async function load() {
    setLoading(true)
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end   = format(endOfMonth(month),   'yyyy-MM-dd')
    const [{ data: av }, { data: l }] = await Promise.all([
      supabase.from('venue_availability').select('*').eq('venue_area', area).gte('date', start).lte('date', end),
      supabase.from('inquiry_leads').select('id, first_name, last_name').in('status', ['new','contacted','tour_scheduled','proposal_sent']),
    ])
    setAv(av ?? [])
    setLeads(l ?? [])
    setLoading(false)
  }

  async function saveBlock(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('venue_availability').upsert({
      venue_area: form.venue_area,
      date:       form.date,
      status:     form.status,
      notes:      form.notes || null,
      lead_id:    form.lead_id || null,
      hold_expires_at: form.status === 'hold'
        ? new Date(Date.now() + 48 * 3600000).toISOString() : null,
    }, { onConflict: 'venue_area,date' })
    setSaving(false); setShowForm(false)
    setForm({ venue_area: 'property', date: '', status: 'booked', notes: '', lead_id: '' })
    load()
  }

  async function releaseHold(id: string) {
    await supabase.from('venue_availability').delete().eq('id', id)
    load()
  }

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const firstDow = startOfMonth(month).getDay() // 0=Sun
  const avMap: Record<string, any> = {}
  availability.forEach(a => { avMap[a.date] = a })

  const selectedAv = selected ? avMap[selected] : null
  const counts = {
    booked:      availability.filter(a => a.status === 'booked').length,
    hold:        availability.filter(a => a.status === 'hold').length,
    available:   days.length - availability.filter(a => ['booked','maintenance'].includes(a.status)).length,
  }

  return (
    <>
      <Head><title>Availability — Coraléa CRM</title></Head>

      <div className="page-header-row">
        <div>
          <div className="page-eyebrow">Lead Generation</div>
          <div className="page-title">Availability <em>Calendar</em></div>
          <div className="page-subtitle">Manage venue holds, bookings, and date availability</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={13} /> Block Date
        </button>
      </div>

      {/* KPIs */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="card card-elevated">
          <div className="card-label">Available Days</div>
          <div className="card-value" style={{ color: 'var(--status-in)' }}>{counts.available}</div>
          <div className="card-sub">This month</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">On Hold</div>
          <div className="card-value" style={{ color: '#fbbf24' }}>{counts.hold}</div>
          <div className="card-sub">48-hour courtesy holds</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Booked</div>
          <div className="card-value" style={{ color: 'var(--status-cancel)' }}>{counts.booked}</div>
          <div className="card-sub">Confirmed events</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Occupancy</div>
          <div className="card-value" style={{ color: 'var(--gold)' }}>
            {days.length > 0 ? Math.round((counts.booked / days.length) * 100) : 0}%
          </div>
          <div className="card-sub">Booked vs total days</div>
        </div>
      </div>

      {/* Area + block form */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Venue Area:</span>
        {VENUE_AREAS.map(a => (
          <button key={a} className={`btn btn-sm ${area === a ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setArea(a)} style={{ textTransform: 'capitalize' }}>
            {a.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card card-elevated" style={{ marginBottom: 16 }}>
          <div className="card-label" style={{ marginBottom: 14 }}>Block / Hold a Date</div>
          <form onSubmit={saveBlock}>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group"><label>Date *</label>
                <input className="input" type="date" required value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div className="form-group"><label>Venue Area</label>
                <select className="select" value={form.venue_area}
                  onChange={e => setForm(f => ({ ...f, venue_area: e.target.value }))}>
                  {VENUE_AREAS.map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
                </select></div>
            </div>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group"><label>Status</label>
                <select className="select" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
                  <option value="hold">Hold (48hr)</option>
                  <option value="booked">Booked</option>
                  <option value="maintenance">Maintenance</option>
                </select></div>
              <div className="form-group"><label>Linked Lead (optional)</label>
                <select className="select" value={form.lead_id}
                  onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}>
                  <option value="">None</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
                </select></div>
            </div>
            <div className="form-group"><label>Notes</label>
              <input className="input" value={form.notes} placeholder="Event name, notes…"
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div className="card card-elevated">
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setMonth(subMonths(month, 1))}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontFamily: 'var(--font-editorial)', fontSize: 20, fontStyle: 'italic', color: 'var(--text-primary)' }}>
              {format(month, 'MMMM yyyy')}
            </span>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setMonth(addMonths(month, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {/* Empty cells */}
            {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} />)}

            {days.map(day => {
              const ds  = format(day, 'yyyy-MM-dd')
              const av  = avMap[ds]
              const st  = (av?.status ?? 'available') as Status
              const cfg = STATUS_COLORS[st]
              const isSelected = selected === ds

              return (
                <div key={ds}
                  onClick={() => setSelected(selected === ds ? null : ds)}
                  style={{
                    aspectRatio: '1',
                    background: isSelected ? 'var(--gold-glow)' : cfg.bg,
                    border: `1px solid ${isSelected ? 'var(--gold)' : st !== 'available' ? cfg.text + '40' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 150ms',
                    padding: 4,
                  }}>
                  <span style={{
                    fontSize: 13, fontWeight: isToday(day) ? 700 : 400,
                    color: isToday(day) ? 'var(--gold)' : cfg.text,
                  }}>{format(day, 'd')}</span>
                  {st !== 'available' && (
                    <span style={{ fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: cfg.text, marginTop: 1, textAlign: 'center', lineHeight: 1.1 }}>
                      {st === 'hold' ? 'hold' : st === 'booked' ? 'bkd' : 'mnt'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {Object.entries(STATUS_COLORS).map(([s, cfg]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: cfg.bg || 'var(--border-subtle)', border: `1px solid ${cfg.text}40` }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Date detail */}
        {selected && (
          <div className="card card-elevated" style={{ position: 'sticky', top: 16 }}>
            <div className="flex-between" style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, fontStyle: 'italic' }}>
                {format(parseISO(selected), 'dd MMMM yyyy')}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            {selectedAv ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <span className={`badge ${selectedAv.status === 'booked' ? 'badge-cancelled' : selectedAv.status === 'hold' ? 'badge-enquiry' : 'badge-standard'}`} style={{ textTransform: 'capitalize' }}>
                    {selectedAv.status}
                  </span>
                </div>
                {selectedAv.notes && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                    {selectedAv.notes}
                  </div>
                )}
                {selectedAv.hold_expires_at && (
                  <div style={{ fontSize: 11, color: '#fbbf24', marginBottom: 12 }}>
                    Hold expires: {format(parseISO(selectedAv.hold_expires_at), 'dd MMM HH:mm')}
                  </div>
                )}
                {selectedAv.status === 'hold' && (
                  <button className="btn btn-danger btn-sm w-full"
                    onClick={() => releaseHold(selectedAv.id)}>
                    Release Hold
                  </button>
                )}
              </>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: 'var(--status-in)', marginBottom: 14 }}>✓ Available</div>
                <button className="btn btn-ghost btn-sm w-full"
                  onClick={() => { setForm(f => ({ ...f, date: selected })); setShowForm(true) }}>
                  Block This Date
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
