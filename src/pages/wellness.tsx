import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO, isToday, isFuture } from 'date-fns'
import {
  Heart, Plus, Leaf, Wind, Droplets, Sun, Star,
  CheckCircle, X, Save, Search
} from 'lucide-react'
import toast from 'react-hot-toast'

const TREATMENTS = [
  { id: 'botanical_massage', name: 'Caribbean Botanical Massage', category: 'massage', duration: 90, price: 280, description: 'Warm coconut oil, local botanicals, deep tissue work' },
  { id: 'island_ritual', name: 'Ancient Island Ritual', category: 'ritual', duration: 120, price: 380, description: 'Exfoliation, wrap, hydration — full sensory journey' },
  { id: 'couples_spa', name: 'Couples Spa Experience', category: 'couples', duration: 150, price: 620, description: 'Side-by-side in the double pavilion, champagne included' },
  { id: 'sunrise_yoga', name: 'Sunrise Ocean Yoga', category: 'yoga', duration: 60, price: 120, description: 'Clifftop yoga with panoramic Caribbean sea views' },
  { id: 'cold_plunge', name: 'Cold Plunge & Recovery', category: 'recovery', duration: 45, price: 90, description: 'Ice bath, contrast therapy, lymphatic activation' },
  { id: 'wellness_journey', name: 'Wellness Journey (3-day)', category: 'programme', duration: 4320, price: 1800, description: 'Curated multi-day programme: body, mind, spirit' },
  { id: 'sound_bath', name: 'Crystal Sound Bath', category: 'meditation', duration: 60, price: 180, description: 'Tibetan bowls, guided breathing, deep restoration' },
  { id: 'facial', name: 'Luminous Caribbean Facial', category: 'facial', duration: 75, price: 220, description: 'Marine collagen, sea kelp, island enzyme brightening' },
]

const CATEGORY_ICONS: Record<string, any> = {
  massage: Droplets, ritual: Leaf, couples: Heart,
  yoga: Sun, recovery: Wind, programme: Star,
  meditation: Wind, facial: Leaf,
}

const THERAPISTS = ['Any Available', 'Simone Clarke', 'Kezia Alleyne', 'Tristan Ward', 'Marcia Holder']

