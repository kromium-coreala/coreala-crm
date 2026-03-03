import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO, differenceInDays } from 'date-fns'
import {
  ArrowLeft, CheckCircle2, Circle, Clock, Plus, Save, Trash2,
  PartyPopper, Users, DollarSign, Calendar, Phone, Mail,
  ChevronDown, ChevronUp, Edit, X, Package
} from 'lucide-react'
import toast from 'react-hot-toast'

const TASK_CATEGORIES = ['venue','catering','florals','entertainment','logistics','accommodation','communications','other']
const CATEGORY_COLORS: Record<string, string> = {
  venue: '#c4a882', catering: '#6abf8e', florals: '#e07070',
  entertainment: '#7aafdf', logistics: '#e0b05a', accommodation: '#9c7abf',
  communications: '#8abfbf', other: 'var(--text-dim)'
}

const DEFAULT_TASKS: { title: string; category: string; sort_order: number }[] = [
  { title: 'Confirm event date and venue areas', category: 'venue', sort_order: 1 },
  { title: 'Sign contract and collect deposit', category: 'logistics', sort_order: 2 },
  { title: 'Send accommodation booking links to guests', category: 'accommodation', sort_order: 3 },
  { title: 'Finalise catering menu and dietary requirements', category: 'catering', sort_order: 4 },
  { title: 'Arrange floral design consultation', category: 'florals', sort_order: 5 },
  { title: 'Confirm entertainment / music brief', category: 'entertainment', sort_order: 6 },
  { title: 'Coordinate transport for guests', category: 'logistics', sort_order: 7 },
  { title: 'Send final event schedule to all vendors', category: 'communications', sort_order: 8 },
  { title: 'Day-of walkthrough with event manager', category: 'venue', sort_order: 9 },
  { title: 'Post-event feedback and invoice settlement', category: 'logistics', sort_order: 10 },
]

