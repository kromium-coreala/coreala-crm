import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { CURRENCIES, CurrencyCode } from '@/lib/currency'
import { ArrowLeft, Save, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewExperience() {
  const router = useRouter()
  const [guests, setGuests] = useState<any[]>([])
  const [gs, setGs] = useState('')
  const [form, setForm] = useState({ guest_id:'', experience_type:'spa_treatment', name:'', date:'', duration_hours:'', amount:'', currency:'USD' as CurrencyCode, status:'pending', vendor:'', notes:'' })
  const [saving, setSaving] = useState(false)
  useEffect(()=>{ supabase.from('guests').select('id,first_name,last_name,vip_tier').order('last_name').then(({data})=>setGuests(data||[])) },[])
  const filtered = guests.filter(g=>`${g.first_name} ${g.last_name}`.toLowerCase().includes(gs.toLowerCase())).slice(0,8)
  const f = (k:string) => (v:any) => setForm(p=>({...p,[k]:v.target?.value??v}))
  async function save() {
    if (!form.guest_id||!form.name||!form.date||!form.amount) return toast.error('Guest, name, date and amount required')
    setSaving(true)
    const {error} = await supabase.from('experiences').insert({...form,amount:Number(form.amount),duration_hours:form.duration_hours?Number(form.duration_hours):null})
    if (error) { toast.error(error.message); setSaving(false) }
    else { toast.success('Experience logged'); router.push('/experiences') }
  }
  return (
    <>
      <Head><title>Log Experience — Coraléa CRM</title></Head>
      <div style={{marginBottom:24}}>
        <Link href="/experiences" className="btn btn-ghost btn-sm" style={{marginBottom:16}}><ArrowLeft size={13}/>Back</Link>
        <div className="page-header" style={{marginBottom:0,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><div className="page-eyebrow">Revenue</div><div className="page-title">Log <em>Experience</em></div></div>
          <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={13}/>{saving?'Saving…':'Log Experience'}</button>
        </div>
      </div>
      <div className="grid-2">
        <div className="card card-elevated">
          <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Select Guest</div>
          <div style={{position:'relative',marginBottom:8}}><Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/><input className="input" style={{paddingLeft:36}} placeholder="Search guest…" value={gs} onChange={e=>setGs(e.target.value)}/></div>
          <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:200,overflowY:'auto'}}>
            {filtered.map(g=>(
              <div key={g.id} onClick={()=>{setForm(p=>({...p,guest_id:g.id}));setGs(`${g.first_name} ${g.last_name}`)}} style={{padding:'8px 12px',background:form.guest_id===g.id?'var(--gold-glow)':'var(--bg-overlay)',border:`1px solid ${form.guest_id===g.id?'var(--gold)':'var(--border-subtle)'}`,borderRadius:'var(--radius-sm)',cursor:'pointer',display:'flex',justifyContent:'space-between',fontSize:13,transition:'all 150ms'}}>
                <span>{g.first_name} {g.last_name}</span>
                <span className={`badge badge-${g.vip_tier}`} style={{fontSize:9}}>{g.vip_tier}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-elevated">
          <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Experience Details</div>
          <div className="form-row"><div className="form-group"><label>Type</label><select className="select" value={form.experience_type} onChange={f('experience_type')}><option value="spa_treatment">Spa Treatment</option><option value="yacht_charter">Yacht Charter</option><option value="wellness">Wellness</option><option value="dining">Dining</option><option value="excursion">Excursion</option><option value="event">Event</option><option value="other">Other</option></select></div><div className="form-group"><label>Status</label><select className="select" value={form.status} onChange={f('status')}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div></div>
          <div className="form-group"><label>Experience Name</label><input className="input" placeholder="e.g. Caribbean Botanical Massage" value={form.name} onChange={f('name')}/></div>
          <div className="form-row"><div className="form-group"><label>Date</label><input className="input" type="date" value={form.date} onChange={f('date')}/></div><div className="form-group"><label>Duration (hours)</label><input className="input" type="number" step="0.25" value={form.duration_hours} onChange={f('duration_hours')}/></div></div>
          <div className="form-row"><div className="form-group"><label>Amount</label><input className="input" type="number" value={form.amount} onChange={f('amount')}/></div><div className="form-group"><label>Currency</label><select className="select" value={form.currency} onChange={f('currency')}>{Object.keys(CURRENCIES).map(c=><option key={c}>{c}</option>)}</select></div></div>
          <div className="form-group"><label>Vendor / Staff</label><input className="input" placeholder="e.g. Simone Clarke" value={form.vendor} onChange={f('vendor')}/></div>
          <div className="form-group" style={{marginBottom:0}}><label>Notes</label><textarea className="input" rows={3} value={form.notes} onChange={f('notes')}/></div>
        </div>
      </div>
    </>
  )
}
