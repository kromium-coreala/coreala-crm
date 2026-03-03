import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, Shield, Wind, Users, CheckCircle, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

const PROTOCOLS = [
  'Notify all on-property guests',
  'Activate emergency response team',
  'Secure all outdoor furniture & equipment',
  'Prepare emergency supply kits',
  'Move vehicles to covered parking',
  'Identify and brief shelter locations',
  'Contact all arriving guests re: disruption',
  'Coordinate with airport for flight changes',
  'Fuel and prepare emergency generators',
  'Document all guest contact information',
  'Activate satellite communications backup',
  'Brief all staff on emergency procedures',
]

export default function Hurricane() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeAlerts, setActiveAlerts] = useState<any[]>([])

  const [form, setForm] = useState({
    storm_name: '',
    category: 1,
    status: 'watch',
    eta_hours: '',
    affected_guests: 0,
    protocols_activated: [] as string[],
    notes: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('hurricane_alerts').select('*').order('created_at', { ascending: false })
    setAlerts(data || [])
    setActiveAlerts((data || []).filter(a => ['watch','warning','active'].includes(a.status)))
    setLoading(false)
  }

  function toggleProtocol(p: string) {
    setForm(prev => ({
      ...prev,
      protocols_activated: prev.protocols_activated.includes(p)
        ? prev.protocols_activated.filter(x => x !== p)
        : [...prev.protocols_activated, p]
    }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('hurricane_alerts').insert({
        ...form,
        category: Number(form.category),
        eta_hours: form.eta_hours ? Number(form.eta_hours) : null,
        affected_guests: Number(form.affected_guests),
      })
      if (error) throw error
      toast.success('Alert created')
      setShowNew(false)
      setForm({ storm_name: '', category: 1, status: 'watch', eta_hours: '', affected_guests: 0, protocols_activated: [], notes: '' })
      load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function resolveAlert(id: string) {
    const { error } = await supabase.from('hurricane_alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id)
    if (error) toast.error('Failed')
    else { toast.success('Alert resolved'); load() }
  }

  async function updateProtocols(id: string, protocols: string[]) {
    await supabase.from('hurricane_alerts').update({ protocols_activated: protocols }).eq('id', id)
    load()
  }

  const catColor = (cat: number) => {
    if (cat >= 4) return '#e07070'
    if (cat >= 3) return '#e0b05a'
    if (cat >= 2) return '#e0d050'
    return 'var(--sand)'
  }

  return (
    <>
      <Head><title>Crisis Response · Coraléa CRM</title></Head>

      <div className="mb-5 animate-fade-up">
        <span className="eyebrow">Emergency</span>
        <h1 className="module-title mt-1">
          Crisis <span className="font-cormorant italic" style={{ color: activeAlerts.length > 0 ? '#e07070' : 'var(--sand-light)' }}>Response</span>
        </h1>
      </div>

      {/* Active alerts banner */}
      {activeAlerts.length > 0 && (
        <div className="mb-4 p-4 animate-fade-in" style={{ background: 'rgba(156,58,58,0.12)', border: '1px solid rgba(156,58,58,0.4)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} color="#e07070" />
            <span className="font-cinzel text-[10px] tracking-widest" style={{ color: '#e07070', letterSpacing: '0.3em' }}>
              ACTIVE WEATHER THREAT — {activeAlerts.length} ALERT{activeAlerts.length > 1 ? 'S' : ''}
            </span>
          </div>
          {activeAlerts.map(a => (
            <div key={a.id} className="font-raleway text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {a.storm_name} — Category {a.category} — {a.status.toUpperCase()}
              {a.eta_hours && ` — ETA: ${a.eta_hours}hrs`}
            </div>
          ))}
        </div>
      )}

      {/* Status overview */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="card p-3 text-center">
          <div className="font-cormorant italic text-xl" style={{ color: activeAlerts.length > 0 ? '#e07070' : 'var(--success)' }}>
            {activeAlerts.length > 0 ? activeAlerts.length : '✓'}
          </div>
          <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Active Alerts</div>
        </div>
        <div className="card p-3 text-center">
          <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>
            {alerts.filter(a => a.status === 'resolved').length}
          </div>
          <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Past Events</div>
        </div>
        <div className="card p-3 text-center">
          <div className="font-cormorant italic text-xl" style={{ color: 'var(--sand)' }}>
            {activeAlerts.reduce((s, a) => s + a.affected_guests, 0)}
          </div>
          <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>Guests Affected</div>
        </div>
      </div>

      {/* Protocol checklist */}
      <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Shield size={14} style={{ color: 'var(--sand)' }} />
            <span className="eyebrow" style={{ fontSize: '8px' }}>Emergency Protocols</span>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {PROTOCOLS.map((p, i) => {
            const activated = activeAlerts.length > 0 && activeAlerts[0].protocols_activated?.includes(p)
            return (
              <button key={p} onClick={() => {
                if (activeAlerts.length > 0) {
                  const current = activeAlerts[0].protocols_activated || []
                  const updated = current.includes(p) ? current.filter((x: string) => x !== p) : [...current, p]
                  updateProtocols(activeAlerts[0].id, updated)
                }
              }}
                className="w-full flex items-center gap-3 p-2.5 text-left transition-all"
                style={{
                  background: activated ? 'rgba(74,140,106,0.1)' : 'transparent',
                  border: '1px solid',
                  borderColor: activated ? 'rgba(74,140,106,0.3)' : 'rgba(196,168,130,0.08)',
                  opacity: activeAlerts.length === 0 ? 0.5 : 1,
                }}>
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                  style={{ border: `1px solid ${activated ? '#4a8c6a' : 'var(--border)'}`, background: activated ? 'rgba(74,140,106,0.2)' : 'transparent' }}>
                  {activated && <CheckCircle size={10} color="#6abf8e" />}
                </div>
                <span className="font-raleway text-xs" style={{ color: activated ? '#6abf8e' : 'var(--text-muted)' }}>{p}</span>
                <span className="ml-auto font-cinzel text-[8px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>{String(i + 1).padStart(2, '0')}</span>
              </button>
            )
          })}
          {activeAlerts.length === 0 && (
            <p className="text-center font-cormorant italic text-sm pt-2" style={{ color: 'var(--text-dim)' }}>
              Create an active alert to begin protocol tracking
            </p>
          )}
        </div>
      </div>

      {/* Create new alert */}
      <button onClick={() => setShowNew(true)} className="btn-primary w-full justify-center mb-4">
        <Plus size={14} /> New Weather Alert
      </button>

      {/* New alert form */}
      {showNew && (
        <div className="card mb-4 animate-fade-in">
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>New Alert</span>
            <button onClick={() => setShowNew(false)} style={{ color: 'var(--text-dim)' }}><X size={16} /></button>
          </div>
          <form onSubmit={handleCreate} className="p-4 space-y-4">
            <div>
              <label className="label-luxury">Storm Name</label>
              <input className="input-box" value={form.storm_name} onChange={e => setForm(f => ({ ...f, storm_name: e.target.value }))} required placeholder="e.g. Hurricane Beryl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-luxury">Category</label>
                <select className="input-box" value={form.category} onChange={e => setForm(f => ({ ...f, category: Number(e.target.value) }))}>
                  {[1,2,3,4,5].map(c => <option key={c} value={c}>Category {c}</option>)}
                  <option value={0}>Tropical Storm</option>
                </select>
              </div>
              <div>
                <label className="label-luxury">Status</label>
                <select className="input-box" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="watch">Watch</option>
                  <option value="warning">Warning</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-luxury">ETA (hours)</label>
                <input type="number" className="input-box" value={form.eta_hours} onChange={e => setForm(f => ({ ...f, eta_hours: e.target.value }))} />
              </div>
              <div>
                <label className="label-luxury">Guests Affected</label>
                <input type="number" className="input-box" value={form.affected_guests} onChange={e => setForm(f => ({ ...f, affected_guests: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="label-luxury">Notes</label>
              <textarea className="input-box" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
              <AlertTriangle size={14} /> {saving ? 'Creating...' : 'Activate Alert'}
            </button>
          </form>
        </div>
      )}

      {/* Alert history */}
      <div className="card animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="eyebrow" style={{ fontSize: '8px' }}>Alert History</span>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-16 rounded" />)}</div>
        ) : alerts.length === 0 ? (
          <div className="p-6 text-center font-cormorant italic" style={{ color: 'var(--text-dim)' }}>No alerts recorded</div>
        ) : (
          alerts.map((alert, i) => (
            <div key={alert.id} className="p-4 transition-all"
              style={{ borderBottom: i < alerts.length - 1 ? '1px solid rgba(196,168,130,0.05)' : 'none' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wind size={13} style={{ color: catColor(alert.category) }} />
                    <span className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{alert.storm_name}</span>
                    <span className="badge" style={{ background: `rgba(${catColor(alert.category)}, 0.1)`, color: catColor(alert.category), border: `1px solid ${catColor(alert.category)}40` }}>
                      Cat. {alert.category}
                    </span>
                  </div>
                  <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                    {format(parseISO(alert.created_at), 'MMM d, yyyy HH:mm')} · {alert.affected_guests} guests
                  </div>
                  <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {alert.protocols_activated?.length || 0} protocols activated
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={alert.status} />
                  {alert.status !== 'resolved' && (
                    <button onClick={() => resolveAlert(alert.id)} className="font-cinzel text-[8px] tracking-widest" style={{ color: '#6abf8e', letterSpacing: '0.2em' }}>
                      RESOLVE
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    watch: 'badge-warning', warning: 'badge-danger',
    active: 'badge-danger', resolved: 'badge-success',
  }
  return <span className={`badge ${map[status] || 'badge-sand'}`}>{status}</span>
}