export default function EventDetail() {
  const router = useRouter()
  const { id } = router.query
  const [event, setEvent] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'vendors' | 'edit'>('overview')
  const [saving, setSaving] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', category: 'general', due_date: '', assigned_to: '' })
  const [showNewTask, setShowNewTask] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const [evRes, taskRes, orderRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('event_tasks').select('*').eq('event_id', id).order('sort_order'),
      supabase.from('vendor_orders').select('*, vendors(name, category)').eq('event_id', id).order('created_at', { ascending: false }),
    ])
    setEvent(evRes.data)
    setEditForm(evRes.data)
    setTasks(taskRes.data || [])
    setOrders(orderRes.data || [])
    setLoading(false)
  }

  async function addDefaultTasks() {
    const inserts = DEFAULT_TASKS.map(t => ({ ...t, event_id: id }))
    const { error } = await supabase.from('event_tasks').insert(inserts)
    if (error) toast.error(error.message)
    else { toast.success('Checklist created'); load() }
  }

  async function toggleTask(task: any) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const { error } = await supabase.from('event_tasks').update({ status: newStatus }).eq('id', task.id)
    if (error) toast.error(error.message)
    else setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.title) return
    const { error } = await supabase.from('event_tasks').insert({
      ...newTask, event_id: id, sort_order: tasks.length + 1
    })
    if (error) toast.error(error.message)
    else { toast.success('Task added'); setNewTask({ title: '', category: 'general', due_date: '', assigned_to: '' }); setShowNewTask(false); load() }
  }

  async function deleteTask(taskId: string) {
    const { error } = await supabase.from('event_tasks').delete().eq('id', taskId)
    if (error) toast.error(error.message)
    else setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('events').update({
      name: editForm.name, event_type: editForm.event_type, date: editForm.date,
      guest_count: Number(editForm.guest_count), status: editForm.status,
      budget: editForm.budget ? Number(editForm.budget) : null, currency: editForm.currency,
      contact_name: editForm.contact_name, contact_email: editForm.contact_email,
      contact_phone: editForm.contact_phone, notes: editForm.notes,
      total_revenue: editForm.total_revenue ? Number(editForm.total_revenue) : null,
    }).eq('id', id)
    setSaving(false)
    if (error) toast.error(error.message)
    else { toast.success('Event updated'); load(); setActiveTab('overview') }
  }

  async function deleteEvent() {
    if (!confirm('Permanently delete this event and all its tasks?')) return
    await supabase.from('event_tasks').delete().eq('event_id', id)
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Event deleted'); router.push('/events') }
  }

  if (loading) return <div className="flex items-center justify-center min-h-64"><div className="font-cormorant italic" style={{ color: 'var(--text-dim)' }}>Loading event...</div></div>
  if (!event) return <div className="text-center py-12"><div className="font-cormorant italic text-xl" style={{ color: 'var(--text-dim)' }}>Event not found</div><Link href="/events" className="btn-primary mt-4 inline-flex">Back to Events</Link></div>

  const completed = tasks.filter(t => t.status === 'completed').length
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
  const daysUntil = differenceInDays(parseISO(event.date), new Date())

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'checklist', label: `Checklist ${tasks.length > 0 ? `(${completed}/${tasks.length})` : ''}` },
    { id: 'vendors', label: `Vendors (${orders.length})` },
    { id: 'edit', label: 'Edit' },
  ]

  return (
    <>
      <Head><title>{event.name} · Coraléa CRM</title></Head>

      <Link href="/events" className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft size={14} />
        <span className="font-cinzel text-[9px] tracking-widest" style={{ letterSpacing: '0.3em' }}>ALL EVENTS</span>
      </Link>

      {/* Header */}
      <div className="card p-5 mb-4 animate-fade-up">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <StatusBadge status={event.status} />
              <span className="font-cinzel text-[8px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
                {event.event_type?.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <h1 className="font-cormorant text-2xl font-light" style={{ color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {event.name}
            </h1>
          </div>
          <PartyPopper size={18} style={{ color: 'var(--sand)', flexShrink: 0, marginLeft: 12 }} />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-center">
            <div className="font-cormorant italic text-xl" style={{ color: daysUntil < 0 ? 'var(--text-dim)' : daysUntil < 14 ? '#e0b05a' : 'var(--sand)' }}>
              {daysUntil < 0 ? 'Past' : daysUntil === 0 ? 'Today' : `${daysUntil}d`}
            </div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Until Event</div>
          </div>
          <div className="text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>{event.guest_count}</div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Guests</div>
          </div>
          <div className="text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>
              {event.budget ? formatCurrency(event.budget, event.currency) : '—'}
            </div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Budget</div>
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="font-cinzel text-[8px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>COORDINATION PROGRESS</span>
              <span className="font-cinzel text-[8px]" style={{ color: 'var(--sand)', letterSpacing: '0.2em' }}>{progress}%</span>
            </div>
            <div className="w-full h-1" style={{ background: 'var(--surface-3)' }}>
              <div className="h-1 transition-all duration-700" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--gold-dim), var(--sand))' }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-4 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="flex-shrink-0 px-4 py-2.5 font-cinzel text-[8px] transition-all"
            style={{
              letterSpacing: '0.2em', border: 'none', background: 'transparent',
              color: activeTab === tab.id ? 'var(--sand)' : 'var(--text-dim)',
              borderBottom: activeTab === tab.id ? '1px solid var(--sand)' : '1px solid transparent',
              marginBottom: '-1px',
            }}>
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          {/* Event details */}
          <div className="card mb-4">
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="eyebrow" style={{ fontSize: '8px' }}>Event Details</span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Date', value: format(parseISO(event.date), 'EEEE, MMMM d, yyyy') },
                { label: 'Type', value: event.event_type?.replace(/_/g, ' ') },
                { label: 'Guest Count', value: `${event.guest_count} guests (max 60)` },
                { label: 'Status', value: event.status },
                { label: 'Budget', value: event.budget ? formatCurrency(event.budget, event.currency) : 'Not set' },
                { label: 'Revenue', value: event.total_revenue ? formatCurrency(event.total_revenue) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4">
                  <span className="font-cinzel text-[8px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em', minWidth: 100 }}>{label}</span>
                  <span className="font-raleway text-xs text-right" style={{ color: 'var(--text-muted)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="card mb-4">
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="eyebrow" style={{ fontSize: '8px' }}>Primary Contact</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="font-cormorant text-lg" style={{ color: 'var(--text-primary)' }}>{event.contact_name}</div>
              {event.contact_email && (
                <a href={`mailto:${event.contact_email}`} className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={13} style={{ color: 'var(--sand)', flexShrink: 0 }} />
                  <span className="font-raleway text-xs">{event.contact_email}</span>
                </a>
              )}
              {event.contact_phone && (
                <a href={`tel:${event.contact_phone}`} className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                  <Phone size={13} style={{ color: 'var(--sand)', flexShrink: 0 }} />
                  <span className="font-raleway text-xs">{event.contact_phone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Notes */}
          {event.notes && (
            <div className="card mb-4">
              <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="eyebrow" style={{ fontSize: '8px' }}>Event Notes</span>
              </div>
              <div className="p-4">
                <p className="font-raleway text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{event.notes}</p>
              </div>
            </div>
          )}

          {/* Quick checklist preview */}
          {tasks.length > 0 && (
            <div className="card mb-4">
              <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="eyebrow" style={{ fontSize: '8px' }}>Next Tasks</span>
                <button onClick={() => setActiveTab('checklist')} className="font-cinzel text-[8px]" style={{ color: 'var(--sand)', letterSpacing: '0.2em' }}>VIEW ALL</button>
              </div>
              {tasks.filter(t => t.status === 'pending').slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid rgba(196,168,130,0.05)' }}>
                  <Circle size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                  <span className="font-raleway text-xs flex-1" style={{ color: 'var(--text-muted)' }}>{task.title}</span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[task.category] || 'var(--text-dim)' }} />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mb-8">
            <button onClick={() => setActiveTab('checklist')} className="btn-primary flex-1 justify-center">
              <CheckCircle2 size={14} /> Coordination
            </button>
            <button onClick={() => setActiveTab('vendors')} className="btn-ghost flex-1 text-center">
              Vendors
            </button>
          </div>
        </div>
      )}

      {/* CHECKLIST TAB */}
      {activeTab === 'checklist' && (
        <div className="animate-fade-in">
          {tasks.length === 0 ? (
            <div className="card p-8 text-center mb-4">
              <CheckCircle2 size={28} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
              <div className="font-cormorant italic text-xl mb-2" style={{ color: 'var(--text-dim)' }}>No tasks yet</div>
              <p className="font-raleway text-xs mb-4" style={{ color: 'var(--text-dim)' }}>Start with our curated event checklist or add custom tasks</p>
              <button onClick={addDefaultTasks} className="btn-primary justify-center w-full mb-2">
                Load Standard Checklist (10 tasks)
              </button>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="card p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="eyebrow" style={{ fontSize: '8px' }}>Progress</span>
                  <span className="font-cormorant italic" style={{ color: 'var(--sand)' }}>{completed}/{tasks.length} complete</span>
                </div>
                <div className="w-full h-1.5" style={{ background: 'var(--surface-3)' }}>
                  <div className="h-1.5 transition-all duration-700" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--gold-dim), var(--sand))' }} />
                </div>
              </div>

              {/* Tasks by category */}
              {TASK_CATEGORIES.map(cat => {
                const catTasks = tasks.filter(t => t.category === cat)
                if (catTasks.length === 0) return null
                return (
                  <div key={cat} className="card mb-3">
                    <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="w-2 h-2 rounded-sm" style={{ background: CATEGORY_COLORS[cat] }} />
                      <span className="font-cinzel text-[8px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.3em' }}>{cat.toUpperCase()}</span>
                    </div>
                    {catTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-4 transition-all group"
                        style={{ borderBottom: '1px solid rgba(196,168,130,0.04)' }}>
                        <button onClick={() => toggleTask(task)} className="mt-0.5 flex-shrink-0">
                          {task.status === 'completed'
                            ? <CheckCircle2 size={16} style={{ color: '#6abf8e' }} />
                            : <Circle size={16} style={{ color: 'var(--text-dim)' }} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="font-raleway text-sm" style={{ color: task.status === 'completed' ? 'var(--text-dim)' : 'var(--text-muted)', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                            {task.title}
                          </div>
                          {(task.due_date || task.assigned_to) && (
                            <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                              {task.due_date && `Due ${format(parseISO(task.due_date), 'MMM d')}`}
                              {task.due_date && task.assigned_to && ' · '}
                              {task.assigned_to && `→ ${task.assigned_to}`}
                            </div>
                          )}
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <X size={12} style={{ color: 'var(--text-dim)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
              {/* Uncategorized */}
              {tasks.filter(t => !TASK_CATEGORIES.includes(t.category)).map(task => (
                <div key={task.id} className="card mb-2">
                  <div className="flex items-start gap-3 p-4 group">
                    <button onClick={() => toggleTask(task)} className="mt-0.5 flex-shrink-0">
                      {task.status === 'completed' ? <CheckCircle2 size={16} style={{ color: '#6abf8e' }} /> : <Circle size={16} style={{ color: 'var(--text-dim)' }} />}
                    </button>
                    <span className="flex-1 font-raleway text-sm" style={{ color: 'var(--text-muted)' }}>{task.title}</span>
                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <X size={12} style={{ color: 'var(--text-dim)' }} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Add task */}
          {showNewTask ? (
            <form onSubmit={addTask} className="card mb-4 p-4 space-y-3">
              <input className="input-box" placeholder="Task title *" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <select className="input-box" value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}>
                  {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" className="input-box" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <input className="input-box" placeholder="Assigned to..." value={newTask.assigned_to} onChange={e => setNewTask(p => ({ ...p, assigned_to: e.target.value }))} />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 justify-center"><Save size={13} /> Add Task</button>
                <button type="button" onClick={() => setShowNewTask(false)} className="btn-ghost">Cancel</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowNewTask(true)} className="btn-ghost w-full justify-center mb-8 flex items-center gap-2">
              <Plus size={14} /> Add Task
            </button>
          )}
        </div>
      )}

      {/* VENDORS TAB */}
      {activeTab === 'vendors' && (
        <div className="animate-fade-in">
          {orders.length === 0 ? (
            <div className="card p-8 text-center mb-4">
              <Package size={28} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
              <div className="font-cormorant italic text-xl mb-2" style={{ color: 'var(--text-dim)' }}>No vendor orders</div>
              <p className="font-raleway text-xs mb-4" style={{ color: 'var(--text-dim)' }}>Link vendor orders and track imports from the Vendors module</p>
              <Link href="/vendors" className="btn-primary justify-center w-full">Go to Vendors</Link>
            </div>
          ) : (
            <div className="card mb-4">
              {orders.map((order, i) => (
                <div key={order.id} className="p-4" style={{ borderBottom: i < orders.length - 1 ? '1px solid rgba(196,168,130,0.05)' : 'none' }}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{order.description}</div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>{order.vendors?.name}</span>
                    {order.amount && <span className="font-cormorant italic text-sm" style={{ color: 'var(--sand)' }}>{formatCurrency(order.amount, order.currency)}</span>}
                  </div>
                  {order.expected_arrival && (
                    <div className="font-raleway text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                      Expected: {format(parseISO(order.expected_arrival), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link href="/vendors" className="btn-ghost w-full text-center block mb-8">Manage All Vendors</Link>
        </div>
      )}

      {/* EDIT TAB */}
      {activeTab === 'edit' && editForm && (
        <form onSubmit={saveEdit} className="animate-fade-in">
          <div className="card mb-4">
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="eyebrow" style={{ fontSize: '8px' }}>Event Details</span>
            </div>
            <div className="p-4 space-y-4">
              {[
                { label: 'Event Name *', key: 'name', type: 'text' },
                { label: 'Date *', key: 'date', type: 'date' },
              ].map(({ label, key, type }) => (
                <div key={key}><label className="label-luxury">{label}</label>
                  <input type={type} className="input-box" value={editForm[key] || ''} onChange={e => setEditForm((p: any) => ({ ...p, [key]: e.target.value }))} required={label.includes('*')} /></div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-luxury">Type</label>
                  <select className="input-box" value={editForm.event_type} onChange={e => setEditForm((p: any) => ({ ...p, event_type: e.target.value }))}>
                    {['wedding','corporate','birthday','anniversary','private_dinner','other'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                  </select></div>
                <div><label className="label-luxury">Status</label>
                  <select className="input-box" value={editForm.status} onChange={e => setEditForm((p: any) => ({ ...p, status: e.target.value }))}>
                    {['enquiry','planning','confirmed','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-luxury">Guest Count</label>
                  <input type="number" min="1" max="60" className="input-box" value={editForm.guest_count || ''} onChange={e => setEditForm((p: any) => ({ ...p, guest_count: e.target.value }))} /></div>
                <div><label className="label-luxury">Currency</label>
                  <select className="input-box" value={editForm.currency} onChange={e => setEditForm((p: any) => ({ ...p, currency: e.target.value }))}>
                    {['USD','BBD','GBP','EUR','CAD','KYD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-luxury">Budget</label>
                  <input type="number" className="input-box" value={editForm.budget || ''} onChange={e => setEditForm((p: any) => ({ ...p, budget: e.target.value }))} /></div>
                <div><label className="label-luxury">Actual Revenue</label>
                  <input type="number" className="input-box" value={editForm.total_revenue || ''} onChange={e => setEditForm((p: any) => ({ ...p, total_revenue: e.target.value }))} /></div>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="eyebrow" style={{ fontSize: '8px' }}>Contact Details</span>
            </div>
            <div className="p-4 space-y-4">
              {[
                { label: 'Contact Name *', key: 'contact_name', type: 'text' },
                { label: 'Contact Email *', key: 'contact_email', type: 'email' },
                { label: 'Contact Phone', key: 'contact_phone', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}><label className="label-luxury">{label}</label>
                  <input type={type} className="input-box" value={editForm[key] || ''} onChange={e => setEditForm((p: any) => ({ ...p, [key]: e.target.value }))} /></div>
              ))}
              <div><label className="label-luxury">Notes</label>
                <textarea className="input-box" rows={4} value={editForm.notes || ''} onChange={e => setEditForm((p: any) => ({ ...p, notes: e.target.value }))} /></div>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="card mb-8" style={{ border: '1px solid rgba(156,58,58,0.2)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid rgba(156,58,58,0.15)' }}>
              <span className="eyebrow" style={{ fontSize: '8px', color: '#e07070' }}>Danger Zone</span>
            </div>
            <div className="p-4">
              <button type="button" onClick={deleteEvent} className="btn-danger flex items-center gap-2">
                <Trash2 size={13} /> Delete Event
              </button>
            </div>
          </div>
        </form>
      )}
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { confirmed: 'badge-success', planning: 'badge-info', completed: 'badge-sand', cancelled: 'badge-danger', enquiry: 'badge-warning' }
  return <span className={`badge ${map[status] || 'badge-sand'}`}>{status}</span>
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { ordered: 'badge-info', in_transit: 'badge-warning', customs: 'badge-danger', arrived: 'badge-success', delivered: 'badge-sand', cancelled: 'badge-danger' }
  return <span className={`badge ${map[status] || 'badge-sand'}`}>{status?.replace(/_/g, ' ')}</span>
}
