import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditGuest() {
  const router = useRouter()
  const { id } = router.query
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) supabase.from('guests').select('*').eq('id', id).single().then(({ data }) => setForm(data))
  }, [id])

  const f = (k: string) => (v: any) => setForm((p: any) => ({ ...p, [k]: v.target?.value ?? v }))

  async function save() {
    if (!form.first_name || !form.last_name || !form.email) return toast.error('Name and email required')
    setSaving(true)
    const { error } = await supabase.from('guests').update({
      ...form,
      room_temperature: form.room_temperature ? Number(form.room_temperature) : null,
      birthday: form.birthday || null,
      anniversary_date: form.anniversary_date || null,
    }).eq('id', id)
    if (error) { toast.error(error.message); setSaving(false) }
    else { toast.success('Profile updated'); router.push(`/guests/${id}`) }
  }

  if (!form) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div>

  return (
    <>
      <Head><title>Edit Guest — Coraléa CRM</title></Head>
      <div style={{ marginBottom: 24 }}>
        <Link href={`/guests/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}><ArrowLeft size={13} /> Back to Profile</Link>
        <div className="page-header" style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div><div className="page-eyebrow">Intelligence</div><div className="page-title">Edit <em>Profile</em></div></div>
          <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={13} />{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
      <div className="grid-2">
        <div className="card card-elevated">
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, marginBottom: 16 }}>Personal Information</div>
          <div className="form-row"><div className="form-group"><label>First Name</label><input className="input" value={form.first_name || ''} onChange={f('first_name')} /></div><div className="form-group"><label>Last Name</label><input className="input" value={form.last_name || ''} onChange={f('last_name')} /></div></div>
          <div className="form-group"><label>Email</label><input className="input" type="email" value={form.email || ''} onChange={f('email')} /></div>
          <div className="form-row"><div className="form-group"><label>Phone</label><input className="input" value={form.phone || ''} onChange={f('phone')} /></div><div className="form-group"><label>Nationality</label><input className="input" value={form.nationality || ''} onChange={f('nationality')} /></div></div>
          <div className="form-row"><div className="form-group"><label>Passport Number</label><input className="input" value={form.passport_number || ''} onChange={f('passport_number')} /></div><div className="form-group"><label>Preferred Currency</label><select className="select" value={form.preferred_currency || 'USD'} onChange={f('preferred_currency')}><option>USD</option><option>GBP</option><option>EUR</option><option>CAD</option><option>JPY</option><option>SEK</option><option>KYD</option><option>TTD</option></select></div></div>
          <div className="form-row"><div className="form-group"><label>Birthday</label><input className="input" type="date" value={form.birthday || ''} onChange={f('birthday')} /></div><div className="form-group"><label>Anniversary</label><input className="input" type="date" value={form.anniversary_date || ''} onChange={f('anniversary_date')} /></div></div>
        </div>
        <div className="card card-elevated">
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, marginBottom: 16 }}>Preferences & VIP Status</div>
          <div className="form-row"><div className="form-group"><label>VIP Tier</label><select className="select" value={form.vip_tier || 'standard'} onChange={f('vip_tier')}><option value="standard">Standard</option><option value="silver">Silver</option><option value="gold">Gold</option><option value="platinum">Platinum</option></select></div><div className="form-group"><label>Discretion Level</label><select className="select" value={form.discretion_level || 'standard'} onChange={f('discretion_level')}><option value="standard">Standard</option><option value="high">High</option><option value="maximum">Maximum</option></select></div></div>
          <div className="form-group"><label>Dietary Requirements</label><input className="input" value={form.dietary_requirements || ''} onChange={f('dietary_requirements')} /></div>
          <div className="form-group"><label>Allergies</label><input className="input" value={form.allergies || ''} onChange={f('allergies')} /></div>
          <div className="form-row"><div className="form-group"><label>Pillow Preference</label><input className="input" value={form.pillow_preference || ''} onChange={f('pillow_preference')} /></div><div className="form-group"><label>Room Temperature (°C)</label><input className="input" type="number" step="0.5" value={form.room_temperature || ''} onChange={f('room_temperature')} /></div></div>
          <div className="form-group"><label>Arrival Preference</label><input className="input" value={form.arrival_preference || ''} onChange={f('arrival_preference')} /></div>
          <div className="form-group"><label>Concierge Notes</label><textarea className="input" rows={5} value={form.notes || ''} onChange={f('notes')} /></div>
        </div>
      </div>
    </>
  )
}
