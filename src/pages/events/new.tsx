import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewEvent() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', event_type: 'wedding', date: '',
    guest_count: 20, contact_name: '', contact_email: '',
    contact_phone: '', budget: '', currency: 'USD',
    status: 'enquiry', notes: '',
  })

  function set(k: string, v: any) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('events').insert({
        ...form,
        budget: form.budget ? Number(form.budget) : null,
        guest_count: Number(form.guest_count),
      })
      if (error) throw error
      toast.success('Event created')
      router.push('/events')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, children }: any) => <div><label className="label-luxury">{label}</label>{children}</div>

  return (
    <>
      <Head><title>New Event · Coraléa CRM</title></Head>
      <Link href="/events" className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft size={14} />
        <span className="font-cinzel text-[9px] tracking-widest" style={{ letterSpacing: '0.3em' }}>EVENTS</span>
      </Link>
      <div className="mb-5">
        <span className="eyebrow">Private Event</span>
        <h1 className="module-title mt-1">Create <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Event</span></h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Event Details</span>
          </div>
          <div className="p-4 space-y-4">
            <Field label="Event Name *">
              <input className="input-box" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Williams Wedding Reception" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select className="input-box" value={form.event_type} onChange={e => set('event_type', e.target.value)}>
                  {['wedding','corporate','birthday','anniversary','private_dinner','other'].map(t => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date *">
                <input type="date" className="input-box" value={form.date} onChange={e => set('date', e.target.value)} required />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Guest Count">
                <input type="number" min="1" max="60" className="input-box" value={form.guest_count} onChange={e => set('guest_count', e.target.value)} />
              </Field>
              <Field label="Status">
                <select className="input-box" value={form.status} onChange={e => set('status', e.target.value)}>
                  {['enquiry','planning','confirmed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Budget">
                <input type="number" className="input-box" value={form.budget} onChange={e => set('budget', e.target.value)} />
              </Field>
              <Field label="Currency">
                <select className="input-box" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {['USD','BBD','GBP','EUR','CAD','KYD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Contact Details</span>
          </div>
          <div className="p-4 space-y-4">
            <Field label="Contact Name *">
              <input className="input-box" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} required />
            </Field>
            <Field label="Contact Email *">
              <input type="email" className="input-box" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} required />
            </Field>
            <Field label="Contact Phone">
              <input className="input-box" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} />
            </Field>
            <Field label="Notes">
              <textarea className="input-box" rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
            <Save size={14} /> {saving ? 'Creating...' : 'Create Event'}
          </button>
          <Link href="/events" className="btn-ghost text-center" style={{ flex: 1 }}>Cancel</Link>
        </div>
      </form>
    </>
  )
}
