import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO } from 'date-fns'
import { Plus, Sparkles, ChevronRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import toast from 'react-hot-toast'

const EXP_TYPES = ['all', 'yacht_charter', 'spa_treatment', 'dining', 'excursion', 'wellness', 'event', 'other']
const COLORS = ['#c4a882', '#8a6e3e', '#b8965a', '#dfc9a8', '#6a8e7a', '#4a6a8e', '#8e4a4a']

export default function Experiences() {
  const [experiences, setExperiences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [pieData, setPieData] = useState<any[]>([])

  useEffect(() => { load() }, [typeFilter])

  async function load() {
    setLoading(true)
    let query = supabase.from('experiences')
      .select('*, guests(first_name, last_name)')
      .order('date', { ascending: false })
    if (typeFilter !== 'all') query = query.eq('experience_type', typeFilter)
    const { data, error } = await query.limit(50)
    if (error) toast.error('Failed to load')
    else {
      setExperiences(data || [])
      // Build pie data from all experiences by type
      const { data: allExp } = await supabase.from('experiences').select('experience_type, amount').eq('status', 'completed')
      const grouped: Record<string, number> = {}
      ;(allExp || []).forEach((e: any) => { grouped[e.experience_type] = (grouped[e.experience_type] || 0) + e.amount })
      setPieData(Object.entries(grouped).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })))
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('experiences').update({ status }).eq('id', id)
    if (error) toast.error('Failed to update')
    else { toast.success('Updated'); load() }
  }

  const totalRevenue = experiences.filter(e => e.status === 'completed').reduce((s, e) => s + e.amount, 0)
  const pendingRevenue = experiences.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0)

  return (
    <>
      <Head><title>Experiences · Coraléa CRM</title></Head>

      <div className="mb-5 animate-fade-up">
        <span className="eyebrow">Revenue</span>
        <h1 className="module-title mt-1">
          <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Experiences</span>
        </h1>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-4">
          <div className="eyebrow mb-2" style={{ fontSize: '8px' }}>Earned</div>
          <div className="stat-number">{formatCurrency(totalRevenue)}</div>
          <div className="font-raleway text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Completed</div>
        </div>
        <div className="card p-4">
          <div className="eyebrow mb-2" style={{ fontSize: '8px', color: '#e0b05a' }}>Pending</div>
          <div className="stat-number" style={{ color: '#e0b05a' }}>{formatCurrency(pendingRevenue)}</div>
          <div className="font-raleway text-xs mt-1" style={{ color: 'var(--text-dim)' }}>To confirm</div>
        </div>
      </div>

      {/* Pie chart */}
      {pieData.length > 0 && (
        <div className="card p-4 mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <span className="eyebrow mb-3 block" style={{ fontSize: '8px' }}>Revenue by Type</span>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--obsidian)', border: '1px solid rgba(196,168,130,0.2)', borderRadius: 0, fontFamily: 'Cinzel', fontSize: 10 }} formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="font-raleway text-xs capitalize" style={{ color: 'var(--text-muted)', flex: 1 }}>{d.name}</span>
                  <span className="font-cormorant italic text-xs" style={{ color: 'var(--sand)' }}>{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {EXP_TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className="flex-shrink-0 font-cinzel text-[8px] px-3 py-1.5 transition-all capitalize"
            style={{
              letterSpacing: '0.25em', border: '1px solid',
              borderColor: typeFilter === t ? 'var(--sand)' : 'var(--border)',
              color: typeFilter === t ? 'var(--sand)' : 'var(--text-dim)',
              background: typeFilter === t ? 'rgba(196,168,130,0.08)' : 'transparent',
            }}>
            {t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-3">
        <Link href="/experiences/new" className="btn-primary"><Plus size={14} /> Add Experience</Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded" />)}</div>
        ) : experiences.length === 0 ? (
          <div className="p-8 text-center">
            <div className="font-cormorant italic text-xl" style={{ color: 'var(--text-dim)' }}>No experiences found</div>
          </div>
        ) : (
          experiences.map((exp, i) => (
            <div key={exp.id} className="p-4 transition-all"
              style={{ borderBottom: i < experiences.length - 1 ? '1px solid rgba(196,168,130,0.06)' : 'none' }}>
              <div className="flex items-start gap-3">
                <Sparkles size={13} style={{ color: 'var(--sand)', flexShrink: 0, marginTop: 3 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{exp.name}</span>
                    <StatusBadge status={exp.status} />
                  </div>
                  <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                    {exp.guests ? (
                      <Link href={`/guests/${exp.guest_id}`} style={{ color: 'var(--sand)', opacity: 0.7 }}>
                        {exp.guests.first_name} {exp.guests.last_name}
                      </Link>
                    ) : 'Unknown guest'} · {format(parseISO(exp.date), 'MMM d, yyyy')}
                  </div>
                  {exp.vendor && (
                    <div className="font-cinzel text-[8px] mt-0.5" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>{exp.vendor}</div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-cormorant italic text-sm" style={{ color: 'var(--sand)' }}>
                    {formatCurrency(exp.amount, exp.currency)}
                  </div>
                </div>
              </div>
              {exp.status === 'pending' && (
                <div className="flex gap-2 mt-3 ml-7">
                  <button onClick={() => updateStatus(exp.id, 'confirmed')} className="btn-ghost" style={{ fontSize: '8px', padding: '4px 12px' }}>Confirm</button>
                  <button onClick={() => updateStatus(exp.id, 'cancelled')} className="btn-danger" style={{ fontSize: '8px', padding: '4px 12px' }}>Cancel</button>
                </div>
              )}
              {exp.status === 'confirmed' && (
                <button onClick={() => updateStatus(exp.id, 'completed')} className="btn-ghost ml-7 mt-3" style={{ fontSize: '8px', padding: '4px 12px' }}>
                  Mark Complete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'badge-success', completed: 'badge-info',
    pending: 'badge-warning', cancelled: 'badge-danger',
  }
  return <span className={`badge ${map[status] || 'badge-sand'}`}>{status}</span>
}
