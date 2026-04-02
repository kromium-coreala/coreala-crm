import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, addDays } from 'date-fns'
import { Mail, MessageCircle, Phone, Check, Clock } from 'lucide-react'

type Tier = 'hot' | 'warm' | 'cold'

// Document-specified nurture sequences
const HOT_SEQUENCE = [
  { day: 0,   channel: 'sms',      action: 'Personal greeting SMS from manager' },
  { day: 0,   channel: 'email',    action: 'Custom proposal with exact dates, pricing, mood board' },
  { day: 0,   channel: 'whatsapp', action: '"Did you receive our proposal?" WhatsApp check-in' },
  { day: 0.08,channel: 'phone',    action: 'Phone call attempt #1' },
  { day: 0.25,channel: 'email',    action: '"3 Reasons Why Your Date Is Perfect At Coraléa"' },
  { day: 1,   channel: 'sms',      action: '"When\'s a good time to chat about your event?"' },
  { day: 1,   channel: 'email',    action: 'Video message from venue manager (Loom)' },
  { day: 2,   channel: 'whatsapp', action: 'Sunset tour invite — "Magical! Available Thu/Fri"' },
  { day: 2,   channel: 'email',    action: 'Testimonial from similar event type' },
  { day: 3,   channel: 'phone',    action: 'Phone call attempt #2' },
  { day: 3,   channel: 'email',    action: '"Holding your date until [deadline] — shall we finalise?"' },
  { day: 5,   channel: 'sms',      action: 'Limited-time incentive — "Book this week: complimentary upgrade"' },
  { day: 7,   channel: 'phone',    action: 'Phone call attempt #3 (final)' },
  { day: 7,   channel: 'email',    action: '"Should we release your date?" — urgency close' },
]

const WARM_SEQUENCE = [
  { day: 0,  channel: 'email',    action: 'Welcome email + venue guide PDF download' },
  { day: 2,  channel: 'sms',      action: '"What questions can I answer about your event at Coraléa?"' },
  { day: 4,  channel: 'email',    action: '"5 Things to Consider When Choosing a Venue"' },
  { day: 6,  channel: 'whatsapp', action: 'Virtual tour video link' },
  { day: 8,  channel: 'email',    action: 'Real wedding/event feature — blog post' },
  { day: 10, channel: 'sms',      action: '"Any progress on your event planning?"' },
  { day: 12, channel: 'email',    action: 'Seasonal availability update + pricing' },
  { day: 15, channel: 'email',    action: '"Our most-asked questions about Coraléa"' },
  { day: 18, channel: 'sms',      action: '"Still with me? Reply STOP to pause outreach"' },
  { day: 21, channel: 'email',    action: '"One last thing…" + special offer OR move to quarterly' },
]

const COLD_SEQUENCE = [
  { day: 7,   channel: 'email', action: 'Welcome + comprehensive venue guide' },
  { day: 21,  channel: 'email', action: 'Inspiration board for their event type' },
  { day: 60,  channel: 'email', action: 'Case study: recent event timeline + budget breakdown' },
  { day: 90,  channel: 'email', action: 'Seasonal promotion announcement' },
  { day: 180, channel: 'email', action: '"Just checking in" personal email' },
  { day: 365, channel: 'email', action: '"We\'d still love to host you!" re-engagement' },
]

const SEQ: Record<Tier, typeof HOT_SEQUENCE> = {
  hot:  HOT_SEQUENCE,
  warm: WARM_SEQUENCE,
  cold: COLD_SEQUENCE,
}

const CHANNEL_ICON = {
  email:    Mail,
  sms:      MessageCircle,
  whatsapp: MessageCircle,
  phone:    Phone,
}
const CHANNEL_COLOR: Record<string, string> = {
  email:    'var(--status-conf)',
  sms:      '#a78bfa',
  whatsapp: '#25d366',
  phone:    'var(--gold)',
}

