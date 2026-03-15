import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { CURRENCIES, CurrencyCode, formatCurrency } from '@/lib/currency'
import { ArrowLeft, Save, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const ROOMS = [...Array.from({length:18},(_,i)=>`S${String(i+1).padStart(2,'0')}`), 'V01','V02','V03','V04','V05','V06']
const ROOM_TYPES: Record<string,string> = { V06:'grand_villa' }
const getType = (r:string) => r.startsWith('V') ? (r==='V06'?'grand_villa':'oceanfront_villa') : 'private_suite'
const BASE_RATES: Record<string,number> = { private_suite:1050, oceanfront_villa:1600, grand_villa:2500 }

export default function NewReservation() {
  const router = useRouter()
  const [guests, setGuests] = useState<any[]>([])
  const [guestSearch, setGuestSearch] = useState('')
  const [form, setForm] = useState({ guest_id:'', room_number:'S01', check_in:'', check_out:'', adults:2, children:0, nightly_rate:1050, currency:'USD' as CurrencyCode, status:'confirmed', arrival_method:'commercial_flight', special_requests:'', occasion:'', concierge_notes:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { supabase.from('guests').select('id,first_name,last_name,vip_tier').order('last_name').then(({data})=>setGuests(data||[])) }, [])

  const filteredGuests = guests.filter(g => `${g.first_name} ${g.last_name}`.toLowerCase().includes(guestSearch.toLowerCase())).slice(0,8)
  const nights = form.check_in && form.check_out ? Math.max(0, Math.round((new Date(form.check_out).getTime()-new Date(form.check_in).getTime())/86400000)) : 0
  const total = nights * form.nightly_rate
  const f = (k:string) => (v:any) => setForm(p=>({...p,[k]:v.target?.value??v}))

  const selectRoom = (r:string) => {
    const t = getType(r)
    setForm(p=>({...p, room_number:r, nightly_rate:BASE_RATES[t]}))
  }

  async function save() {
    if (!form.guest_id || !form.check_in || !form.check_out) return toast.error('Guest, check-in and check-out required')
    setSaving(true)
    const { error } = await supabase.from('reservations').insert({
      ...form, adults:Number(form.adults), children:Number(form.children),
      nightly_rate:Number(form.nightly_rate), total_amount:total,
      accommodation_type:getType(form.room_number), pre_arrival_completed:false,
    })
    if (error) { toast.error(error.message); setSaving(false) }
    else { toast.success('Reservation created'); router.push('/reservations') }
  }

  return (
    <>
      <Head><title>New Reservation — Coraléa CRM</title></Head>
      <div style={{marginBottom:24}}>
        <Link href="/reservations" className="btn btn-ghost btn-sm" style={{marginBottom:16}}><ArrowLeft size={13}/>Back</Link>
        <div className="page-header" style={{marginBottom:0,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><div className="page-eyebrow">Bookings</div><div className="page-title">New <em>Reservation</em></div></div>
          <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={13}/>{saving?'Saving…':'Create Reservation'}</button>
        </div>
      </div>
      <div className="grid-2">
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div className="card card-elevated">
            <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Guest</div>
            <div style={{position:'relative',marginBottom:8}}>
              <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}}/>
              <input className="input" style={{paddingLeft:36}} placeholder="Search guest…" value={guestSearch} onChange={e=>setGuestSearch(e.target.value)}/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:200,overflowY:'auto'}}>
              {filteredGuests.map(g=>(
                <div key={g.id} onClick={()=>{setForm(p=>({...p,guest_id:g.id}));setGuestSearch(`${g.first_name} ${g.last_name}`)}} style={{padding:'8px 12px',background:form.guest_id===g.id?'var(--gold-glow)':'var(--bg-overlay)',border:`1px solid ${form.guest_id===g.id?'var(--gold)':'var(--border-subtle)'}`,borderRadius:'var(--radius-sm)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13,transition:'all 150ms'}}>
                  <span>{g.first_name} {g.last_name}</span>
                  <span className={`badge badge-${g.vip_tier}`} style={{fontSize:9}}>{g.vip_tier}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card card-elevated">
            <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Room Selection</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6}}>
              {ROOMS.map(r=>(
                <button key={r} onClick={()=>selectRoom(r)} style={{padding:'8px 4px',background:form.room_number===r?'var(--gold-glow)':'var(--bg-overlay)',border:`1px solid ${form.room_number===r?'var(--gold)':'var(--border-subtle)'}`,borderRadius:'var(--radius-sm)',cursor:'pointer',fontFamily:'var(--font-display)',fontSize:10,color:form.room_number===r?'var(--gold)':'var(--text-muted)',letterSpacing:'0.08em',transition:'all 150ms'}}>
                  {r}
                </button>
              ))}
            </div>
            <div style={{marginTop:12,padding:'10px 12px',background:'var(--bg-overlay)',borderRadius:'var(--radius-sm)',fontSize:12,color:'var(--text-secondary)'}}>
              Selected: <strong style={{color:'var(--gold)'}}>{form.room_number}</strong> · {getType(form.room_number).replace(/_/g,' ')} · Base rate ${BASE_RATES[getType(form.room_number)].toLocaleString()}/night
            </div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <div className="card card-elevated">
            <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Stay Details</div>
            <div className="form-row"><div className="form-group"><label>Check-in</label><input className="input" type="date" value={form.check_in} onChange={f('check_in')}/></div><div className="form-group"><label>Check-out</label><input className="input" type="date" value={form.check_out} onChange={f('check_out')}/></div></div>
            <div className="form-row"><div className="form-group"><label>Adults</label><input className="input" type="number" min={1} value={form.adults} onChange={f('adults')}/></div><div className="form-group"><label>Children</label><input className="input" type="number" min={0} value={form.children} onChange={f('children')}/></div></div>
            <div className="form-row"><div className="form-group"><label>Nightly Rate</label><input className="input" type="number" value={form.nightly_rate} onChange={f('nightly_rate')}/></div><div className="form-group"><label>Currency</label><select className="select" value={form.currency} onChange={f('currency')}>{Object.keys(CURRENCIES).map(c=><option key={c}>{c}</option>)}</select></div></div>
            <div className="form-row"><div className="form-group"><label>Status</label><select className="select" value={form.status} onChange={f('status')}><option value="enquiry">Enquiry</option><option value="confirmed">Confirmed</option><option value="checked_in">Checked In</option></select></div><div className="form-group"><label>Arrival Method</label><select className="select" value={form.arrival_method} onChange={f('arrival_method')}><option value="commercial_flight">Commercial Flight</option><option value="private_jet">Private Jet</option><option value="yacht">Yacht</option><option value="helicopter">Helicopter</option><option value="other">Other</option></select></div></div>
            {nights > 0 && <div style={{padding:'12px 14px',background:'var(--gold-glow)',borderRadius:'var(--radius-sm)',border:'1px solid var(--border-mid)',marginTop:4}}><span style={{fontSize:12,color:'var(--text-muted)'}}>{nights} nights · </span><strong style={{color:'var(--gold)',fontSize:15}}>{formatCurrency(total, form.currency)}</strong></div>}
          </div>
          <div className="card card-elevated">
            <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Special Requests</div>
            <div className="form-group"><label>Occasion</label><input className="input" placeholder="e.g. Anniversary, Honeymoon…" value={form.occasion} onChange={f('occasion')}/></div>
            <div className="form-group"><label>Special Requests</label><textarea className="input" rows={3} value={form.special_requests} onChange={f('special_requests')}/></div>
            <div className="form-group" style={{marginBottom:0}}><label>Concierge Notes</label><textarea className="input" rows={3} value={form.concierge_notes} onChange={f('concierge_notes')}/></div>
          </div>
        </div>
      </div>
    </>
  )
}
