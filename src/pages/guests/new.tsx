import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const ACTIVITIES = ['Yacht Charter', 'Spa Treatments', 'Scuba Diving', 'Golf', 'Hiking', 'Fine Dining', 'Yoga', 'Water Sports', 'Cultural Tours', 'Deep Sea Fishing']

export default function GuestForm() {
  const router = useRouter()
  const { id } = router.query
  const isEdit = !!id && id !== 'new'
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    nationality: '', passport_number: '',
    vip_tier: 'standard' as const,
    preferred_currency: 'USD',
    dietary_requirements: '', allergies: '',
    pillow_preference: '', room_temperature: '',
    preferred_activities: [] as string[],
    arrival_preference: '',
    birthday: '', anniversary_date: '',
    notes: '',
    discretion_level: 'standard' as const,
  })

  useEffect(() => {
    if (isEdit) loadGuest()
  }, [id])

  async function loadGuest() {
    const { data } = await supabase.from('guests').select('*').eq('id', id).single()
    if (data) {
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        nationality: data.nationality || '',
        passport_number: data.passport_number || '',
        vip_tier: data.vip_tier || 'standard',
        preferred_currency: data.preferred_currency || 'USD',
        dietary_requirements: data.dietary_requirements || '',
        allergies: data.allergies || '',
        pillow_preference: data.pillow_preference || '',
        room_temperature: data.room_temperature?.toString() || '',
        preferred_activities: data.preferred_activities || [],
        arrival_preference: data.arrival_preference || '',
        birthday: data.birthday || '',
        anniversary_date: data.anniversary_date || '',
        notes: data.notes || '',
        discretion_level: data.discretion_level || 'standard',
      })
    }
  }

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleActivity(act: string) {
    setForm(prev => ({
      ...prev,
      preferred_activities: prev.preferred_activities.includes(act)
        ? prev.preferred_activities.filter(a => a !== act)
        : [...prev.preferred_activities, act]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        room_temperature: form.room_temperature ? parseFloat(form.room_temperature) : null,
        birthday: form.birthday || null,
        anniversary_date: form.anniversary_date || null,
      }
      let error
      if (isEdit) {
        ({ error } = await supabase.from('guests').update(payload).eq('id', id))
      } else {
        ({ error } = await supabase.from('guests').insert({ ...payload, total_stays: 0, total_revenue: 0 }))
      }
      if (error) throw error
      toast.success(isEdit ? 'Guest updated' : 'Guest created')
      router.push('/guests')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card mb-4">
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="eyebrow" style={{ fontSize: '8px' }}>{title}</span>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="label-luxury">{label}</label>
      {children}
    </div>
  )

  return (
    <>
      <Head><title>{isEdit ? 'Edit Guest' : 'New Guest'} · Coraléa CRM</title></Head>

      <Link href="/guests" className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft size={14} />
        <span className="font-cinzel text-[9px] tracking-widest" style={{ letterSpacing: '0.3em' }}>GUESTS</span>
      </Link>

      <div className="mb-5">
        <span className="eyebrow">Guest Intelligence</span>
        <h1 className="module-title mt-1">
          {isEdit ? 'Edit' : 'New'} <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Profile</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Section title="Identity">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name">
              <input className="input-box" value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
            </Field>
            <Field label="Last Name">
              <input className="input-box" value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
            </Field>
          </div>
          <Field label="Email Address">
            <input type="email" className="input-box" value={form.email} onChange={e => set('email', e.target.value)} required />
          </Field>
          <Field label="Phone">
            <input className="input-box" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nationality">
              <input className="input-box" value={form.nationality} onChange={e => set('nationality', e.target.value)} />
            </Field>
            <Field label="Passport No.">
              <input className="input-box" value={form.passport_number} onChange={e => set('passport_number', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="VIP Classification">
          <Field label="VIP Tier">
            <select className="input-box" value={form.vip_tier} onChange={e => set('vip_tier', e.target.value)}>
              <option value="standard">Standard</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
          </Field>
          <Field label="Discretion Level">
            <select className="input-box" value={form.discretion_level} onChange={e => set('discretion_level', e.target.value)}>
              <option value="standard">Standard</option>
              <option value="high">High</option>
              <option value="maximum">Maximum</option>
            </select>
          </Field>
          <Field label="Preferred Currency">
            <select className="input-box" value={form.preferred_currency} onChange={e => set('preferred_currency', e.target.value)}>
              {['USD','BBD','GBP','EUR','CAD','KYD','TTD','JMD'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Preferences & Intelligence">
          <Field label="Dietary Requirements">
            <input className="input-box" value={form.dietary_requirements} onChange={e => set('dietary_requirements', e.target.value)} placeholder="e.g. Vegan, Halal, Gluten-free" />
          </Field>
          <Field label="Known Allergies">
            <input className="input-box" value={form.allergies} onChange={e => set('allergies', e.target.value)} />
          </Field>
          <Field label="Pillow Preference">
            <input className="input-box" value={form.pillow_preference} onChange={e => set('pillow_preference', e.target.value)} placeholder="e.g. Firm, Soft, Down-free" />
          </Field>
          <Field label="Room Temperature (°C)">
            <input type="number" className="input-box" value={form.room_temperature} onChange={e => set('room_temperature', e.target.value)} placeholder="e.g. 22" />
          </Field>
          <Field label="Arrival Preference">
            <select className="input-box" value={form.arrival_preference} onChange={e => set('arrival_preference', e.target.value)}>
              <option value="">Select preference</option>
              <option value="Commercial Flight">Commercial Flight</option>
              <option value="Private Jet">Private Jet</option>
              <option value="Yacht">Yacht</option>
              <option value="Helicopter">Helicopter</option>
            </select>
          </Field>
          <Field label="Preferred Activities">
            <div className="flex flex-wrap gap-2 mt-2">
              {ACTIVITIES.map(act => (
                <button type="button" key={act} onClick={() => toggleActivity(act)}
                  className="font-cinzel text-[8px] px-2.5 py-1.5 transition-all"
                  style={{
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    border: '1px solid',
                    borderColor: form.preferred_activities.includes(act) ? 'var(--sand)' : 'var(--border)',
                    color: form.preferred_activities.includes(act) ? 'var(--sand)' : 'var(--text-dim)',
                    background: form.preferred_activities.includes(act) ? 'rgba(196,168,130,0.08)' : 'transparent',
                  }}>
                  {act}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Important Dates">
          <Field label="Birthday">
            <input type="date" className="input-box" value={form.birthday} onChange={e => set('birthday', e.target.value)} />
          </Field>
          <Field label="Anniversary">
            <input type="date" className="input-box" value={form.anniversary_date} onChange={e => set('anniversary_date', e.target.value)} />
          </Field>
        </Section>

        <Section title="Concierge Notes">
          <Field label="Private Notes">
            <textarea className="input-box" rows={4} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Internal notes about this guest's preferences and history..." />
          </Field>
        </Section>

        <div className="flex gap-3 mb-8">
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : isEdit ? 'Update Guest' : 'Create Guest'}
          </button>
          <Link href="/guests" className="btn-ghost text-center" style={{ flex: 1 }}>Cancel</Link>
        </div>
      </form>
    </>
  )
}
