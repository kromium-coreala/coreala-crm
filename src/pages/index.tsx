import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO, addDays, isWithinInterval, startOfDay } from 'date-fns'
import {
  Users, CalendarDays, TrendingUp, Sparkles,
  ArrowRight, Cake, Gift, Shield, BedDouble
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { useDiscretionMode } from '@/components/layout/Sidebar'

interface DashboardStats {
  totalGuests: number
  activeReservations: number
  monthRevenue: number
  occupancyRate: number
  checkInsToday: number
  checkOutsToday: number
  pendingExperiences: number
  checkedInCount: number
}

export default function Dashboard() {
  const { discretion } = useDiscretionMode()
  const [stats, setStats] = useState<DashboardStats>({
    totalGuests: 0, activeReservations: 0, monthRevenue: 0,
    occupancyRate: 0, checkInsToday: 0, checkOutsToday: 0,
    pendingExperiences: 0, checkedInCount: 0,
  })
  const [recentGuests, setRecentGuests] = useState<any[]>([])
  const [todayReservations, setTodayReservations] = useState<any[]>([])
  const [upcomingDates, setUpcomingDates] = useState<any[]>([])
  const [revenueChart, setRevenueChart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
      const sixMonthsAgo = format(addDays(new Date(), -180), 'yyyy-MM-dd')

      const [guestsRes, reservationsRes, revenueRes, experiencesRes] = await Promise.all([
        supabase.from('guests').select('id', { count: 'exact', head: true }),
        supabase.from('reservations').select('*').in('status', ['confirmed', 'checked_in']),
        supabase.from('revenue_records').select('amount_usd, date').gte('date', monthStart),
        supabase.from('experiences').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])

      const activeRes = reservationsRes.data || []
      const checkedIn = activeRes.filter(r => r.status === 'checked_in')
      const monthRev = (revenueRes.data || []).reduce((sum, r) => sum + (r.amount_usd || 0), 0)

      setStats({
        totalGuests: guestsRes.count || 0,
        activeReservations: activeRes.length,
        monthRevenue: monthRev,
        checkedInCount: checkedIn.length,
        occupancyRate: Math.round((checkedIn.length / 24) * 100),
        checkInsToday: activeRes.filter(r => r.check_in === today).length,
        checkOutsToday: activeRes.filter(r => r.check_out === today).length,
        pendingExperiences: experiencesRes.count || 0,
      })

      // Recent guests
      const { data: guests } = await supabase
        .from('guests')
        .select('id, first_name, last_name, vip_tier, nationality, last_stay, total_revenue')
        .order('last_stay', { ascending: false, nullsFirst: false })
        .limit(6)
      setRecentGuests(guests || [])

      // Today arrivals/departures
      const { data: todayRes } = await supabase
        .from('reservations')
        .select('*, guests(first_name, last_name, vip_tier, discretion_level)')
        .or(`check_in.eq.${today},check_out.eq.${today}`)
        .limit(8)
      setTodayReservations(todayRes || [])

      // Upcoming birthdays & anniversaries (gold + platinum, next 21 days)
      const { data: allGuests } = await supabase
        .from('guests')
        .select('id, first_name, last_name, vip_tier, birthday, anniversary_date, discretion_level')
        .or('birthday.not.is.null,anniversary_date.not.is.null')
        .in('vip_tier', ['gold', 'platinum'])

      const now = startOfDay(new Date())
      const window21 = addDays(now, 21)
      const upcoming: any[] = []
      ;(allGuests || []).forEach(g => {
        const check = (ds: string, type: string) => {
          if (!ds) return
          try {
            const d = parseISO(ds)
            const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate())
            if (isWithinInterval(thisYear, { start: now, end: window21 })) {
              upcoming.push({ guest: g, type, date: thisYear })
            }
          } catch (_) {}
        }
        check(g.birthday, 'birthday')
        check(g.anniversary_date, 'anniversary')
      })
      upcoming.sort((a, b) => a.date - b.date)
      setUpcomingDates(upcoming.slice(0, 6))

      // Revenue chart — last 6 months grouped by month
      const { data: chartData } = await supabase
        .from('revenue_records')
        .select('date, amount_usd, category')
        .gte('date', sixMonthsAgo)
        .order('date', { ascending: true })

      const monthMap: Record<string, number> = {}
      ;(chartData || []).forEach(r => {
        const m = r.date.slice(0, 7)
        monthMap[m] = (monthMap[m] || 0) + (r.amount_usd || 0)
      })
      const chartArr = Object.entries(monthMap).map(([month, total]) => ({
        month: format(parseISO(month + '-01'), 'MMM yy'),
        total,
      }))
      setRevenueChart(chartArr)

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const guestName = (g: any) => {
    if (discretion && g?.discretion_level === 'maximum') return '— Confidential —'
    if (discretion && g?.discretion_level === 'high') {
      return `${g.first_name?.[0] || ''}. ${g.last_name?.[0] || ''}.`
    }
    return `${g?.first_name || ''} ${g?.last_name || ''}`
  }

  const tierDot = (tier: string) => {
    const colors: Record<string, string> = {
      platinum: 'var(--gold)', gold: 'var(--gold-dim)',
      silver: '#94a3b8', standard: 'var(--text-muted)',
    }
    return (
      <span style={{
        display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
        background: colors[tier] || 'var(--text-muted)',
        flexShrink: 0,
      }} />
    )
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-eyebrow">Good {getGreeting()}</div>
          <div className="page-title">Property <em>Overview</em></div>
          <div className="page-subtitle">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
        </div>
        <div className="stat-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 100 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <Head><title>Dashboard — Coraléa CRM</title></Head>

      {/* Page header */}
      <div className="page-header">
        <div className="page-eyebrow">Good {getGreeting()}</div>
        <div className="page-title">Property <em>Overview</em></div>
        <div className="page-subtitle">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
      </div>

      {/* KPI stat row */}
      <div className="stat-grid">
        <div className="card card-elevated">
          <div className="flex-between mb-3">
            <div className="card-label">Live Occupancy</div>
            <div className="card-icon"><BedDouble /></div>
          </div>
          <div className="card-value">{stats.occupancyRate}%</div>
          <div className="progress-bar" style={{ marginTop: 10, marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${stats.occupancyRate}%` }} />
          </div>
          <div className="card-sub">{stats.checkedInCount} of 24 units occupied</div>
        </div>

        <div className="card card-elevated">
          <div className="flex-between mb-3">
            <div className="card-label">Month Revenue</div>
            <div className="card-icon"><TrendingUp /></div>
          </div>
          <div className="card-value">{formatCurrency(stats.monthRevenue, 'USD')}</div>
          <div className="card-sub">{stats.checkInsToday} arriving · {stats.checkOutsToday} departing today</div>
        </div>

        <div className="card card-elevated">
          <div className="flex-between mb-3">
            <div className="card-label">Guest Profiles</div>
            <div className="card-icon"><Users /></div>
          </div>
          <div className="card-value">{stats.totalGuests}</div>
          <div className="card-sub">Intelligence records</div>
        </div>

        <div className="card card-elevated">
          <div className="flex-between mb-3">
            <div className="card-label">Active Bookings</div>
            <div className="card-icon"><CalendarDays /></div>
          </div>
          <div className="card-value">{stats.activeReservations}</div>
          <div className="card-sub">{stats.pendingExperiences} experiences to confirm</div>
        </div>
      </div>

      {/* Main dashboard grid */}
      <div className="dashboard-grid">

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Revenue chart */}
          <div className="card card-elevated">
            <div className="flex-between mb-4">
              <div>
                <div className="card-label">Revenue Trend</div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)' }}>
                  Last 6 Months
                </div>
              </div>
              <Link href="/revenue" className="btn btn-ghost btn-sm">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={42} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 8, fontFamily: 'var(--font-ui)', fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  itemStyle={{ color: 'var(--gold)' }}
                  formatter={(v: any) => [`$${v.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="total" stroke="var(--gold)" strokeWidth={2} fill="url(#goldGrad)" dot={false} activeDot={{ r: 4, fill: 'var(--gold)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Today's movements */}
          <div className="card card-elevated">
            <div className="flex-between mb-4">
              <div>
                <div className="card-label">Today's Movements</div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)' }}>
                  Arrivals & Departures
                </div>
              </div>
              <Link href="/reservations" className="btn btn-ghost btn-sm">
                All Reservations <ArrowRight size={12} />
              </Link>
            </div>
            {todayReservations.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No arrivals or departures today
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Movement</th>
                      <th>Tier</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayReservations.map(r => (
                      <tr key={r.id}>
                        <td>
                          <Link href={`/guests/${r.guest_id}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {guestName(r.guests)}
                          </Link>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.room_number}</td>
                        <td>
                          <span className={`badge badge-${r.check_in === format(new Date(), 'yyyy-MM-dd') ? 'checked_in' : 'checked_out'}`}>
                            {r.check_in === format(new Date(), 'yyyy-MM-dd') ? 'Arriving' : 'Departing'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${r.guests?.vip_tier}`}>
                            {r.guests?.vip_tier}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {r.arrival_method?.replace('_', ' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent guests */}
          <div className="card card-elevated">
            <div className="flex-between mb-4">
              <div>
                <div className="card-label">Recent Guests</div>
                <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)' }}>
                  Guest Intelligence
                </div>
              </div>
              <Link href="/guests" className="btn btn-ghost btn-sm">
                All Guests <ArrowRight size={12} />
              </Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Tier</th>
                    <th>Nationality</th>
                    <th>Last Stay</th>
                    <th>Lifetime Value</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGuests.map(g => (
                    <tr key={g.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {tierDot(g.vip_tier)}
                          <Link href={`/guests/${g.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {guestName(g)}
                          </Link>
                        </div>
                      </td>
                      <td><span className={`badge badge-${g.vip_tier}`}>{g.vip_tier}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{g.nationality}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {g.last_stay ? format(parseISO(g.last_stay), 'dd MMM yyyy') : '—'}
                      </td>
                      <td style={{ color: 'var(--gold)', fontSize: 13 }}>
                        {g.total_revenue ? formatCurrency(g.total_revenue, 'USD') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* VIP upcoming dates */}
          <div className="card card-elevated">
            <div className="card-label mb-3">VIP Dates — Next 21 Days</div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 16 }}>
              Birthdays & Anniversaries
            </div>
            {upcomingDates.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>
                No upcoming VIP dates
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcomingDates.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px',
                    background: 'var(--bg-overlay)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                      background: item.type === 'birthday' ? 'rgba(251,191,36,0.1)' : 'var(--gold-glow)',
                      border: '1px solid var(--border-mid)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {item.type === 'birthday'
                        ? <Cake size={14} color="#fbbf24" />
                        : <Gift size={14} color="var(--gold)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {guestName(item.guest)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {item.type === 'birthday' ? 'Birthday' : 'Anniversary'} · {format(item.date, 'dd MMM')}
                      </div>
                    </div>
                    <span className={`badge badge-${item.guest.vip_tier}`}>{item.guest.vip_tier}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card card-elevated">
            <div className="card-label mb-3">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { href: '/reservations/new', label: 'New Reservation', icon: CalendarDays },
                { href: '/guests/new',       label: 'Add Guest',       icon: Users       },
                { href: '/experiences/new',  label: 'Log Experience',  icon: Sparkles    },
                { href: '/occupancy',        label: 'View Occupancy',  icon: BedDouble   },
                { href: '/investor',         label: 'Investor Portal', icon: TrendingUp  },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px',
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  transition: 'all var(--transition)',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-mid)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                  }}
                >
                  <Icon size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  {label}
                  <ArrowRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Property at a glance */}
          <div className="card card-elevated">
            <div className="card-label mb-3">Property</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'West Coast, Barbados', value: '' },
                { label: '18 Private Suites', value: '' },
                { label: '5 Oceanfront Villas', value: '' },
                { label: '1 Grand Villa', value: '' },
                { label: 'ADR Range', value: '$950 – $2,500' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: 12,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  {value && <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{value}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
