import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { formatCurrency } from '@/lib/currency'
import { Heart, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const TREATMENTS = [
  { name: 'Caribbean Botanical Massage', duration: 1.5, price: 280 },
  { name: 'Ancient Island Ritual', duration: 2.0, price: 380 },
  { name: 'Luminous Caribbean Facial', duration: 1.25, price: 220 },
  { name: 'Couples Spa Experience', duration: 2.5, price: 620 },
  { name: 'Crystal Sound Bath', duration: 1.0, price: 180 },
  { name: 'Wellness Journey (3-day)', duration: 72, price: 1800 },
  { name: 'Sunrise Ocean Yoga', duration: 1.0, price: 120 },
  { name: 'Cold Plunge & Recovery', duration: 0.75, price: 90 },
]
const THERAPISTS = ['Simone Clarke', 'Kezia Alleyne', 'Tristan Ward']

export default function Wellness() {
  const [tab, setTab] = useState<'schedule'|'book'|'treatments'>('schedule')
  const [sessions, setSessions] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])
  const [gs, setGs] = useState('')
  const [form, setForm] = useState({ guest_id:'', treatment:'Caribbean Botanical Massage', therapist:'Simone Clarke', date:'', time:'10:00', notes:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [sRes, gRes] = await Promise.all([
      supabase.from('experiences').select('*, guests(first_name,last_name,vip_tier,allergies,discretion_level)')
        .in('experience_type', ['spa_treatment','wellness']).order('date', { ascending: false }).limit(30),
      supabase.from('guests').select('id,first_name,last_name,vip_tier,allergies,dietary_requirements').order('last_name'),
    ])
    setSessions(sRes.data || [])
    setGuests(gRes.data || [])
  }

  const filteredGuests = guests.filter(g => `${g.first_name} ${g.last_name}`.toLowerCase().includes(gs.toLowerCase())).slice(0, 8)
  const selectedTreatment = TREATMENTS.find(t => t.name === form.treatment)
  const selectedGuest = guests.find(g => g.id === form.guest_id)

  async function book() {
    if (!form.guest_id || !form.date) return toast.error('Guest and date required')
    setSaving(true)
    const { error } = await supabase.from('experiences').insert({
      guest_id: form.guest_id,
      experience_type: form.treatment.toLowerCase().includes('yoga') || form.treatment.toLowerCase().includes('plunge') ? 'wellness' : 'spa_treatment',
      name: form.treatment,
      date: form.date,
      duration_hours: selectedTreatment?.duration || 1,
      amount: selectedTreatment?.price || 0,
      currency: 'USD',
      status: 'confirmed',
      vendor: form.therapist,
      notes: `${form.time ? `Time: ${form.time}. ` : ''}${form.notes}`,
    })
    if (error) { toast.error(error.message); setSaving(false) }
    else { toast.success('Session booked'); setForm(p => ({ ...p, guest_id: '', date: '', notes: '' })); setGs(''); load() }
    setSaving(false)
  }

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    confirmed: sessions.filter(s => s.status === 'confirmed').length,
    revenue: sessions.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.amount || 0), 0),
  }

  return (
    <>
      <Head><title>Wellness — Coraléa CRM</title></Head>

      <div className="page-header">
        <div className="page-eyebrow">Revenue</div>
        <div className="page-title">Wellness <em>Pavilion</em></div>
        <div className="page-subtitle">Spa, yoga, cold plunge and wellness journeys</div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="card card-elevated">
          <div className="card-label">Total Sessions</div>
          <div className="card-value">{stats.total}</div>
          <div className="card-sub">{stats.completed} completed</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Confirmed</div>
          <div className="card-value" style={{ color: 'var(--status-conf)' }}>{stats.confirmed}</div>
          <div className="card-sub">Upcoming sessions</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Spa Revenue</div>
          <div className="card-value">{formatCurrency(stats.revenue, 'USD')}</div>
          <div className="card-sub">From completed sessions</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Avg. Session Value</div>
          <div className="card-value">{stats.completed ? formatCurrency(Math.round(stats.revenue / stats.completed), 'USD') : '—'}</div>
          <div className="card-sub">Per completed session</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
        {(['schedule', 'book', 'treatments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 20px',
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: tab === t ? 'var(--gold)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 150ms',
          }}>
            {t === 'schedule' ? 'Session Log' : t === 'book' ? 'Book Session' : 'Treatments Menu'}
          </button>
        ))}
      </div>

      {tab === 'schedule' && (
        <div className="card card-elevated">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Guest</th><th>Treatment</th><th>Date</th><th className="hide-mobile">Duration</th><th className="hide-mobile">Amount</th><th className="hide-mobile">Therapist</th><th>Status</th></tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {s.guests ? `${s.guests.first_name} ${s.guests.last_name}` : '—'}
                      </div>
                      {s.guests?.vip_tier && <span className={`badge badge-${s.guests.vip_tier}`} style={{ fontSize: 9 }}>{s.guests.vip_tier}</span>}
                    </td>
                    <td style={{ fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(parseISO(s.date), 'dd MMM yyyy')}</td>
                    <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.duration_hours ? `${s.duration_hours}h` : '—'}</td>
                    <td className='hide-mobile' style={{ color: 'var(--gold)', fontSize: 13 }}>{s.amount ? formatCurrency(s.amount, s.currency || 'USD') : '—'}</td>
                    <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.vendor || '—'}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'book' && (
        <div className="grid-2">
          <div className="card card-elevated">
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, marginBottom: 16 }}>Select Guest</div>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: 36 }} placeholder="Search guest…" value={gs} onChange={e => setGs(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
              {filteredGuests.map(g => (
                <div key={g.id} onClick={() => { setForm(p => ({ ...p, guest_id: g.id })); setGs(`${g.first_name} ${g.last_name}`) }}
                  style={{ padding: '8px 12px', background: form.guest_id === g.id ? 'var(--gold-glow)' : 'var(--bg-overlay)', border: `1px solid ${form.guest_id === g.id ? 'var(--gold)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 13, transition: 'all 150ms' }}>
                  <span>{g.first_name} {g.last_name}</span>
                  <span className={`badge badge-${g.vip_tier}`} style={{ fontSize: 9 }}>{g.vip_tier}</span>
                </div>
              ))}
            </div>
            {selectedGuest?.allergies && selectedGuest.allergies !== 'None' && (
              <div style={{ padding: '10px 12px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#fb923c' }}>
                ⚠️ Allergies: {selectedGuest.allergies}
              </div>
            )}
          </div>
          <div className="card card-elevated">
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, marginBottom: 16 }}>Booking Details</div>
            <div className="form-group">
              <label>Treatment</label>
              <select className="select" value={form.treatment} onChange={e => setForm(p => ({ ...p, treatment: e.target.value }))}>
                {TREATMENTS.map(t => <option key={t.name}>{t.name}</option>)}
              </select>
            </div>
            {selectedTreatment && (
              <div style={{ padding: '8px 12px', background: 'var(--gold-glow)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', marginBottom: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
                {selectedTreatment.duration}h · {formatCurrency(selectedTreatment.price, 'USD')}
              </div>
            )}
            <div className="form-group">
              <label>Therapist</label>
              <select className="select" value={form.therapist} onChange={e => setForm(p => ({ ...p, therapist: e.target.value }))}>
                {THERAPISTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Date</label><input className="input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div className="form-group"><label>Time</label><input className="input" type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label>Notes</label><textarea className="input" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={book} disabled={saving}>
              <Heart size={13} /> {saving ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}

      {tab === 'treatments' && (
        <div className="grid-3">
          {TREATMENTS.map(t => (
            <div key={t.name} className="card card-elevated" style={{ cursor: 'pointer' }} onClick={() => { setTab('book'); setForm(p => ({ ...p, treatment: t.name })) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="card-icon"><Heart /></div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-editorial)', color: 'var(--gold)' }}>{formatCurrency(t.price, 'USD')}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.duration}h · Click to book</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
