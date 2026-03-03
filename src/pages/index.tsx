import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO, addDays, isWithinInterval, startOfDay } from 'date-fns'
import {
  Users, CalendarDays, TrendingUp, AlertTriangle,
  Sparkles, Heart, ArrowRight, Clock, Star, Cake, Gift, Shield
} from 'lucide-react'
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface DashboardStats {
  totalGuests: number
  activeReservations: number
  todayRevenue: number
  monthRevenue: number
  checkInsToday: number
  checkOutsToday: number
  occupancyRate: number
  pendingExperiences: number
  hurricaneAlert: boolean
}

const SAMPLE_REVENUE = [
  { day: 'Mon', usd: 4200 },
  { day: 'Tue', usd: 6800 },
  { day: 'Wed', usd: 5200 },
  { day: 'Thu', usd: 8900 },
  { day: 'Fri', usd: 11200 },
  { day: 'Sat', usd: 14500 },
  { day: 'Sun', usd: 12800 },
]

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalGuests: 0, activeReservations: 0, todayRevenue: 0,
    monthRevenue: 0, checkInsToday: 0, checkOutsToday: 0,
    occupancyRate: 0, pendingExperiences: 0, hurricaneAlert: false
  })
  const [recentGuests, setRecentGuests] = useState<any[]>([])
  const [todayReservations, setTodayReservations] = useState<any[]>([])
  const [upcomingDates, setUpcomingDates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')

      const [guestsRes, reservationsRes, revenueRes, experiencesRes, hurricaneRes] = await Promise.all([
        supabase.from('guests').select('id', { count: 'exact', head: true }),
        supabase.from('reservations').select('*').in('status', ['confirmed', 'checked_in']),
        supabase.from('revenue_records').select('amount_usd, date').gte('date', monthStart),
        supabase.from('experiences').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('hurricane_alerts').select('id').in('status', ['watch', 'warning', 'active']),
      ])

      const activeRes = reservationsRes.data || []
      const checkIns = activeRes.filter(r => r.check_in === today).length
      const checkOuts = activeRes.filter(r => r.check_out === today).length
      const monthRev = (revenueRes.data || []).reduce((sum, r) => sum + r.amount_usd, 0)
      const todayRev = (revenueRes.data || [])
        .filter(r => r.date === today)
        .reduce((sum: number, r: any) => sum + r.amount_usd, 0)

      setStats({
        totalGuests: guestsRes.count || 0,
        activeReservations: activeRes.length,
        todayRevenue: todayRev,
        monthRevenue: monthRev,
        checkInsToday: checkIns,
        checkOutsToday: checkOuts,
        occupancyRate: Math.round((activeRes.filter(r => r.status === 'checked_in').length / 24) * 100),
        pendingExperiences: experiencesRes.count || 0,
        hurricaneAlert: (hurricaneRes.data || []).length > 0,
      })

      // Recent guests
      const { data: guests } = await supabase
        .from('guests')
        .select('id, first_name, last_name, vip_tier, nationality, last_stay')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentGuests(guests || [])

      // Today's reservations
      const { data: todayRes } = await supabase
        .from('reservations')
        .select('*, guests(first_name, last_name, vip_tier)')
        .or(`check_in.eq.${today},check_out.eq.${today}`)
        .limit(5)
      setTodayReservations(todayRes || [])

      // Upcoming birthdays & anniversaries (next 14 days)
      const { data: allGuests } = await supabase
        .from('guests')
        .select('id, first_name, last_name, vip_tier, birthday, anniversary_date, discretion_level')
        .or('birthday.not.is.null,anniversary_date.not.is.null')
        .in('vip_tier', ['gold', 'platinum'])
      const now = startOfDay(new Date())
      const window14 = addDays(now, 14)
      const upcoming: any[] = []
      ;(allGuests || []).forEach(g => {
        const checkDate = (dateStr: string, type: string) => {
          if (!dateStr) return
          try {
            const d = parseISO(dateStr)
            const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate())
            if (isWithinInterval(thisYear, { start: now, end: window14 })) {
              upcoming.push({ guest: g, type, date: thisYear, dateStr })
            }
          } catch (_) {}
        }
        checkDate(g.birthday, 'birthday')
        checkDate(g.anniversary_date, 'anniversary')
      })
      upcoming.sort((a, b) => a.date - b.date)
      setUpcomingDates(upcoming.slice(0, 5))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, eyebrow, value, label, color = 'var(--sand)', href }: any) => (
    <Link href={href || '#'} className="card p-4 block transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className="eyebrow" style={{ fontSize: '8px' }}>{eyebrow}</span>
        <Icon size={14} style={{ color }} />
      </div>
      <div className="stat-number mb-1" style={{ color }}>{value}</div>
      <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>{label}</div>
    </Link>
  )

  return (
    <>
      <Head><title>Dashboard · Coraléa CRM</title></Head>

      {/* Hurricane alert banner */}
      {stats.hurricaneAlert && (
        <Link href="/hurricane" className="flex items-center gap-3 mb-4 p-3 animate-fade-in"
          style={{ background: 'rgba(156,58,58,0.15)', border: '1px solid rgba(156,58,58,0.4)' }}>
          <AlertTriangle size={16} color="#e07070" className="flex-shrink-0" />
          <div className="flex-1">
            <div className="font-cinzel text-[9px] tracking-widest" style={{ color: '#e07070', letterSpacing: '0.3em' }}>ACTIVE WEATHER ALERT</div>
            <div className="font-raleway text-xs" style={{ color: 'var(--text-muted)' }}>Crisis protocols may be required</div>
          </div>
          <ArrowRight size={14} color="#e07070" />
        </Link>
      )}

      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <span className="eyebrow">Good {getTimeOfDay()}</span>
        <h1 className="module-title mt-1">
          Property <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Overview</span>
        </h1>
        <div className="font-raleway text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {/* Occupancy strip */}
      <div className="card p-4 mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="eyebrow" style={{ fontSize: '8px' }}>Live Occupancy</span>
          <span className="font-cormorant italic text-lg" style={{ color: 'var(--sand)' }}>{stats.occupancyRate}%</span>
        </div>
        <div className="w-full h-1 rounded-full" style={{ background: 'var(--surface-3)' }}>
          <div className="h-1 rounded-full transition-all duration-1000"
            style={{ width: `${stats.occupancyRate}%`, background: 'linear-gradient(90deg, var(--gold-dim), var(--sand))' }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
            {stats.activeReservations} of 24 units
          </span>
          <div className="flex gap-3">
            <span className="font-cinzel text-[8px] tracking-widest" style={{ color: '#6abf8e', letterSpacing: '0.2em' }}>
              ↑ {stats.checkInsToday} IN
            </span>
            <span className="font-cinzel text-[8px] tracking-widest" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
              ↓ {stats.checkOutsToday} OUT
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          icon={TrendingUp} eyebrow="Today's Revenue"
          value={loading ? '...' : formatCurrency(stats.todayRevenue)}
          label="All categories" href="/revenue"
        />
        <StatCard
          icon={TrendingUp} eyebrow="Month Revenue"
          value={loading ? '...' : formatCurrency(stats.monthRevenue)}
          label="Running total" href="/revenue"
          color="var(--sand-light)"
        />
        <StatCard
          icon={Users} eyebrow="Guest Profiles"
          value={loading ? '...' : stats.totalGuests.toLocaleString()}
          label="Intelligence records" href="/guests"
        />
        <StatCard
          icon={Sparkles} eyebrow="Pending"
          value={loading ? '...' : stats.pendingExperiences}
          label="Experiences to confirm" href="/experiences"
          color="#e0b05a"
        />
      </div>

      {/* Revenue sparkline */}
      <div className="card p-4 mb-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Revenue</span>
            <div className="font-cormorant text-base font-light mt-0.5" style={{ color: 'var(--text-primary)' }}>This Week</div>
          </div>
          <Link href="/revenue" className="flex items-center gap-1" style={{ color: 'var(--sand)' }}>
            <span className="font-cinzel text-[9px] tracking-widest" style={{ letterSpacing: '0.25em' }}>VIEW ALL</span>
            <ArrowRight size={12} />
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={SAMPLE_REVENUE}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c4a882" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#c4a882" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: 'rgba(237,232,223,0.3)', fontSize: 9, fontFamily: 'Cinzel' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--obsidian)', border: '1px solid rgba(196,168,130,0.2)', borderRadius: 0, fontFamily: 'Cinzel', fontSize: 10 }}
              formatter={(val: any) => [formatCurrency(val), 'Revenue']}
            />
            <Area type="monotone" dataKey="usd" stroke="var(--sand)" strokeWidth={1.5} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Today's arrivals */}
      {todayReservations.length > 0 && (
        <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="eyebrow" style={{ fontSize: '8px' }}>Today</span>
                <div className="font-cormorant text-base font-light mt-0.5">Arrivals & Departures</div>
              </div>
              <Clock size={14} style={{ color: 'var(--text-dim)' }} />
            </div>
          </div>
          {todayReservations.map((res) => {
            const today = format(new Date(), 'yyyy-MM-dd')
            const isArrival = res.check_in === today
            return (
              <Link href={`/reservations/${res.id}`} key={res.id}
                className="flex items-center gap-3 p-4 transition-all"
                style={{ borderBottom: '1px solid rgba(196,168,130,0.04)' }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: isArrival ? 'var(--success)' : 'var(--warning)' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>
                    {res.guests?.first_name} {res.guests?.last_name}
                  </div>
                  <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                    {isArrival ? '↑ Arrival' : '↓ Departure'} · {res.accommodation_type?.replace(/_/g, ' ')}
                  </div>
                </div>
                <VIPBadge tier={res.guests?.vip_tier} />
              </Link>
            )
          })}
        </div>
      )}

      {/* Recent guests */}
      <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <span className="eyebrow" style={{ fontSize: '8px' }}>Guest Intelligence</span>
              <div className="font-cormorant text-base font-light mt-0.5">Recent Profiles</div>
            </div>
            <Link href="/guests" style={{ color: 'var(--sand)' }}>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded" />)}
          </div>
        ) : recentGuests.length === 0 ? (
          <div className="p-6 text-center">
            <div className="font-cormorant italic" style={{ color: 'var(--text-dim)' }}>No guest profiles yet</div>
            <Link href="/guests/new" className="btn-primary mt-4 inline-flex">Add First Guest</Link>
          </div>
        ) : (
          recentGuests.map((guest) => (
            <Link href={`/guests/${guest.id}`} key={guest.id}
              className="flex items-center gap-3 p-4 transition-all"
              style={{ borderBottom: '1px solid rgba(196,168,130,0.04)' }}>
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <span className="font-cormorant italic" style={{ color: 'var(--sand)', fontSize: '14px' }}>
                  {guest.first_name?.[0]}{guest.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>
                  {guest.first_name} {guest.last_name}
                </div>
                <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>{guest.nationality || 'Guest'}</div>
              </div>
              <VIPBadge tier={guest.vip_tier} />
            </Link>
          ))
        )}
      </div>

      {/* Upcoming special dates */}
      {upcomingDates.length > 0 && (
        <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.32s' }}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Upcoming · Next 14 Days</span>
            <div className="font-cormorant text-base font-light mt-0.5">VIP Special Dates</div>
          </div>
          {upcomingDates.map(({ guest, type, date }, idx) => (
            <Link href={`/guests/${guest.id}`} key={`${guest.id}-${type}`}
              className="flex items-center gap-3 p-4 transition-all"
              style={{ borderBottom: idx < upcomingDates.length - 1 ? '1px solid rgba(196,168,130,0.05)' : 'none' }}>
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                style={{ background: type === 'birthday' ? 'rgba(196,168,130,0.1)' : 'rgba(196,58,58,0.1)', border: '1px solid var(--border)' }}>
                {type === 'birthday' ? <Cake size={13} style={{ color: 'var(--sand)' }} /> : <Heart size={13} style={{ color: '#e07070' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>
                  {guest.discretion_level === 'maximum' ? '— Confidential Guest —' : `${guest.first_name} ${guest.last_name}`}
                </div>
                <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  {type === 'birthday' ? 'Birthday' : 'Anniversary'} · {format(date, 'MMMM d')}
                </div>
              </div>
              <VIPBadge tier={guest.vip_tier} />
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-4 animate-fade-up" style={{ animationDelay: '0.35s' }}>
        <span className="eyebrow mb-3 block" style={{ fontSize: '8px' }}>Quick Actions</span>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/guests/new', label: 'New Guest', icon: Users },
            { href: '/reservations/new', label: 'New Reservation', icon: CalendarDays },
            { href: '/experiences/new', label: 'Add Experience', icon: Sparkles },
            { href: '/events/new', label: 'New Event', icon: Heart },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2 p-3 transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Icon size={13} style={{ color: 'var(--sand)', flexShrink: 0 }} />
              <span className="font-cinzel text-[9px] tracking-widest" style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

function VIPBadge({ tier }: { tier?: string }) {
  const styles: Record<string, string> = {
    standard: 'badge badge-sand',
    silver: 'badge',
    gold: 'badge badge-warning',
    platinum: 'badge badge-platinum',
  }
  return <span className={styles[tier || 'standard'] || 'badge badge-sand'}>{tier || 'STD'}</span>
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
