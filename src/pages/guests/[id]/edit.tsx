import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { CURRENCIES } from '@/lib/currency'
import { ArrowLeft, Save, Trash2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const ACTIVITIES = [
  'Yacht Charter', 'Fine Dining', 'Spa Treatments', 'Yoga', 'Cold Plunge',
  'Deep Sea Fishing', 'Excursions', 'Cultural Tours', 'Golf', 'Wellness Journeys',
  'Private Chef Experience', 'Helicopter Tours', 'Snorkelling', 'Rum Tastings'
]

export default function EditGuest() {
  const router = useRouter()
  const { id } = router.query
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState<any>(null)

  useEffect(() => { if (id) loadGuest() }, [id])

  async function loadGuest() {
    const { data } = await supabase.from('guests').select('*').eq('id', id).single()
    if (data) setForm(data)
    else { toast.error('Guest not found'); router.push('/guests') }
  }

  function set(k: string, v: any) { setForm((p: any) => ({ ...p, [k]: v })) }

  function toggleActivity(act: string) {
    const current = form.preferred_activities || []
    set('preferred_activities', current.includes(act)
      ? current.filter((a: string) => a !== act)
      : [...current, act]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('guests').update({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        nationality: form.nationality,
        passport_number: form.passport_number,
        vip_tier: form.vip_tier,
        discretion_level: form.discretion_level,
        preferred_currency: form.preferred_currency,
        dietary_requirements: form.dietary_requirements,
        allergies: form.allergies,
        pillow_preference: form.pillow_preference,
        room_temperature: form.room_temperature ? Number(form.room_temperature) : null,
        preferred_activities: form.preferred_activities,
        arrival_preference: form.arrival_preference,
        anniversary_date: form.anniversary_date || null,
        birthday: form.birthday || null,
        notes: form.notes,
      }).eq('id', id)
      if (error) throw error
      toast.success('Profile updated')
      router.push(`/guests/${id}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const { error } = await supabase.from('guests').delete().eq('id', id)
      if (error) throw error
      toast.success('Guest profile deleted')
      router.push('/guests')
    } catch (err: any) {
      toast.error(err.message)
      setDeleting(false)
    }
  }

  if (!form) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="font-cormorant italic" style={{ color: 'var(--text-dim)' }}>Loading...</div>
    </div>
  )

  const Field = ({ label, children }: any) => (
    <div><label className="label-luxury">{label}</label>{children}</div>
  )

  return (
    <>
      <Head><title>Edit {form.first_name} {form.last_name} · Coraléa CRM</title></Head>

      <Link href={`/guests/${id}`} className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft size={14} />
        <span className="font-cinzel text-[9px] tracking-widest" style={{ letterSpacing: '0.3em' }}>BACK TO PROFILE</span>
      </Link>

      <div className="mb-5">
        <span className="eyebrow">Guest Intelligence</span>
        <h1 className="module-title mt-1">
          Edit <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Profile</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Identity */}
        <div className="card mb-4">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Identity</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name *">
                <input className="input-box" value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
              </Field>
              <Field label="Last Name *">
                <input className="input-box" value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
              </Field>
            </div>
            <Field label="Email *">
              <input type="email" className="input-box" value={form.email} onChange={e => set('email', e.target.value)} required />
            </Field>
            <Field label="Phone">
              <input className="input-box" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nationality">
                <input className="input-box" value={form.nationality || ''} onChange={e => set('nationality', e.target.value)} />
              </Field>
              <Field label="Passport No.">
                <input className="input-box" value={form.passport_number || ''} onChange={e => set('passport_number', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Birthday">
                <input type="date" className="input-box" value={form.birthday || ''} onChange={e => set('birthday', e.target.value)} />
              </Field>
              <Field label="Anniversary">
                <input type="date" className="input-box" value={form.anniversary_date || ''} onChange={e => set('anniversary_date', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        {/* VIP & Discretion */}
        <div className="card mb-4">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <Shield size={12} style={{ color: 'var(--sand)' }} />
              <span className="eyebrow" style={{ fontSize: '8px' }}>VIP & Discretion</span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="VIP Tier">
                <select className="input-box" value={form.vip_tier} onChange={e => set('vip_tier', e.target.value)}>
                  {['standard','silver','gold','platinum'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Discretion Level">
                <select className="input-box" value={form.discretion_level} onChange={e => set('discretion_level', e.target.value)}>
                  {['standard','high','maximum'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Preferred Currency">
              <select className="input-box" value={form.preferred_currency || 'USD'} onChange={e => set('preferred_currency', e.target.value)}>
                {Object.entries(CURRENCIES).map(([code, { name }]) => (
                  <option key={code} value={code}>{code} — {name}</option>
                ))}
              </select>
            </Field>
            {form.discretion_level === 'maximum' && (
              <div className="p-3 flex items-center gap-2" style={{ background: 'rgba(196,168,130,0.05)', border: '1px solid rgba(196,168,130,0.2)' }}>
                <Shield size={12} style={{ color: 'var(--sand)' }} />
                <span className="font-raleway text-xs" style={{ color: 'var(--text-muted)' }}>
                  Maximum discretion: guest details hidden from junior staff. Senior access only.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="card mb-4">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Stay Preferences</span>
          </div>
          <div className="p-4 space-y-4">
            <Field label="Dietary Requirements">
              <input className="input-box" value={form.dietary_requirements || ''} onChange={e => set('dietary_requirements', e.target.value)} placeholder="e.g. Vegan, Gluten-free" />
            </Field>
            <Field label="Allergies">
              <input className="input-box" value={form.allergies || ''} onChange={e => set('allergies', e.target.value)} placeholder="e.g. Nuts, Shellfish" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pillow Preference">
                <select className="input-box" value={form.pillow_preference || ''} onChange={e => set('pillow_preference', e.target.value)}>
                  <option value="">Not specified</option>
                  {['Soft','Medium','Firm','Memory Foam','Down','Hypoallergenic'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Room Temperature (°C)">
                <input type="number" min="16" max="28" step="0.5" className="input-box" value={form.room_temperature || ''} onChange={e => set('room_temperature', e.target.value)} placeholder="e.g. 22" />
              </Field>
            </div>
            <Field label="Arrival Preference">
              <select className="input-box" value={form.arrival_preference || ''} onChange={e => set('arrival_preference', e.target.value)}>
                <option value="">Not specified</option>
                {['Commercial Flight','Private Jet','Yacht','Helicopter','Other'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Activities */}
        <div className="card mb-4">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Preferred Activities</span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map(act => {
                const selected = (form.preferred_activities || []).includes(act)
                return (
                  <button key={act} type="button" onClick={() => toggleActivity(act)}
                    className="font-cinzel text-[8px] px-3 py-1.5 transition-all"
                    style={{
                      letterSpacing: '0.2em', border: '1px solid',
                      borderColor: selected ? 'var(--sand)' : 'var(--border)',
                      color: selected ? 'var(--sand)' : 'var(--text-dim)',
                      background: selected ? 'rgba(196,168,130,0.1)' : 'transparent',
                    }}>
                    {act}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card mb-4">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Concierge Notes</span>
          </div>
          <div className="p-4">
            <textarea className="input-box" rows={5} value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              placeholder="Private notes visible to senior staff only..." />
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href={`/guests/${id}`} className="btn-ghost text-center" style={{ flex: 1 }}>Cancel</Link>
        </div>
      </form>

      {/* Delete */}
      <div className="card mb-8" style={{ border: '1px solid rgba(156,58,58,0.2)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid rgba(156,58,58,0.15)' }}>
          <span className="eyebrow" style={{ fontSize: '8px', color: '#e07070' }}>Danger Zone</span>
        </div>
        <div className="p-4">
          <p className="font-raleway text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Permanently delete this guest profile and all associated data. This action cannot be undone.
          </p>
          {confirmDelete && (
            <p className="font-cinzel text-[9px] mb-3" style={{ color: '#e07070', letterSpacing: '0.2em' }}>
              CLICK AGAIN TO CONFIRM DELETION
            </p>
          )}
          <button onClick={handleDelete} disabled={deleting}
            className="btn-danger flex items-center gap-2">
            <Trash2 size={13} /> {deleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete' : 'Delete Profile'}
          </button>
        </div>
      </div>
    </>
  )
}
