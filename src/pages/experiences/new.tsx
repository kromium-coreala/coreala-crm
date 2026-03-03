import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { CURRENCIES } from '@/lib/currency'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewExperience() {
  const router = useRouter()
  const { reservation_id, guest_id } = router.query
  const [saving, setSaving] = useState(false)
  const [guests, setGuests] = useState<any[]>([])

  const [form, setForm] = useState({
    guest_id: (guest_id as string) || '',
    reservation_id: (reservation_id as string) || '',
    experience_type: 'yacht_charter',
    name: '',
    date: new Date().toISOString().split('T')[0],
    duration_hours: '',
    amount: '',
    currency: 'USD',
    status: 'pending',
    notes: '',
    vendor: '',
  })

  useEffect(() => {
    if (guest_id) setForm(f => ({ ...f, guest_id: guest_id as string }))
    if (reservation_id) setForm(f => ({ ...f, reservation_id: reservation_id as string }))
    loadGuests()
  }, [guest_id, reservation_id])

  async function loadGuests() {
    const { data } = await supabase.from('guests').select('id, first_name, last_name').order('first_name')
    setGuests(data || [])
  }

  function set(k: string, v: any) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.guest_id || !form.name || !form.amount) { toast.error('Please fill required fields'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('experiences').insert({
        ...form,
        amount: parseFloat(form.amount),
        duration_hours: form.duration_hours ? parseFloat(form.duration_hours) : null,
      })
      if (error) throw error
      toast.success('Experience added')
      router.push('/experiences')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, children }: any) => (
    <div><label className="label-luxury">{label}</label>{children}</div>
  )

  return (
    <>
      <Head><title>New Experience · Coraléa CRM</title></Head>

      <Link href="/experiences" className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft size={14} />
        <span className="font-cinzel text-[9px] tracking-widest" style={{ letterSpacing: '0.3em' }}>EXPERIENCES</span>
      </Link>

      <div className="mb-5">
        <span className="eyebrow">Revenue</span>
        <h1 className="module-title mt-1">Add <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Experience</span></h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Experience Details</span>
          </div>
          <div className="p-4 space-y-4">
            <Field label="Guest *">
              <select className="input-box" value={form.guest_id} onChange={e => set('guest_id', e.target.value)} required>
                <option value="">Select guest</option>
                {guests.map(g => <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>)}
              </select>
            </Field>
            <Field label="Experience Type">
              <select className="input-box" value={form.experience_type} onChange={e => set('experience_type', e.target.value)}>
                {['yacht_charter','spa_treatment','dining','excursion','wellness','event','other'].map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </Field>
            <Field label="Name / Description *">
              <input className="input-box" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Sunset Yacht Charter, 3-hour" />
            </Field>
            <Field label="Vendor / Partner">
              <input className="input-box" value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="e.g. Blue Horizon Yachts" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date">
                <input type="date" className="input-box" value={form.date} onChange={e => set('date', e.target.value)} required />
              </Field>
              <Field label="Duration (hrs)">
                <input type="number" step="0.5" className="input-box" value={form.duration_hours} onChange={e => set('duration_hours', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount *">
                <input type="number" className="input-box" value={form.amount} onChange={e => set('amount', e.target.value)} required />
              </Field>
              <Field label="Currency">
                <select className="input-box" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Status">
              <select className="input-box" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
            <Field label="Notes">
              <textarea className="input-box" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : 'Add Experience'}
          </button>
          <Link href="/experiences" className="btn-ghost text-center" style={{ flex: 1 }}>Cancel</Link>
        </div>
      </form>
    </>
  )
}
