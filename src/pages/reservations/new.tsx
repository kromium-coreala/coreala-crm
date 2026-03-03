import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { CURRENCIES, CurrencyCode, formatCurrency } from '@/lib/currency'
import { ArrowLeft, Save, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewReservation() {
  const router = useRouter()
  const { guest_id } = router.query
  const [saving, setSaving] = useState(false)
  const [guests, setGuests] = useState<any[]>([])
  const [guestSearch, setGuestSearch] = useState('')

  const [form, setForm] = useState({
    guest_id: (guest_id as string) || '',
    accommodation_type: 'private_suite',
    room_number: '',
    check_in: '',
    check_out: '',
    adults: 2,
    children: 0,
    nightly_rate: 950,
    currency: 'USD',
    status: 'confirmed',
    special_requests: '',
    occasion: '',
    arrival_method: 'commercial_flight',
    concierge_notes: '',
    pre_arrival_completed: false,
  })

  useEffect(() => {
    if (guest_id) setForm(f => ({ ...f, guest_id: guest_id as string }))
    loadGuests()
  }, [guest_id])

  async function loadGuests() {
    const { data } = await supabase.from('guests').select('id, first_name, last_name, vip_tier').order('first_name')
    setGuests(data || [])
  }

  const nights = form.check_in && form.check_out
    ? Math.max(0, Math.round((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86400000))
    : 0
  const total = nights * form.nightly_rate

  const ADR_RANGES: Record<string, { min: number; max: number }> = {
    private_suite: { min: 950, max: 1600 },
    oceanfront_villa: { min: 1600, max: 2200 },
    grand_villa: { min: 2500, max: 4000 },
  }

  function set(field: string, value: any) {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'accommodation_type') {
        updated.nightly_rate = ADR_RANGES[value]?.min || 950
      }
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.guest_id) { toast.error('Please select a guest'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('reservations').insert({
        ...form,
        nightly_rate: Number(form.nightly_rate),
        total_amount: total,
        adults: Number(form.adults),
        children: Number(form.children),
      })
      if (error) throw error

      // Update guest total stays and revenue
      try { await supabase.rpc('increment_guest_stats', { guest_id: form.guest_id, revenue: total }) } catch(_) {}

      toast.success('Reservation created')
      router.push('/reservations')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const filteredGuests = guests.filter(g =>
    `${g.first_name} ${g.last_name}`.toLowerCase().includes(guestSearch.toLowerCase())
  )

  const Section = ({ title, children }: any) => (
    <div className="card mb-4">
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="eyebrow" style={{ fontSize: '8px' }}>{title}</span>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
  const Field = ({ label, children }: any) => (
    <div><label className="label-luxury">{label}</label>{children}</div>
  )

  return (
    <>
      <Head><title>New Reservation · Coraléa CRM</title></Head>

      <Link href="/reservations" className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft size={14} />
        <span className="font-cinzel text-[9px] tracking-widest" style={{ letterSpacing: '0.3em' }}>RESERVATIONS</span>
      </Link>

      <div className="mb-5">
        <span className="eyebrow">New Booking</span>
        <h1 className="module-title mt-1">
          Create <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Reservation</span>
        </h1>
      </div>

      {/* Revenue preview */}
      {nights > 0 && (
        <div className="card p-4 mb-4 animate-fade-in" style={{ background: 'rgba(196,168,130,0.04)' }}>
          <div className="flex justify-between items-center">
            <div>
              <div className="eyebrow" style={{ fontSize: '8px' }}>Estimated Revenue</div>
              <div className="font-cormorant italic text-2xl mt-1" style={{ color: 'var(--sand)' }}>
                {formatCurrency(total, form.currency as CurrencyCode)}
              </div>
            </div>
            <div className="text-right">
              <div className="eyebrow" style={{ fontSize: '8px' }}>Duration</div>
              <div className="font-cormorant italic text-xl mt-1" style={{ color: 'var(--text-primary)' }}>{nights} nights</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Section title="Guest">
          <Field label="Select Guest">
            <input
              className="input-box mb-2"
              placeholder="Search guest name..."
              value={guestSearch}
              onChange={e => setGuestSearch(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto" style={{ border: '1px solid var(--border)' }}>
              {filteredGuests.map(g => (
                <button type="button" key={g.id} onClick={() => { set('guest_id', g.id); setGuestSearch(`${g.first_name} ${g.last_name}`) }}
                  className="w-full flex items-center gap-3 p-3 text-left transition-all"
                  style={{
                    background: form.guest_id === g.id ? 'rgba(196,168,130,0.1)' : 'transparent',
                    borderBottom: '1px solid rgba(196,168,130,0.05)',
                    borderLeft: form.guest_id === g.id ? '2px solid var(--sand)' : '2px solid transparent',
                  }}>
                  <span className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{g.first_name} {g.last_name}</span>
                  <span className={`badge ml-auto ${g.vip_tier === 'platinum' ? 'badge-platinum' : g.vip_tier === 'gold' ? 'badge-warning' : 'badge-sand'}`}>{g.vip_tier}</span>
                </button>
              ))}
              {filteredGuests.length === 0 && (
                <div className="p-3 text-center font-cormorant italic" style={{ color: 'var(--text-dim)' }}>
                  No guests found · <Link href="/guests/new" style={{ color: 'var(--sand)' }}>Create new</Link>
                </div>
              )}
            </div>
          </Field>
        </Section>

        <Section title="Accommodation">
          <Field label="Type">
            <select className="input-box" value={form.accommodation_type} onChange={e => set('accommodation_type', e.target.value)}>
              <option value="private_suite">Private Suite ($950–$1,600)</option>
              <option value="oceanfront_villa">Oceanfront Villa ($1,600–$2,200)</option>
              <option value="grand_villa">The Grand Villa ($2,500+)</option>
            </select>
          </Field>
          <Field label="Room / Villa Number">
            <input className="input-box" value={form.room_number} onChange={e => set('room_number', e.target.value)} placeholder="e.g. Suite 04" />
          </Field>
        </Section>

        <Section title="Dates & Guests">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Check-in">
              <input type="date" className="input-box" value={form.check_in} onChange={e => set('check_in', e.target.value)} required />
            </Field>
            <Field label="Check-out">
              <input type="date" className="input-box" value={form.check_out} onChange={e => set('check_out', e.target.value)} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Adults">
              <input type="number" min="1" className="input-box" value={form.adults} onChange={e => set('adults', e.target.value)} />
            </Field>
            <Field label="Children">
              <input type="number" min="0" className="input-box" value={form.children} onChange={e => set('children', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Pricing">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nightly Rate">
              <input type="number" className="input-box" value={form.nightly_rate} onChange={e => set('nightly_rate', e.target.value)} />
            </Field>
            <Field label="Currency">
              <select className="input-box" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {Object.entries(CURRENCIES).map(([code, { name }]) => (
                  <option key={code} value={code}>{code} – {name}</option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Arrival & Status">
          <Field label="Status">
            <select className="input-box" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="enquiry">Enquiry</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
            </select>
          </Field>
          <Field label="Arrival Method">
            <select className="input-box" value={form.arrival_method} onChange={e => set('arrival_method', e.target.value)}>
              <option value="commercial_flight">Commercial Flight</option>
              <option value="private_jet">Private Jet</option>
              <option value="yacht">Yacht</option>
              <option value="helicopter">Helicopter</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Occasion">
            <input className="input-box" value={form.occasion} onChange={e => set('occasion', e.target.value)} placeholder="e.g. Anniversary, Honeymoon, Birthday" />
          </Field>
        </Section>

        <Section title="Notes">
          <Field label="Special Requests">
            <textarea className="input-box" rows={3} value={form.special_requests} onChange={e => set('special_requests', e.target.value)} />
          </Field>
          <Field label="Concierge Notes (Internal)">
            <textarea className="input-box" rows={3} value={form.concierge_notes} onChange={e => set('concierge_notes', e.target.value)} />
          </Field>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="preArrival" checked={form.pre_arrival_completed}
              onChange={e => set('pre_arrival_completed', e.target.checked)}
              style={{ accentColor: 'var(--sand)', width: 14, height: 14 }} />
            <label htmlFor="preArrival" className="font-cinzel text-[9px] tracking-widest" style={{ color: 'var(--text-dim)', letterSpacing: '0.3em' }}>
              PRE-ARRIVAL CHECKLIST COMPLETED
            </label>
          </div>
        </Section>

        <div className="flex gap-3 mb-8">
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
            <Save size={14} /> {saving ? 'Creating...' : 'Create Reservation'}
          </button>
          <Link href="/reservations" className="btn-ghost text-center" style={{ flex: 1 }}>Cancel</Link>
        </div>
      </form>
    </>
  )
}
