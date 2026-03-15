import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'
import { CheckCircle2, Circle, Clock, AlertCircle, Plus, ChevronDown, ChevronRight, Plane } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDiscretionMode } from '@/components/layout/Sidebar'

// Default task templates by VIP tier
const TASK_TEMPLATES = {
  base: [
    { title: 'Confirm reservation details with guest', category: 'communications', sort_order: 1 },
    { title: 'Verify arrival method and transfer arrangements', category: 'transport', sort_order: 2 },
    { title: 'Coordinate airport / marina meet-and-greet', category: 'transport', sort_order: 3 },
    { title: 'Confirm room assignment and prepare unit', category: 'room_setup', sort_order: 4 },
    { title: 'Stock minibar and welcome amenities', category: 'amenities', sort_order: 5 },
    { title: 'Place welcome card and fresh flowers', category: 'room_setup', sort_order: 6 },
    { title: 'Confirm dietary requirements with Chef Antoine', category: 'dining', sort_order: 7 },
    { title: 'Pre-arrival call or message to guest (48 hrs out)', category: 'communications', sort_order: 8 },
  ],
  gold: [
    { title: 'Prepare personalised welcome letter from GM', category: 'vip_protocol', sort_order: 9 },
    { title: 'Book any pre-requested experiences', category: 'experiences', sort_order: 10 },
    { title: 'Confirm pillow preference and room temperature', category: 'room_setup', sort_order: 11 },
  ],
  platinum: [
    { title: 'Brief all front-line staff on guest preferences', category: 'vip_protocol', sort_order: 12 },
    { title: 'Arrange private jet / helicopter meet at VIP terminal', category: 'transport', sort_order: 13 },
    { title: 'Pre-stock preferred wine/spirits (chilled to spec)', category: 'amenities', sort_order: 14 },
    { title: 'Set up dedicated butler / concierge assignment', category: 'vip_protocol', sort_order: 15 },
    { title: 'Security briefing if required', category: 'security', sort_order: 16 },
    { title: 'Confirm anniversary / birthday surprise setup if applicable', category: 'vip_protocol', sort_order: 17 },
  ],
}

const CATEGORY_COLORS: Record<string, string> = {
  transport: '#60a5fa', room_setup: '#c9a96e', amenities: '#4ade80',
  dining: '#fb923c', experiences: '#a78bfa', security: '#f87171',
  communications: '#94a3b8', vip_protocol: '#fbbf24', general: '#6b7280',
}

const CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transport', room_setup: 'Room Setup', amenities: 'Amenities',
  dining: 'Dining', experiences: 'Experiences', security: 'Security',
  communications: 'Comms', vip_protocol: 'VIP Protocol', general: 'General',
}

