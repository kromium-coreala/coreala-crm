import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { useDiscretionMode } from '@/components/layout/Sidebar'

export default function ReservationDetail() {
  const router = useRouter()
  const { id } = router.query
  const { discretion } = useDiscretionMode()
  const [res, setRes] = useState<any>(null)

  useEffect(() => {
    if (id) supabase.from('reservations').select('*, guests(*)').eq('id', id).single().then(({data}) => setRes(data))
  }, [id])

  if (!res) return <div style={{padding:40,color:'var(--text-muted)'}}>Loading…</div>
  const g = res.guests
  const nights = Math.round((new Date(res.check_out).getTime()-new Date(res.check_in).getTime())/86400000)
  const gname = () => {
    if (!g) return '—'
    if (discretion && g.discretion_level==='maximum') return '— Confidential —'
    if (discretion && g.discretion_level==='high') return `${g.first_name?.[0]}. ${g.last_name?.[0]}.`
    return `${g.first_name} ${g.last_name}`
  }

  return (
    <>
      <Head><title>Reservation — Coraléa CRM</title></Head>
      <div style={{marginBottom:24}}>
        <Link href="/reservations" className="btn btn-ghost btn-sm" style={{marginBottom:16}}><ArrowLeft size={13}/>Back</Link>
        <div className="page-header" style={{marginBottom:0,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div className="page-eyebrow">{res.room_number} · {res.accommodation_type?.replace(/_/g,' ')}</div>
            <div className="page-title">{gname()}</div>
            <div className="page-subtitle">{format(parseISO(res.check_in),'dd MMM')} → {format(parseISO(res.check_out),'dd MMM yyyy')} · {nights} nights</div>
          </div>
          <span className={`badge badge-${res.status}`} style={{fontSize:12}}>{res.status.replace('_',' ')}</span>
        </div>
      </div>
      <div className="stat-grid" style={{marginBottom:24}}>
        <div className="card card-elevated"><div className="card-label">Room</div><div className="card-value-md" style={{color:'var(--gold)',marginTop:4,fontFamily:'var(--font-display)',letterSpacing:'0.1em'}}>{res.room_number}</div><div className="card-sub">{res.accommodation_type?.replace(/_/g,' ')}</div></div>
        <div className="card card-elevated"><div className="card-label">Nights</div><div className="card-value">{nights}</div><div className="card-sub">{res.adults} adults{res.children>0?` · ${res.children} children`:''}</div></div>
        <div className="card card-elevated"><div className="card-label">Nightly Rate</div><div className="card-value">{formatCurrency(res.nightly_rate,res.currency)}</div><div className="card-sub">{res.currency}</div></div>
        <div className="card card-elevated"><div className="card-label">Total</div><div className="card-value">{formatCurrency(res.total_amount,res.currency)}</div><div className="card-sub">Total booking value</div></div>
      </div>
      <div className="grid-2">
        <div className="card card-elevated">
          <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Booking Details</div>
          {[
            {label:'Guest',value:gname()},
            {label:'Check-in',value:format(parseISO(res.check_in),'EEEE dd MMMM yyyy')},
            {label:'Check-out',value:format(parseISO(res.check_out),'EEEE dd MMMM yyyy')},
            {label:'Arrival Method',value:res.arrival_method?.replace(/_/g,' ')},
            {label:'Occasion',value:res.occasion||'—'},
            {label:'Pre-arrival Complete',value:res.pre_arrival_completed?'Yes':'Pending'},
          ].map(({label,value})=>(
            <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--border-subtle)',fontSize:13}}>
              <span style={{color:'var(--text-muted)'}}>{label}</span>
              <span style={{color:'var(--text-primary)',fontWeight:500,textAlign:'right',maxWidth:'60%',textTransform:'capitalize'}}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {res.special_requests && <div className="card card-elevated"><div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:10}}>Special Requests</div><div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.7}}>{res.special_requests}</div></div>}
          {res.concierge_notes && <div className="card card-elevated"><div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:10}}>Concierge Notes</div><div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.7}}>{res.concierge_notes}</div></div>}
          {g && <div className="card card-elevated"><div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:10}}>Guest Profile</div><Link href={`/guests/${g.id}`} className="btn btn-ghost" style={{width:'100%',justifyContent:'center'}}>View Full Profile</Link></div>}
        </div>
      </div>
    </>
  )
}