function getTouchpointStatus(lead: any, step: typeof HOT_SEQUENCE[0]) {
  const daysSince = differenceInDays(new Date(), parseISO(lead.created_at))
  if (daysSince >= step.day) return 'due'
  return 'upcoming'
}

export default function Nurture() {
  const [leads, setLeads]       = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [tierFilter, setTierFilter] = useState<'all' | Tier>('all')
  const [loading, setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('inquiry_leads')
      .select('*')
      .in('status', ['new','contacted','nurturing'])
      .in('lead_tier', ['hot','warm','cold'])
      .order('lead_score', { ascending: false })
      .limit(200)
    setLeads(data ?? [])
    setLoading(false)
  }

  async function markStatus(id: string, status: string) {
    await supabase.from('inquiry_leads').update({ status }).eq('id', id)
    load()
    if (selected?.id === id) setSelected((s: any) => ({ ...s, status }))
  }

  const filtered = tierFilter === 'all' ? leads : leads.filter(l => l.lead_tier === tierFilter)

  // Stats
  const hot   = leads.filter(l => l.lead_tier === 'hot').length
  const warm  = leads.filter(l => l.lead_tier === 'warm').length
  const cold  = leads.filter(l => l.lead_tier === 'cold').length
  const overdueHot = leads.filter(l => {
    if (l.lead_tier !== 'hot') return false
    return !l.first_contacted_at && differenceInDays(new Date(), parseISO(l.created_at)) > 0
  }).length

  return (
    <>
      <Head><title>Nurture — Coraléa CRM</title></Head>

      <div className="page-header">
        <div className="page-eyebrow">Lead Generation</div>
        <div className="page-title">Nurture <em>Sequences</em></div>
        <div className="page-subtitle">{leads.length} leads in active sequences</div>
      </div>

      {overdueHot > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Clock size={14} color="var(--status-cancel)" />
          <span style={{ fontSize: 12, color: 'var(--status-cancel)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {overdueHot} hot lead{overdueHot > 1 ? 's' : ''} overdue for first contact
          </span>
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="card card-elevated" style={{ borderColor: 'rgba(248,113,113,0.2)' }}>
          <div className="card-label">Hot Sequence</div>
          <div className="card-value" style={{ color: 'var(--status-cancel)' }}>{hot}</div>
          <div className="card-sub">7-day intensive · 14 touchpoints</div>
        </div>
        <div className="card card-elevated" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
          <div className="card-label">Warm Sequence</div>
          <div className="card-value" style={{ color: '#fbbf24' }}>{warm}</div>
          <div className="card-sub">21-day nurture · 10 touchpoints</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Cold Sequence</div>
          <div className="card-value" style={{ color: 'var(--text-muted)' }}>{cold}</div>
          <div className="card-sub">Long-term · quarterly check-ins</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Total In Sequences</div>
          <div className="card-value" style={{ color: 'var(--gold)' }}>{leads.length}</div>
          <div className="card-sub">Across all tiers</div>
        </div>
      </div>

      {selected && <div className='split-panel-backdrop' onClick={() => setSelected(null)} />}
      <div className='split-panel' style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 16, alignItems: 'start' }}>

        {/* Lead list */}
        <div>
          {/* Tier filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {(['all','hot','warm','cold'] as const).map(t => (
              <button key={t} className={`btn btn-sm ${tierFilter === t ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTierFilter(t)} style={{ textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          <div className="card card-elevated">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Lead</th><th>Tier</th><th className="hide-mobile">Score</th><th className="hide-mobile">Day</th><th>Next Action</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {loading && Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: 40 }} /></td></tr>
                  ))}
                  {!loading && filtered.map(lead => {
                    const tier   = lead.lead_tier as Tier
                    const seq    = SEQ[tier] ?? []
                    const dayIn  = differenceInDays(new Date(), parseISO(lead.created_at))
                    const next   = seq.find(s => s.day > dayIn) ?? seq[seq.length - 1]
                    const tierColor = tier === 'hot' ? 'var(--status-cancel)' : tier === 'warm' ? '#fbbf24' : 'var(--text-muted)'
                    const Icon = next ? CHANNEL_ICON[next.channel as keyof typeof CHANNEL_ICON] : Mail

                    return (
                      <tr key={lead.id}
                        style={{ cursor: 'pointer', background: selected?.id === lead.id ? 'var(--gold-glow)' : undefined }}
                        onClick={() => setSelected(selected?.id === lead.id ? null : lead)}>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{lead.first_name} {lead.last_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.email}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: tierColor }}>
                            {tier}
                          </span>
                        </td>
                        <td style={{ className='hide-mobile' style={{ fontFamily: 'var(--font-editorial)', fontSize: 20, color: tierColor, fontStyle: 'italic' }}>
                          {lead.lead_score ?? 0}
                        </td>
                        <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-muted)' }}>Day {dayIn}</td>
                        <td>
                          {next && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Icon size={12} color={CHANNEL_COLOR[next.channel]} />
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {next.action}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${lead.status === 'contacted' ? 'badge-completed' : lead.status === 'nurturing' ? 'badge-planning' : 'badge-enquiry'}`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                      No leads in this sequence tier
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sequence detail panel */}
        {selected && (() => {
          const tier  = selected.lead_tier as Tier
          const seq   = SEQ[tier] ?? []
          const dayIn = differenceInDays(new Date(), parseISO(selected.created_at))

          return (
            <div className='card card-elevated detail-panel' style={{ position: 'sticky', top: 16 }}>
              <div className="flex-between" style={{ marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{selected.first_name} {selected.last_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Day {dayIn} of {tier} sequence
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>

              {/* Quick actions */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                <a href={`mailto:${selected.email}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                  <Mail size={12} /> Email
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    <Phone size={12} /> Call
                  </a>
                )}
                {selected.whatsapp_opted && selected.phone && (
                  <a href={`https://wa.me/${selected.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                    className="btn btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.25)' }}>
                    <MessageCircle size={12} /> WA
                  </a>
                )}
              </div>

              {/* Move out of sequence */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                  onClick={() => markStatus(selected.id, 'tour_scheduled')}>
                  → Tour Booked
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                  onClick={() => markStatus(selected.id, 'lost')}>
                  Mark Lost
                </button>
              </div>

              {/* Sequence steps */}
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                {tier.toUpperCase()} SEQUENCE — {seq.length} TOUCHPOINTS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {seq.map((step, i) => {
                  const isDue = dayIn >= step.day
                  const isNext = !isDue && (i === 0 || dayIn >= seq[i-1].day)
                  const nextDate = addDays(parseISO(selected.created_at), step.day)
                  const Icon = CHANNEL_ICON[step.channel as keyof typeof CHANNEL_ICON] ?? Mail

                  return (
                    <div key={i} style={{
                      display: 'flex', gap: 10, padding: '9px 0',
                      borderBottom: i < seq.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      opacity: isDue ? 1 : 0.55,
                    }}>
                      {/* Timeline dot */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: isDue ? 'var(--status-in-bg)' : isNext ? 'var(--gold-glow)' : 'var(--bg-overlay)',
                          border: `1px solid ${isDue ? 'var(--status-in)' : isNext ? 'var(--gold)' : 'var(--border-subtle)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isDue
                            ? <Check size={10} color="var(--status-in)" />
                            : <Icon size={9} color={isNext ? 'var(--gold)' : 'var(--text-muted)'} />
                          }
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1 }}>
                            {step.action}
                          </span>
                          <span style={{ fontSize: 9, color: isNext ? 'var(--gold)' : 'var(--text-muted)', flexShrink: 0, fontWeight: isNext ? 600 : 400 }}>
                            {isDue ? '✓ Due' : isNext ? 'NEXT' : format(nextDate, 'dd MMM')}
                          </span>
                        </div>
                        <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: CHANNEL_COLOR[step.channel], marginTop: 2, display: 'block' }}>
                          {step.channel} · Day {step.day}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </div>
    </>
  )
}
