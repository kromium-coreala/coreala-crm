import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, CheckCircle, Plus, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const PROTOCOLS = [
  'Notify all on-property guests',
  'Secure all outdoor furniture and equipment',
  'Prepare emergency supply kits',
  'Move vehicles to covered parking',
  'Identify and brief shelter locations',
  'Contact all arriving guests regarding disruption',
  'Coordinate with airport for flight changes',
  'Fuel and test emergency generators',
  'Brief all staff on emergency procedures',
  'Establish communication with local authorities',
  'Secure boats and water equipment',
  'Distribute emergency contact cards to all guests',
]

export default function Hurricane() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ storm_name: '', category: 1, eta_hours: 48, affected_guests: 0, notes: '' })
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('hurricane_alerts').select('*').order('created_at', { ascending: false })
    setAlerts(data || [])
    setLoading(false)
  }

  async function createAlert() {
    if (!form.storm_name) return toast.error('Enter storm name')
    const { error } = await supabase.from('hurricane_alerts').insert({
      ...form,
      status: 'watch',
      protocols_activated: selected,
    })
    if (error) toast.error('Failed to create alert')
    else { toast.success('Alert created'); setCreating(false); setForm({ storm_name: '', category: 1, eta_hours: 48, affected_guests: 0, notes: '' }); setSelected([]); load() }
  }

  async function resolve(id: string) {
    await supabase.from('hurricane_alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id)
    toast.success('Alert resolved')
    load()
  }

  const active = alerts.filter(a => a.status !== 'resolved')
  const historical = alerts.filter(a => a.status === 'resolved')

  const catColor = (c: number) => {
    if (c >= 4) return '#f87171'
    if (c >= 3) return '#fb923c'
    if (c >= 2) return '#fbbf24'
    return '#60a5fa'
  }

  return (
    <>
      <Head><title>Hurricane Response — Coraléa CRM</title></Head>

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-eyebrow">Crisis Management</div>
          <div className="page-title">Hurricane <em>Response</em></div>
          <div className="page-subtitle">{active.length > 0 ? `${active.length} ACTIVE ALERT${active.length > 1 ? 'S' : ''}` : 'No active alerts'}</div>
        </div>
        <button className="btn btn-danger" onClick={() => setCreating(!creating)}>
          <Plus size={13} /> New Alert
        </button>
      </div>

      {/* Active alerts */}
      {active.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          {active.map(a => (
            <div key={a.id} style={{
              background: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 'var(--radius-md)', padding: 24, marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AlertTriangle size={24} color="#f87171" />
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.12em', color: '#f87171' }}>{a.storm_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      <span style={{ color: catColor(a.category), fontWeight: 600 }}>Category {a.category}</span>
                      {a.eta_hours > 0 && ` · ETA ${a.eta_hours}h`}
                      {a.affected_guests > 0 && ` · ${a.affected_guests} guests affected`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className={`badge badge-${a.status}`}>{a.status}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => resolve(a.id)}>
                    <CheckCircle size={13} /> Resolve
                  </button>
                </div>
              </div>
              {a.protocols_activated?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Activated Protocols</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                    {a.protocols_activated.map((p: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <CheckCircle size={12} color="var(--status-in)" />
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {a.notes && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{a.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="card card-elevated" style={{ marginBottom: 28, borderColor: 'var(--border-mid)' }}>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>New Storm Alert</div>
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Storm Name</label>
              <input className="input" placeholder="e.g. Hurricane Maria" value={form.storm_name} onChange={e => setForm({ ...form, storm_name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Category (1-5)</label>
              <input className="input" type="number" min={1} max={5} value={form.category} onChange={e => setForm({ ...form, category: Number(e.target.value) })} />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>ETA (hours)</label>
              <input className="input" type="number" value={form.eta_hours} onChange={e => setForm({ ...form, eta_hours: Number(e.target.value) })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Guests Affected</label>
              <input className="input" type="number" value={form.affected_guests} onChange={e => setForm({ ...form, affected_guests: Number(e.target.value) })} />
            </div>
          </div>
          <div className="form-group">
            <label>Select Protocols to Activate</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 6 }}>
              {PROTOCOLS.map(p => (
                <label key={p} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', cursor: 'pointer',
                  background: selected.includes(p) ? 'rgba(248,113,113,0.08)' : 'var(--bg-overlay)',
                  border: `1px solid ${selected.includes(p) ? 'rgba(248,113,113,0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)',
                  transition: 'all 150ms', textTransform: 'none', letterSpacing: 0, fontWeight: 400,
                }}>
                  <input type="checkbox" checked={selected.includes(p)} onChange={() =>
                    setSelected(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p])
                  } style={{ accentColor: 'var(--gold)' }} />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="input" rows={3} placeholder="Additional context…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-danger" onClick={createAlert}>Activate Alert</button>
            <button className="btn btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Protocol checklist */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card card-elevated">
          <div className="card-label" style={{ marginBottom: 12 }}>Standard Protocol Checklist</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PROTOCOLS.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)' }}>
                <Shield size={12} color="var(--gold)" />
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Historical alerts */}
        <div className="card card-elevated">
          <div className="card-label" style={{ marginBottom: 12 }}>Historical Alerts</div>
          {historical.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No historical alerts</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {historical.map(a => (
                <div key={a.id} style={{ padding: '14px 16px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{a.storm_name}</div>
                    <span className="badge badge-completed">Resolved</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ color: catColor(a.category) }}>Category {a.category}</span>
                    {a.affected_guests > 0 && ` · ${a.affected_guests} guests`}
                    {a.resolved_at && ` · Resolved ${format(parseISO(a.resolved_at), 'dd MMM yyyy')}`}
                  </div>
                  {a.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>{a.notes?.slice(0, 120)}{a.notes?.length > 120 ? '…' : ''}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