export default function Wellness() {
  const [sessions, setSessions] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'schedule' | 'book' | 'treatments'>('schedule')
  const [stats, setStats] = useState({ total: 0, revenue: 0, upcoming: 0, todayCount: 0 })
  const [guestSearch, setGuestSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'completed'>('all')
  const [form, setForm] = useState({
    guest_id: '', name: '', treatment_id: '',
    date: format(new Date(), 'yyyy-MM-dd'), time: '10:00',
    therapist: 'Any Available', notes: '', amount: '', currency: 'USD',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [expRes, guestRes] = await Promise.all([
      supabase.from('experiences').select('*, guests(first_name, last_name, allergies, discretion_level)').eq('experience_type', 'wellness').order('date', { ascending: false }).limit(50),
      supabase.from('guests').select('id, first_name, last_name, vip_tier, allergies').order('last_stay', { ascending: false }).limit(100),
    ])
    const items = expRes.data || []
    setSessions(items)
    setGuests(guestRes.data || [])
    setStats({
      total: items.length,
      revenue: items.filter((e: any) => e.status === 'completed').reduce((s: number, e: any) => s + e.amount, 0),
      upcoming: items.filter((e: any) => ['pending','confirmed'].includes(e.status)).length,
      todayCount: items.filter((e: any) => isToday(parseISO(e.date))).length,
    })
    setLoading(false)
  }

  function selectTreatment(t: typeof TREATMENTS[0]) {
    setForm(prev => ({ ...prev, name: t.name, treatment_id: t.id, amount: String(t.price) }))
    setTab('book')
  }

  function selectGuest(g: any) { setForm(prev => ({ ...prev, guest_id: g.id })); setGuestSearch('') }
  function set(k: string, v: any) { setForm(prev => ({ ...prev, [k]: v })) }

  async function saveBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!form.guest_id || !form.name || !form.date) { toast.error('Please fill all required fields'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('experiences').insert({
        guest_id: form.guest_id, experience_type: 'wellness', name: form.name,
        date: form.date, amount: Number(form.amount), currency: form.currency, status: 'confirmed',
        vendor: form.therapist !== 'Any Available' ? form.therapist : null,
        notes: [form.notes, form.time ? `Time: ${form.time}` : ''].filter(Boolean).join(' | '),
      })
      if (error) throw error
      toast.success('Session booked')
      setForm({ guest_id: '', name: '', treatment_id: '', date: format(new Date(), 'yyyy-MM-dd'), time: '10:00', therapist: 'Any Available', notes: '', amount: '', currency: 'USD' })
      setTab('schedule')
      loadData()
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('experiences').update({ status }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success(`Marked ${status}`); loadData() }
  }

  const filteredSessions = sessions.filter(s => {
    if (filterStatus === 'upcoming') return ['pending','confirmed'].includes(s.status)
    if (filterStatus === 'completed') return s.status === 'completed'
    return true
  })

  const selectedGuest = guests.find(g => g.id === form.guest_id)
  const filteredGuests = guestSearch.length > 1 && !form.guest_id
    ? guests.filter(g => `${g.first_name} ${g.last_name}`.toLowerCase().includes(guestSearch.toLowerCase()))
    : []

  return (
    <>
      <Head><title>Wellness Pavilion · Coraléa CRM</title></Head>
      <div className="mb-5 animate-fade-up">
        <span className="eyebrow">The Pavilion</span>
        <h1 className="module-title mt-1">Wellness <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>& Spa</span></h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2 mb-4 animate-fade-up">
        {[
          { label: 'Today', value: stats.todayCount, color: 'var(--sand)' },
          { label: 'Upcoming', value: stats.upcoming, color: '#6abf8e' },
          { label: 'Total', value: stats.total, color: 'var(--text-muted)' },
          { label: 'Revenue', value: formatCurrency(stats.revenue), color: 'var(--sand)', small: true },
        ].map(({ label, value, color, small }) => (
          <div key={label} className="card p-3 text-center">
            <div className="font-cormorant italic" style={{ color, fontSize: small ? '13px' : '22px', lineHeight: 1 }}>{value}</div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        {(['schedule', 'book', 'treatments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="font-cinzel text-[9px] px-4 py-3 capitalize transition-all"
            style={{ letterSpacing: '0.25em', color: tab === t ? 'var(--sand)' : 'var(--text-dim)', borderBottom: tab === t ? '2px solid var(--sand)' : '2px solid transparent', marginBottom: '-1px' }}>
            {t}
          </button>
        ))}
      </div>

      {/* SCHEDULE */}
      {tab === 'schedule' && (
        <div className="animate-fade-in">
          <div className="flex gap-2 mb-3">
            {(['all', 'upcoming', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className="font-cinzel text-[8px] px-3 py-1.5 capitalize transition-all"
                style={{ letterSpacing: '0.2em', border: '1px solid', borderColor: filterStatus === f ? 'var(--sand)' : 'var(--border)', color: filterStatus === f ? 'var(--sand)' : 'var(--text-dim)', background: filterStatus === f ? 'rgba(196,168,130,0.08)' : 'transparent' }}>
                {f}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded" />)}</div>
          ) : filteredSessions.length === 0 ? (
            <div className="card p-10 text-center">
              <Heart size={28} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
              <div className="font-cormorant italic text-xl mb-3" style={{ color: 'var(--text-dim)' }}>No sessions recorded</div>
              <button onClick={() => setTab('book')} className="btn-primary inline-flex items-center gap-2"><Plus size={14} /> Book Session</button>
            </div>
          ) : (
            <div className="card">
              {filteredSessions.map((session: any, i: number) => {
                const isToday_ = isToday(parseISO(session.date))
                const isUpcoming = ['pending','confirmed'].includes(session.status)
                const TIcon = CATEGORY_ICONS[TREATMENTS.find(t => t.name === session.name)?.category || 'massage'] || Heart
                return (
                  <div key={session.id} className="p-4 transition-all" style={{ borderBottom: i < filteredSessions.length - 1 ? '1px solid rgba(196,168,130,0.05)' : 'none' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <TIcon size={13} style={{ color: 'var(--sand)' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{session.name}</div>
                            {session.guests && (
                              <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                                {session.guests.discretion_level === 'maximum' ? '— Confidential —' : `${session.guests.first_name} ${session.guests.last_name}`}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-cormorant italic text-sm" style={{ color: 'var(--sand)' }}>{formatCurrency(session.amount, session.currency)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-cinzel text-[8px]" style={{ color: isToday_ ? '#6abf8e' : 'var(--text-dim)', letterSpacing: '0.2em' }}>
                            {isToday_ ? 'TODAY' : format(parseISO(session.date), 'MMM d, yyyy')}
                            {session.vendor && ` · ${session.vendor}`}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${session.status === 'completed' ? 'badge-sand' : session.status === 'confirmed' ? 'badge-success' : session.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>{session.status}</span>
                            {isUpcoming && (
                              <button onClick={() => updateStatus(session.id, 'completed')} style={{ color: 'var(--text-dim)' }} title="Mark complete"><CheckCircle size={13} /></button>
                            )}
                          </div>
                        </div>
                        {session.guests?.allergies && session.guests.allergies !== 'None noted' && (
                          <div className="mt-2 px-2 py-1" style={{ background: 'rgba(196,149,58,0.1)', border: '1px solid rgba(196,149,58,0.2)' }}>
                            <span className="font-cinzel text-[7px]" style={{ color: '#e0b05a', letterSpacing: '0.2em' }}>⚠ ALLERGY: {session.guests.allergies}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* BOOK */}
      {tab === 'book' && (
        <div className="animate-fade-in">
          <form onSubmit={saveBooking} className="space-y-5">
            <div className="card p-4">
              <label className="label-luxury">Guest *</label>
              {selectedGuest ? (
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="font-cormorant text-base" style={{ color: 'var(--text-primary)' }}>{selectedGuest.first_name} {selectedGuest.last_name}</div>
                    {selectedGuest.allergies && <div className="font-raleway text-xs mt-1" style={{ color: '#e0b05a' }}>⚠ Allergy: {selectedGuest.allergies}</div>}
                  </div>
                  <button type="button" onClick={() => set('guest_id', '')} style={{ color: 'var(--text-dim)' }}><X size={14} /></button>
                </div>
              ) : (
                <div className="relative mt-2">
                  <div className="flex items-center gap-2 px-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <Search size={12} style={{ color: 'var(--text-dim)' }} />
                    <input className="flex-1 bg-transparent py-2.5 font-raleway text-sm outline-none" style={{ color: 'var(--text-primary)' }} placeholder="Search guest name..." value={guestSearch} onChange={e => setGuestSearch(e.target.value)} />
                  </div>
                  {filteredGuests.length > 0 && (
                    <div className="absolute z-10 w-full mt-1" style={{ background: 'var(--obsidian)', border: '1px solid var(--border)' }}>
                      {filteredGuests.map((g: any) => (
                        <button key={g.id} type="button" onClick={() => selectGuest(g)} className="w-full text-left px-4 py-3 transition-all" style={{ borderBottom: '1px solid rgba(196,168,130,0.05)' }}>
                          <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{g.first_name} {g.last_name}</div>
                          {g.allergies && <div className="font-raleway text-xs" style={{ color: '#e0b05a' }}>⚠ {g.allergies}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="label-luxury">Treatment *</label>
              {form.treatment_id ? (
                <div className="mt-2 flex items-center justify-between p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-active)' }}>
                  <span className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{form.name}</span>
                  <button type="button" onClick={() => set('treatment_id', '')} style={{ color: 'var(--text-dim)' }}><X size={13} /></button>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {TREATMENTS.map(t => {
                    const TIcon = CATEGORY_ICONS[t.category] || Heart
                    return (
                      <button key={t.id} type="button" onClick={() => selectTreatment(t)} className="flex items-center gap-3 p-3 w-full text-left transition-all" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <TIcon size={13} style={{ color: 'var(--sand)', flexShrink: 0 }} />
                        <div className="flex-1">
                          <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                          <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>{t.duration < 1440 ? `${t.duration} min` : '3 days'}</div>
                        </div>
                        <span className="font-cormorant italic" style={{ color: 'var(--sand)' }}>${t.price}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {form.treatment_id && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label-luxury">Date *</label><input type="date" className="input-box mt-1" value={form.date} onChange={e => set('date', e.target.value)} required /></div>
                  <div><label className="label-luxury">Time</label><input type="time" className="input-box mt-1" value={form.time} onChange={e => set('time', e.target.value)} /></div>
                </div>
                <div>
                  <label className="label-luxury">Therapist</label>
                  <select className="input-box mt-1" value={form.therapist} onChange={e => set('therapist', e.target.value)}>
                    {THERAPISTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2"><label className="label-luxury">Amount *</label><input type="number" className="input-box mt-1" value={form.amount} onChange={e => set('amount', e.target.value)} required /></div>
                  <div><label className="label-luxury">Currency</label><select className="input-box mt-1" value={form.currency} onChange={e => set('currency', e.target.value)}>{['USD','BBD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div><label className="label-luxury">Notes / Requests</label><textarea className="input-box mt-1" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Pressure preference, areas to avoid..." /></div>
                <button type="submit" disabled={saving} className="btn-primary w-full justify-center gap-2"><Save size={14} />{saving ? 'Booking...' : 'Confirm Booking'}</button>
              </>
            )}
          </form>
        </div>
      )}

      {/* TREATMENTS MENU */}
      {tab === 'treatments' && (
        <div className="animate-fade-in card">
          {TREATMENTS.map((t, i) => {
            const TIcon = CATEGORY_ICONS[t.category] || Heart
            return (
              <div key={t.id} className="p-4" style={{ borderBottom: i < TREATMENTS.length - 1 ? '1px solid rgba(196,168,130,0.05)' : 'none' }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <TIcon size={13} style={{ color: 'var(--sand)' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between gap-2">
                      <div className="font-cormorant text-base" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                      <div className="font-cormorant italic flex-shrink-0" style={{ color: 'var(--sand)' }}>${t.price}</div>
                    </div>
                    <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{t.duration < 1440 ? `${t.duration} min` : '3 days'}</div>
                    <div className="font-raleway text-xs italic mt-1" style={{ color: 'var(--text-muted)' }}>{t.description}</div>
                  </div>
                </div>
                <button onClick={() => { selectTreatment(t); setTab('book') }} className="mt-3 w-full font-cinzel text-[8px] py-2 transition-all" style={{ letterSpacing: '0.25em', border: '1px solid var(--border)', color: 'var(--sand)', background: 'transparent' }}>BOOK THIS TREATMENT</button>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ height: 40 }} />
    </>
  )
}
