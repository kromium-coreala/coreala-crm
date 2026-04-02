import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { Inbox, Phone, Mail, MessageCircle, Clock, AlertCircle } from 'lucide-react'

const TIERS: Record<string, { label: string; cls: string; color: string }> = {
  hot:         { label: 'HOT',         cls: 'badge-cancelled',  color: 'var(--status-cancel)' },
  warm:        { label: 'WARM',        cls: 'badge-enquiry',    color: '#fbbf24' },
  cold:        { label: 'COLD',        cls: 'badge-standard',   color: 'var(--text-muted)'   },
  unqualified: { label: 'UNQUALIFIED', cls: 'badge-standard',   color: 'var(--text-muted)'   },
}

const STATUSES = ['all','new','contacted','tour_scheduled','proposal_sent','booking_confirmed','lost','nurturing']

const fmt$ = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`

export default function Enquiries() {
  const [leads, setLeads]           = useState<any[]>([])
  const [profiles, setProfiles]     = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<any>(null)
  const [tierFilter, setTierFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch]         = useState('')
  const [saving, setSaving]         = useState(false)
  const [noteText, setNoteText]     = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: l }, { data: p }] = await Promise.all([
      supabase.from('inquiry_leads')
        .select('*, assignee:profiles!assigned_to(full_name)')
        .order('created_at', { ascending: false })
        .limit(300),
      supabase.from('profiles').select('id, full_name').order('full_name'),
    ])
    setLeads(l ?? [])
    setProfiles(p ?? [])
    setLoading(false)
  }

  const filtered = leads.filter(l => {
    if (tierFilter   !== 'all' && l.lead_tier !== tierFilter) return false
    if (statusFilter !== 'all' && l.status    !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${l.first_name} ${l.last_name} ${l.email}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const hot   = leads.filter(l => l.lead_tier === 'hot').length
  const warm  = leads.filter(l => l.lead_tier === 'warm').length
  const newToday = leads.filter(l => {
    const d = new Date(l.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length
  const avgScore = leads.length
    ? Math.round(leads.reduce((s, l) => s + (l.lead_score ?? 0), 0) / leads.length) : 0

  async function updateStatus(id: string, status: string) {
    setSaving(true)
    const update: any = { status }
    const existing = leads.find(l => l.id === id)
    if (status === 'contacted' && !existing?.first_contacted_at) {
      const now = new Date()
      update.first_contacted_at = now.toISOString()
      update.response_time_mins = Math.round(
        (now.getTime() - new Date(existing.created_at).getTime()) / 60000
      )
    }
    await supabase.from('inquiry_leads').update(update).eq('id', id)
    setSaving(false)
    load()
    if (selected?.id === id) setSelected({ ...selected, ...update })
  }

  async function assignTo(id: string, profileId: string) {
    await supabase.from('inquiry_leads').update({ assigned_to: profileId || null }).eq('id', id)
    load()
  }

  async function saveNote(id: string) {
    if (!noteText.trim()) return
    await supabase.from('inquiry_leads').update({ notes: noteText }).eq('id', id)
    setNoteText('')
    load()
  }

  const timeAgo = (ts: string) => {
    try { return formatDistanceToNow(parseISO(ts), { addSuffix: true }) } catch { return '—' }
  }

  return (
    <>
      <Head><title>Enquiries — Coraléa CRM</title></Head>

      <div className="page-header-row">
        <div>
          <div className="page-eyebrow">Lead Generation</div>
          <div className="page-title">Website <em>Enquiries</em></div>
          <div className="page-subtitle">{leads.length} total · {newToday} today</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="card card-elevated">
          <div className="card-label">Total Enquiries</div>
          <div className="card-value" style={{ color: 'var(--gold)' }}>{leads.length}</div>
          <div className="card-sub">{newToday} received today</div>
        </div>
        <div className="card card-elevated" style={{ borderColor: 'rgba(248,113,113,0.25)' }}>
          <div className="card-label">Hot Leads</div>
          <div className="card-value" style={{ color: 'var(--status-cancel)' }}>{hot}</div>
          <div className="card-sub">Score 85–100 · Respond now</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Warm Leads</div>
          <div className="card-value" style={{ color: '#fbbf24' }}>{warm}</div>
          <div className="card-sub">Score 65–84 · Within 2 hrs</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Avg Lead Score</div>
          <div className="card-value" style={{ color: 'var(--status-in)' }}>{avgScore}</div>
          <div className="card-sub">/ 100 qualification score</div>
        </div>
      </div>

      {/* Hot alert banner */}
      {hot > 0 && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertCircle size={15} color="var(--status-cancel)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--status-cancel)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {hot} hot lead{hot > 1 ? 's' : ''} awaiting response — target 5 minutes
          </span>
        </div>
      )}

      {selected && <div className='split-panel-backdrop' onClick={() => setSelected(null)} />}
      <div className='split-panel' style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>

        {/* Table */}
        <div className="card card-elevated">
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <input className="input" placeholder="Search name or email…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 220, minHeight: 36, fontSize: 13 }} />
            <select className="select" style={{ width: 120, minHeight: 36, fontSize: 12 }}
              value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
              <option value="all">All Tiers</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="unqualified">Unqualified</option>
            </select>
            <select className="select" style={{ width: 150, minHeight: 36, fontSize: 12 }}
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace(/_/g,' ')}</option>)}
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lead</th><th>Score</th><th>Tier</th><th>Event</th>
                  <th className="hide-mobile">Budget</th><th>Status</th><th className="hide-mobile">Assigned</th><th className="hide-mobile">Received</th>
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={8}><div className="skeleton" style={{ height: 42 }} /></td></tr>
                ))}
                {!loading && filtered.map(lead => {
                  const tier = TIERS[lead.lead_tier] ?? TIERS.cold
                  const isHot = lead.lead_tier === 'hot'
                  return (
                    <tr key={lead.id}
                      style={{ cursor: 'pointer', background: selected?.id === lead.id ? 'var(--gold-glow)' : isHot ? 'rgba(248,113,113,0.03)' : 'transparent' }}
                      onClick={() => { setSelected(selected?.id === lead.id ? null : lead); setNoteText(lead.notes || '') }}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.email}</div>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-editorial)', fontSize: 22, fontStyle: 'italic',
                          color: lead.lead_score >= 85 ? 'var(--status-cancel)'
                            : lead.lead_score >= 65 ? '#fbbf24' : 'var(--text-muted)',
                        }}>
                          {lead.lead_score ?? 0}
                        </span>
                      </td>
                      <td><span className={`badge ${tier.cls}`}>{tier.label}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {(lead.event_type ?? '—').replace(/_/g, ' ')}
                      </td>
                      <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--gold)' }}>
                        {lead.budget_range ? lead.budget_range.replace(/_/g, ' ') : '—'}
                      </td>
                      <td><span className={`badge badge-${lead.status === 'new' ? 'enquiry' : lead.status === 'booking_confirmed' ? 'completed' : lead.status === 'lost' ? 'cancelled' : 'planning'}`}>
                        {(lead.status ?? 'new').replace(/_/g, ' ')}
                      </span></td>
                      <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {lead.assignee?.full_name ?? 'Unassigned'}
                      </td>
                      <td className='hide-mobile' style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {timeAgo(lead.created_at)}
                      </td>
                    </tr>
                  )
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    No enquiries match the current filters
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card card-elevated detail-panel" style={{
            borderColor: selected.lead_tier === 'hot' ? 'rgba(248,113,113,0.35)'
              : selected.lead_tier === 'warm' ? 'rgba(251,191,36,0.25)' : 'var(--border-subtle)',
            position: 'sticky', top: 16,
          }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{selected.first_name} {selected.last_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Score {selected.lead_score ?? 0} · {(TIERS[selected.lead_tier] ?? TIERS.cold).label}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Hot alert */}
            {selected.lead_tier === 'hot' && (
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--status-cancel)', marginBottom: 3 }}>
                  🔴 HOT LEAD — RESPOND WITHIN 5 MINUTES
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  First to respond wins 78% of the time.
                </div>
              </div>
            )}

            {/* Contact actions */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              <a href={`mailto:${selected.email}?subject=Your Coraléa ${(selected.event_type || 'enquiry').replace(/_/g,' ')} enquiry`}
                className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Mail size={12} /> Email
              </a>
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  <Phone size={12} /> Call
                </a>
              )}
              {selected.whatsapp_opted && selected.phone && (
                <a href={`https://wa.me/${selected.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                  className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'rgba(37,211,102,0.12)', color: '#25d366', border: '1px solid rgba(37,211,102,0.25)' }}>
                  <MessageCircle size={12} /> WA
                </a>
              )}
            </div>

            {/* Detail grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginBottom: 16 }}>
              {[
                ['Email',      selected.email],
                ['Phone',      selected.phone || '—'],
                ['Event',      (selected.event_type || '—').replace(/_/g,' ')],
                ['Country',    selected.country || '—'],
                ['Date',       selected.event_date ? format(parseISO(selected.event_date), 'dd MMM yyyy') : '—'],
                ['Guests',     selected.guest_count ?? '—'],
                ['Budget',     selected.budget_range?.replace(/_/g,' ') ?? '—'],
                ['Timeline',   selected.timeline?.replace(/_/g,' ') ?? '—'],
                ['Duration',   selected.event_duration?.replace(/_/g,' ') ?? '—'],
                ['Catering',   selected.catering_style?.replace(/_/g,' ') ?? '—'],
                ['WA Opted',   selected.whatsapp_opted ? 'Yes' : 'No'],
                ['Source',     selected.source || selected.how_found_us || '—'],
                ['UTM Source', selected.utm_source || '—'],
                ['Campaign',   selected.utm_campaign || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', textTransform: 'capitalize', wordBreak: 'break-all' }}>{String(v)}</div>
                </div>
              ))}
            </div>

            {/* Response time */}
            {selected.response_time_mins && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginBottom: 14,
                color: selected.response_time_mins <= 15 ? 'var(--status-in)'
                  : selected.response_time_mins <= 120 ? '#fbbf24' : 'var(--status-cancel)' }}>
                <Clock size={12} />
                Response time: {selected.response_time_mins < 60
                  ? `${selected.response_time_mins}m`
                  : `${Math.floor(selected.response_time_mins/60)}h ${selected.response_time_mins%60}m`}
              </div>
            )}

            {/* Status */}
            <div className="form-group">
              <label>Status</label>
              <select className="select" value={selected.status ?? 'new'}
                onChange={e => updateStatus(selected.id, e.target.value)}>
                {STATUSES.filter(s => s !== 'all').map(s =>
                  <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                )}
              </select>
            </div>

            {/* Assign */}
            <div className="form-group">
              <label>Assigned To</label>
              <select className="select" value={selected.assigned_to ?? ''}
                onChange={e => assignTo(selected.id, e.target.value)}>
                <option value="">Unassigned</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>Internal Notes</label>
              <textarea className="input" rows={3} style={{ resize: 'vertical' }}
                placeholder="Add notes…" value={noteText}
                onChange={e => setNoteText(e.target.value)} />
              <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 6 }}
                onClick={() => saveNote(selected.id)}>Save Note</button>
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
              Received {format(parseISO(selected.created_at), 'dd MMM yyyy HH:mm')}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