export default function PreArrival() {
  const { discretion } = useDiscretionMode()
  const [reservations, setReservations] = useState<any[]>([])
  const [tasks, setTasks] = useState<Record<string, any[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active')

  useEffect(() => { load() }, [])

  async function load() {
    // Load upcoming + checked-in reservations with guest info
    const { data: resData } = await supabase
      .from('reservations')
      .select('*, guests(first_name, last_name, vip_tier, discretion_level, arrival_preference, dietary_requirements, allergies, preferred_activities, notes)')
      .in('status', ['confirmed', 'checked_in'])
      .order('check_in', { ascending: true })

    const res = resData || []
    setReservations(res)

    // Load all pre-arrival tasks for these reservations
    if (res.length > 0) {
      const ids = res.map(r => r.id)
      const { data: taskData } = await supabase
        .from('pre_arrival_tasks')
        .select('*')
        .in('reservation_id', ids)
        .order('sort_order')

      const taskMap: Record<string, any[]> = {}
      ;(taskData || []).forEach(t => {
        if (!taskMap[t.reservation_id]) taskMap[t.reservation_id] = []
        taskMap[t.reservation_id].push(t)
      })
      setTasks(taskMap)

      // Auto-generate tasks for reservations with none
      for (const r of res) {
        if (!taskMap[r.id] || taskMap[r.id].length === 0) {
          await generateTasks(r)
        }
      }

      // Reload tasks after generation
      const { data: refreshed } = await supabase
        .from('pre_arrival_tasks').select('*').in('reservation_id', ids).order('sort_order')
      const refreshedMap: Record<string, any[]> = {}
      ;(refreshed || []).forEach(t => {
        if (!refreshedMap[t.reservation_id]) refreshedMap[t.reservation_id] = []
        refreshedMap[t.reservation_id].push(t)
      })
      setTasks(refreshedMap)
    }

    setLoading(false)
    // Auto-expand the first reservation
    if (res.length > 0 && !expanded) setExpanded(res[0].id)
  }

  async function generateTasks(res: any) {
    const tier = res.guests?.vip_tier || 'standard'
    let templateTasks = [...TASK_TEMPLATES.base]
    if (['gold', 'platinum'].includes(tier)) templateTasks = [...templateTasks, ...TASK_TEMPLATES.gold]
    if (tier === 'platinum') templateTasks = [...templateTasks, ...TASK_TEMPLATES.platinum]

    const toInsert = templateTasks.map(t => ({
      reservation_id: res.id,
      title: t.title,
      category: t.category,
      sort_order: t.sort_order,
      status: 'pending',
    }))
    await supabase.from('pre_arrival_tasks').insert(toInsert)
  }

  async function toggleTask(taskId: string, resId: string, current: string) {
    const next = current === 'completed' ? 'pending' : current === 'pending' ? 'in_progress' : 'completed'
    await supabase.from('pre_arrival_tasks').update({ status: next }).eq('id', taskId)
    setTasks(prev => ({
      ...prev,
      [resId]: prev[resId].map(t => t.id === taskId ? { ...t, status: next } : t),
    }))
  }

  async function addTask(resId: string, title: string, category: string) {
    const { data } = await supabase.from('pre_arrival_tasks').insert({
      reservation_id: resId, title, category, status: 'pending',
      sort_order: (tasks[resId]?.length || 0) + 1,
    }).select().single()
    if (data) {
      setTasks(prev => ({ ...prev, [resId]: [...(prev[resId] || []), data] }))
      toast.success('Task added')
    }
  }

  const gname = (g: any) => {
    if (!g) return '—'
    if (discretion && g.discretion_level === 'maximum') return '— Confidential —'
    if (discretion && g.discretion_level === 'high') return `${g.first_name?.[0]}. ${g.last_name?.[0]}.`
    return `${g.first_name} ${g.last_name}`
  }

  const getProgress = (resId: string) => {
    const t = tasks[resId] || []
    if (t.length === 0) return { done: 0, total: 0, pct: 0 }
    const done = t.filter(x => x.status === 'completed').length
    return { done, total: t.length, pct: Math.round((done / t.length) * 100) }
  }

  const getUrgency = (checkIn: string) => {
    const days = differenceInDays(parseISO(checkIn), new Date())
    if (days <= 0) return { label: 'Checked In', color: 'var(--status-in)' }
    if (days === 1) return { label: 'Tomorrow', color: 'var(--status-cancel)' }
    if (days <= 3) return { label: `${days} days`, color: '#fb923c' }
    if (days <= 7) return { label: `${days} days`, color: '#fbbf24' }
    return { label: `${days} days`, color: 'var(--text-muted)' }
  }

  const displayRes = filter === 'active'
    ? reservations.filter(r => {
        const prog = getProgress(r.id)
        return prog.pct < 100 || r.status === 'checked_in'
      })
    : reservations

  const totalStats = {
    total: reservations.length,
    ready: reservations.filter(r => getProgress(r.id).pct === 100).length,
    urgent: reservations.filter(r => differenceInDays(parseISO(r.check_in), new Date()) <= 1).length,
    avgCompletion: reservations.length
      ? Math.round(reservations.reduce((s, r) => s + getProgress(r.id).pct, 0) / reservations.length)
      : 0,
  }

  return (
    <>
      <Head><title>Pre-Arrival — Coraléa CRM</title></Head>

      <div className="page-header">
        <div className="page-eyebrow">Operations</div>
        <div className="page-title">Pre-Arrival <em>Workflows</em></div>
        <div className="page-subtitle">Step-by-step preparation checklists for every upcoming arrival</div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="card card-elevated">
          <div className="card-label">Upcoming Arrivals</div>
          <div className="card-value">{totalStats.total}</div>
          <div className="card-sub">Confirmed + checked in</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Fully Prepared</div>
          <div className="card-value" style={{ color: 'var(--status-in)' }}>{totalStats.ready}</div>
          <div className="card-sub">All tasks complete</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Urgent</div>
          <div className="card-value" style={{ color: 'var(--status-cancel)' }}>{totalStats.urgent}</div>
          <div className="card-sub">Arriving within 24 hrs</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Avg. Completion</div>
          <div className="card-value">{totalStats.avgCompletion}%</div>
          <div className="progress-bar" style={{ margin: '8px 0 4px' }}>
            <div className="progress-fill" style={{ width: `${totalStats.avgCompletion}%` }} />
          </div>
          <div className="card-sub">Across all arrivals</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button onClick={() => setFilter('active')} className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-ghost'}`}>Active Only</button>
        <button onClick={() => setFilter('all')} className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}>All Reservations</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : displayRes.length === 0 ? (
        <div className="card card-elevated" style={{ textAlign: 'center', padding: '48px 0' }}>
          <CheckCircle2 size={32} color="var(--status-in)" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 4 }}>All preparations complete</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Every upcoming arrival is fully prepared</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayRes.map(r => {
            const prog = getProgress(r.id)
            const urgency = getUrgency(r.check_in)
            const isOpen = expanded === r.id
            const resTasks = tasks[r.id] || []
            const byCategory = resTasks.reduce((acc: Record<string, any[]>, t) => {
              if (!acc[t.category]) acc[t.category] = []
              acc[t.category].push(t)
              return acc
            }, {})

            return (
              <div key={r.id} className="card card-elevated" style={{
                borderColor: prog.pct === 100 ? 'rgba(74,222,128,0.25)' : urgency.label === 'Tomorrow' ? 'rgba(248,113,113,0.25)' : 'var(--border-subtle)',
              }}>
                {/* Header row — always visible */}
                <div
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                >
                  {/* Progress ring */}
                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                    <svg width="44" height="44" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border-subtle)" strokeWidth="3" />
                      <circle cx="22" cy="22" r="18" fill="none"
                        stroke={prog.pct === 100 ? 'var(--status-in)' : 'var(--gold)'}
                        strokeWidth="3"
                        strokeDasharray={`${(prog.pct / 100) * 113} 113`}
                        strokeLinecap="round"
                        transform="rotate(-90 22 22)"
                        style={{ transition: 'stroke-dasharray 0.4s ease' }}
                      />
                    </svg>
                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: prog.pct === 100 ? 'var(--status-in)' : 'var(--gold)' }}>
                      {prog.pct}%
                    </span>
                  </div>

                  {/* Guest + booking info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{gname(r.guests)}</span>
                      {r.guests?.vip_tier && <span className={`badge badge-${r.guests.vip_tier}`} style={{ fontSize: 9 }}>{r.guests.vip_tier}</span>}
                      <span className={`badge badge-${r.status}`} style={{ fontSize: 9 }}>{r.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--gold)', marginRight: 4 }}>{r.room_number}</span>
                        {r.accommodation_type?.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {format(parseISO(r.check_in), 'dd MMM')} → {format(parseISO(r.check_out), 'dd MMM yyyy')}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {r.arrival_method?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Right side: urgency + progress + toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: urgency.color }}>{urgency.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{prog.done}/{prog.total} tasks</div>
                    </div>
                    {isOpen ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Expanded checklist */}
                {isOpen && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Guest preference callouts */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                      {r.guests?.dietary_requirements && r.guests.dietary_requirements !== 'No restrictions' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: '#fb923c' }}>
                          🍽 {r.guests.dietary_requirements}
                        </div>
                      )}
                      {r.guests?.allergies && r.guests.allergies !== 'None' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: '#f87171' }}>
                          ⚠ Allergy: {r.guests.allergies}
                        </div>
                      )}
                      {r.guests?.arrival_preference && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-muted)' }}>
                          <Plane size={11} /> {r.guests.arrival_preference}
                        </div>
                      )}
                      {r.special_requests && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--gold-glow)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--gold)' }}>
                          ★ {r.special_requests}
                        </div>
                      )}
                    </div>

                    {/* Tasks by category */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      {Object.entries(byCategory).map(([cat, catTasks]) => (
                        <div key={cat}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[cat] || '#6b7280', flexShrink: 0 }} />
                            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                              {CATEGORY_LABELS[cat] || cat}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                              {catTasks.filter(t => t.status === 'completed').length}/{catTasks.length}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {(catTasks as any[]).map((task: any) => (
                              <div
                                key={task.id}
                                onClick={() => toggleTask(task.id, r.id, task.status)}
                                style={{
                                  display: 'flex', alignItems: 'flex-start', gap: 8,
                                  padding: '7px 10px',
                                  background: task.status === 'completed' ? 'rgba(74,222,128,0.05)' : task.status === 'in_progress' ? 'rgba(96,165,250,0.05)' : 'var(--bg-overlay)',
                                  border: `1px solid ${task.status === 'completed' ? 'rgba(74,222,128,0.15)' : task.status === 'in_progress' ? 'rgba(96,165,250,0.15)' : 'var(--border-subtle)'}`,
                                  borderRadius: 'var(--radius-sm)',
                                  cursor: 'pointer',
                                  transition: 'all 120ms',
                                }}
                              >
                                {task.status === 'completed'
                                  ? <CheckCircle2 size={14} color="var(--status-in)" style={{ flexShrink: 0, marginTop: 1 }} />
                                  : task.status === 'in_progress'
                                    ? <Clock size={14} color="var(--status-conf)" style={{ flexShrink: 0, marginTop: 1 }} />
                                    : <Circle size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
                                }
                                <span style={{
                                  fontSize: 12,
                                  color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                  lineHeight: 1.4,
                                }}>
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add custom task */}
                    <AddTaskRow resId={r.id} onAdd={addTask} />

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                      <Link href={`/reservations/${r.id}`} className="btn btn-ghost btn-sm">View Reservation</Link>
                      <Link href={`/guests/${r.guest_id}`} className="btn btn-ghost btn-sm">Guest Profile</Link>
                      {prog.pct === 100 && r.status !== 'checked_in' && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--status-in)' }}>
                          <CheckCircle2 size={14} /> Ready for arrival
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function AddTaskRow({ resId, onAdd }: { resId: string; onAdd: (resId: string, title: string, category: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('general')

  function submit() {
    if (!title.trim()) return
    onAdd(resId, title.trim(), category)
    setTitle('')
    setOpen(false)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 10px', background: 'none', border: '1px dashed var(--border-mid)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', width: '100%', transition: 'all 150ms' }}
    >
      <Plus size={12} /> Add custom task
    </button>
  )

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
      <input className="input" style={{ flex: 1 }} placeholder="Task description…" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
      <select className="select" style={{ width: 140 }} value={category} onChange={e => setCategory(e.target.value)}>
        {Object.entries({ transport: 'Transport', room_setup: 'Room Setup', amenities: 'Amenities', dining: 'Dining', experiences: 'Experiences', vip_protocol: 'VIP Protocol', communications: 'Comms', general: 'General' }).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <button className="btn btn-primary btn-sm" onClick={submit}>Add</button>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  )
}
