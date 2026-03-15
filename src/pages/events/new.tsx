import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'
import { CURRENCIES, CurrencyCode } from '@/lib/currency'
import toast from 'react-hot-toast'

export default function NewEvent() {
  const router = useRouter()
  const [form, setForm] = useState({ name:'', event_type:'private_dinner', date:'', guest_count:10, contact_name:'', contact_email:'', contact_phone:'', budget:'', currency:'USD' as CurrencyCode, status:'enquiry', notes:'' })
  const [saving, setSaving] = useState(false)
  const f = (k:string) => (v:any) => setForm(p=>({...p,[k]:v.target?.value??v}))
  async function save() {
    if (!form.name||!form.date||!form.contact_name||!form.contact_email) return toast.error('Name, date and contact required')
    setSaving(true)
    const {error} = await supabase.from('events').insert({...form,guest_count:Number(form.guest_count),budget:form.budget?Number(form.budget):null})
    if (error) { toast.error(error.message); setSaving(false) }
    else { toast.success('Event created'); router.push('/events') }
  }
  return (
    <>
      <Head><title>New Event — Coraléa CRM</title></Head>
      <div style={{marginBottom:24}}>
        <Link href="/events" className="btn btn-ghost btn-sm" style={{marginBottom:16}}><ArrowLeft size={13}/>Back</Link>
        <div className="page-header" style={{marginBottom:0,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><div className="page-eyebrow">Occasions</div><div className="page-title">New <em>Event</em></div></div>
          <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={13}/>{saving?'Saving…':'Create Event'}</button>
        </div>
      </div>
      <div className="grid-2">
        <div className="card card-elevated">
          <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Event Details</div>
          <div className="form-group"><label>Event Name</label><input className="input" placeholder="e.g. Hartfield New Year Dinner" value={form.name} onChange={f('name')}/></div>
          <div className="form-row"><div className="form-group"><label>Type</label><select className="select" value={form.event_type} onChange={f('event_type')}><option value="private_dinner">Private Dinner</option><option value="wedding">Wedding</option><option value="anniversary">Anniversary</option><option value="corporate">Corporate</option><option value="birthday">Birthday</option><option value="other">Other</option></select></div><div className="form-group"><label>Status</label><select className="select" value={form.status} onChange={f('status')}><option value="enquiry">Enquiry</option><option value="planning">Planning</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div></div>
          <div className="form-row"><div className="form-group"><label>Date</label><input className="input" type="date" value={form.date} onChange={f('date')}/></div><div className="form-group"><label>Guest Count</label><input className="input" type="number" min={1} max={60} value={form.guest_count} onChange={f('guest_count')}/></div></div>
          <div className="form-row"><div className="form-group"><label>Budget</label><input className="input" type="number" value={form.budget} onChange={f('budget')}/></div><div className="form-group"><label>Currency</label><select className="select" value={form.currency} onChange={f('currency')}>{Object.keys(CURRENCIES).map(c=><option key={c}>{c}</option>)}</select></div></div>
          <div className="form-group" style={{marginBottom:0}}><label>Notes</label><textarea className="input" rows={4} value={form.notes} onChange={f('notes')}/></div>
        </div>
        <div className="card card-elevated">
          <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Contact Details</div>
          <div className="form-group"><label>Contact Name</label><input className="input" value={form.contact_name} onChange={f('contact_name')}/></div>
          <div className="form-group"><label>Contact Email</label><input className="input" type="email" value={form.contact_email} onChange={f('contact_email')}/></div>
          <div className="form-group"><label>Contact Phone</label><input className="input" value={form.contact_phone} onChange={f('contact_phone')}/></div>
        </div>
      </div>
    </>
  )
}
