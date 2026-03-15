import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import toast from 'react-hot-toast'

export default function EventDetail() {
  const router = useRouter()
  const { id } = router.query
  const [event, setEvent] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => { if (id) load() }, [id])
  async function load() {
    const [eRes, tRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('event_tasks').select('*').eq('event_id', id).order('sort_order'),
    ])
    setEvent(eRes.data)
    setTasks(tRes.data || [])
  }
  async function toggleTask(task: any) {
    const status = task.status === 'completed' ? 'pending' : 'completed'
    await supabase.from('event_tasks').update({ status }).eq('id', task.id)
    setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status } : t))
  }

  if (!event) return <div style={{padding:40,color:'var(--text-muted)'}}>Loading…</div>
  const completed = tasks.filter(t => t.status === 'completed').length

  return (
    <>
      <Head><title>{event.name} — Coraléa CRM</title></Head>
      <div style={{marginBottom:24}}>
        <Link href="/events" className="btn btn-ghost btn-sm" style={{marginBottom:16}}><ArrowLeft size={13}/>Back</Link>
        <div className="page-header" style={{marginBottom:0,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div className="page-eyebrow">{event.event_type?.replace('_',' ')} · {format(parseISO(event.date),'dd MMMM yyyy')}</div>
            <div className="page-title">{event.name}</div>
            <div className="page-subtitle">{event.guest_count} guests · {event.contact_name}</div>
          </div>
          <span className={`badge badge-${event.status}`} style={{fontSize:12}}>{event.status}</span>
        </div>
      </div>
      <div className="stat-grid" style={{marginBottom:24}}>
        <div className="card card-elevated"><div className="card-label">Guest Count</div><div className="card-value">{event.guest_count}</div></div>
        <div className="card card-elevated"><div className="card-label">Budget</div><div className="card-value">{event.budget?formatCurrency(event.budget,event.currency||'USD'):'—'}</div></div>
        <div className="card card-elevated"><div className="card-label">Revenue</div><div className="card-value">{event.total_revenue?formatCurrency(event.total_revenue,event.currency||'USD'):'—'}</div></div>
        <div className="card card-elevated"><div className="card-label">Tasks</div><div className="card-value">{completed}/{tasks.length}</div><div className="progress-bar" style={{marginTop:8}}><div className="progress-fill" style={{width:tasks.length?`${(completed/tasks.length)*100}%`:'0%'}}/></div></div>
      </div>
      <div className="grid-2">
        <div className="card card-elevated">
          <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Event Checklist</div>
          {tasks.length === 0 ? <div style={{color:'var(--text-muted)',fontSize:13}}>No tasks yet</div> : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {tasks.map(t=>(
                <div key={t.id} onClick={()=>toggleTask(t)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:t.status==='completed'?'rgba(74,222,128,0.05)':'var(--bg-overlay)',border:`1px solid ${t.status==='completed'?'rgba(74,222,128,0.2)':'var(--border-subtle)'}`,borderRadius:'var(--radius-sm)',cursor:'pointer',transition:'all 150ms'}}>
                  {t.status==='completed' ? <CheckCircle size={15} color="var(--status-in)"/> : <Circle size={15} color="var(--text-muted)"/>}
                  <span style={{fontSize:13,color:t.status==='completed'?'var(--text-muted)':'var(--text-primary)',textDecoration:t.status==='completed'?'line-through':'none',flex:1}}>{t.title}</span>
                  <span style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{t.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card card-elevated">
            <div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:16}}>Contact</div>
            {[{label:'Name',value:event.contact_name},{label:'Email',value:event.contact_email},{label:'Phone',value:event.contact_phone||'—'}].map(({label,value})=>(
              <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border-subtle)',fontSize:13}}>
                <span style={{color:'var(--text-muted)'}}>{label}</span><span>{value}</span>
              </div>
            ))}
          </div>
          {event.notes && <div className="card card-elevated"><div style={{fontFamily:'var(--font-editorial)',fontSize:18,marginBottom:10}}>Notes</div><div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.7}}>{event.notes}</div></div>}
        </div>
      </div>
    </>
  )
}
