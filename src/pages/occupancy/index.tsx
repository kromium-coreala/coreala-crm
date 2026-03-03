import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO, differenceInDays } from 'date-fns'
import { BedDouble, TrendingUp, Users, Calendar, RefreshCw, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const SUITES = [
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `S${String(i + 1).padStart(2, '0')}`,
    label: `Suite ${String(i + 1).padStart(2, '0')}`,
    type: 'private_suite' as const,
    floor: Math.ceil((i + 1) / 6),
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `V${String(i + 1).padStart(2, '0')}`,
    label: `Villa ${String(i + 1).padStart(2, '0')}`,
    type: i === 5 ? 'grand_villa' as const : 'oceanfront_villa' as const,
    floor: 0,
  })),
]

const RATES: Record<string, number> = {
  private_suite: 950,
  oceanfront_villa: 1600,
  grand_villa: 2500,
}

type OccStatus = 'vacant' | 'occupied' | 'arriving' | 'departing' | 'maintenance'

interface RoomStatus {
  unitId: string
  status: OccStatus
  reservation?: any
  guest?: any
  checkIn?: string
  checkOut?: string
  nights?: number
}

export default function Occupancy() {
  const [rooms, setRooms] = useState<Record<string, RoomStatus>>({})
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const today = format(new Date(), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('reservations')
      .select('*, guests(first_name, last_name, vip_tier, nationality, discretion_level)')
      .in('status', ['confirmed', 'checked_in'])
      .lte('check_in', today)
      .gte('check_out', today)

    if (error) { toast.error('Failed to load occupancy'); setLoading(false); return }

    const { data: arrivingData } = await supabase
      .from('reservations')
      .select('*, guests(first_name, last_name, vip_tier)')
      .eq('check_in', today)
      .eq('status', 'confirmed')

    const { data: departingData } = await supabase
      .from('reservations')
      .select('*, guests(first_name, last_name, vip_tier)')
      .eq('check_out', today)
      .eq('status', 'checked_in')

    // Build room map from reservations (room_number field)
    const roomMap: Record<string, RoomStatus> = {}
    SUITES.forEach(s => { roomMap[s.id] = { unitId: s.id, status: 'vacant' } })

    ;(data || []).forEach(res => {
      const roomNum = res.room_number
      if (roomNum && roomMap[roomNum]) {
        const isArriving = (arrivingData || []).some(a => a.id === res.id)
        const isDeparting = (departingData || []).some(d => d.id === res.id)
        const nights = res.check_in && res.check_out
          ? differenceInDays(parseISO(res.check_out), parseISO(res.check_in)) : 0
        roomMap[roomNum] = {
          unitId: roomNum,
          status: isArriving ? 'arriving' : isDeparting ? 'departing' : 'occupied',
          reservation: res,
          guest: res.guests,
          checkIn: res.check_in,
          checkOut: res.check_out,
          nights,
        }
      }
    })

    setRooms(roomMap)
    setReservations(data || [])
    setLastRefresh(new Date())
    setLoading(false)
  }

  const statusColor: Record<OccStatus, string> = {
    vacant: 'rgba(196,168,130,0.06)',
    occupied: 'rgba(156,58,58,0.18)',
    arriving: 'rgba(74,140,106,0.25)',
    departing: 'rgba(196,149,58,0.25)',
    maintenance: 'rgba(58,106,156,0.2)',
  }
  const statusBorder: Record<OccStatus, string> = {
    vacant: 'rgba(196,168,130,0.12)',
    occupied: 'rgba(156,58,58,0.4)',
    arriving: 'rgba(74,140,106,0.5)',
    departing: 'rgba(196,149,58,0.5)',
    maintenance: 'rgba(58,106,156,0.4)',
  }
  const statusLabel: Record<OccStatus, string> = {
    vacant: 'VACANT',
    occupied: 'OCCUPIED',
    arriving: 'ARRIVING',
    departing: 'DEPARTING',
    maintenance: 'MAINTENANCE',
  }

  const occupied = Object.values(rooms).filter(r => r.status === 'occupied' || r.status === 'departing').length
  const arriving = Object.values(rooms).filter(r => r.status === 'arriving').length
  const departing = Object.values(rooms).filter(r => r.status === 'departing').length
  const vacant = Object.values(rooms).filter(r => r.status === 'vacant').length
  const occupancyRate = Math.round((occupied / 24) * 100)
  const todayRevenue = reservations.reduce((sum, r) => sum + (r.nightly_rate || 0), 0)

  const suites = SUITES.filter(s => s.type === 'private_suite')
  const villas = SUITES.filter(s => s.type !== 'private_suite')

  return (
    <>
      <Head><title>Occupancy · Coraléa CRM</title></Head>

      <div className="flex items-start justify-between mb-5 animate-fade-up">
        <div>
          <span className="eyebrow">Live</span>
          <h1 className="module-title mt-1">
            Occupancy <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Map</span>
          </h1>
          <div className="font-raleway text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {format(new Date(), 'EEEE, MMMM d')} · Updated {format(lastRefresh, 'HH:mm')}
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="p-2 transition-all" style={{ border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-2 mb-4 animate-fade-up">
        {[
          { label: 'Occupancy', value: `${occupancyRate}%`, color: 'var(--sand)' },
          { label: 'Arriving', value: arriving, color: '#6abf8e' },
          { label: 'Departing', value: departing, color: '#e0b05a' },
          { label: 'Vacant', value: vacant, color: 'var(--text-dim)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <div className="font-cormorant italic text-xl" style={{ color }}>{value}</div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="card p-4 mb-4 animate-fade-up">
        <div className="flex items-center justify-between mb-2">
          <span className="eyebrow" style={{ fontSize: '8px' }}>Property Utilisation · 24 Units</span>
          <span className="font-cormorant italic" style={{ color: 'var(--sand)' }}>{formatCurrency(todayRevenue)} / night</span>
        </div>
        <div className="flex h-3 gap-0.5 rounded-sm overflow-hidden" style={{ background: 'var(--surface-3)' }}>
          {['occupied','arriving','departing','vacant'].map(s => {
            const count = Object.values(rooms).filter(r => r.status === s).length
            const pct = (count / 24) * 100
            if (pct === 0) return null
            return (
              <div key={s} style={{ width: `${pct}%`, background: s === 'occupied' ? '#9c3a3a' : s === 'arriving' ? '#4a8c6a' : s === 'departing' ? '#c4953a' : 'var(--surface-3)', transition: 'width 0.5s ease' }} />
            )
          })}
        </div>
        <div className="flex gap-4 mt-2">
          {[
            { label: 'Occupied', color: '#9c3a3a' },
            { label: 'Arriving', color: '#4a8c6a' },
            { label: 'Departing', color: '#c4953a' },
            { label: 'Vacant', color: 'var(--surface-3)' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
              <span className="font-cinzel text-[7px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Villas */}
      <div className="mb-4 animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <span className="eyebrow" style={{ fontSize: '8px' }}>Villas</span>
          <Link href="/reservations/new" className="font-cinzel text-[8px] flex items-center gap-1" style={{ color: 'var(--sand)', letterSpacing: '0.2em' }}>
            <Plus size={11} /> ASSIGN
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {villas.map(unit => {
            const room = rooms[unit.id] || { unitId: unit.id, status: 'vacant' as OccStatus }
            return (
              <RoomCard key={unit.id} unit={unit} room={room}
                statusColor={statusColor} statusBorder={statusBorder} statusLabel={statusLabel} />
            )
          })}
        </div>
      </div>

      {/* Suites by floor */}
      {[1, 2, 3].map(floor => {
        const floorSuites = suites.filter(s => s.floor === floor)
        return (
          <div key={floor} className="mb-4 animate-fade-up">
            <span className="eyebrow mb-3 block" style={{ fontSize: '8px' }}>Floor {floor} · Suites {(floor - 1) * 6 + 1}–{floor * 6}</span>
            <div className="grid grid-cols-3 gap-2">
              {floorSuites.map(unit => {
                const room = rooms[unit.id] || { unitId: unit.id, status: 'vacant' as OccStatus }
                return (
                  <RoomCard key={unit.id} unit={unit} room={room} compact
                    statusColor={statusColor} statusBorder={statusBorder} statusLabel={statusLabel} />
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Today's movement */}
      {(arriving > 0 || departing > 0) && (
        <div className="card mb-4 animate-fade-up">
          <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="eyebrow" style={{ fontSize: '8px' }}>Today's Movement</span>
          </div>
          {Object.values(rooms).filter(r => r.status === 'arriving' || r.status === 'departing').map(room => (
            <Link href={room.reservation ? `/reservations/${room.reservation.id}` : '#'}
              key={room.unitId} className="flex items-center gap-3 p-4 transition-all"
              style={{ borderBottom: '1px solid rgba(196,168,130,0.05)' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: room.status === 'arriving' ? '#4a8c6a' : '#c4953a' }} />
              <div className="flex-1">
                <div className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>
                  {room.guest?.discretion_level === 'maximum' ? '— Confidential Guest —' : `${room.guest?.first_name} ${room.guest?.last_name}`}
                </div>
                <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                  {room.status === 'arriving' ? '↑ Arrival' : '↓ Departure'} · {room.unitId} · {room.nights} nights
                </div>
              </div>
              <VIPBadge tier={room.guest?.vip_tier} />
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-3 mb-8">
        <Link href="/reservations/new" className="btn-primary flex-1 justify-center">
          <Plus size={14} /> New Reservation
        </Link>
        <Link href="/reservations" className="btn-ghost flex-1 text-center">All Bookings</Link>
      </div>
    </>
  )
}

function RoomCard({ unit, room, compact, statusColor, statusBorder, statusLabel }: any) {
  const content = (
    <div className="p-3 transition-all cursor-default"
      style={{
        background: statusColor[room.status],
        border: `1px solid ${statusBorder[room.status]}`,
        minHeight: compact ? 80 : 110,
      }}>
      <div className="flex items-start justify-between mb-1">
        <span className="font-cinzel text-[9px]" style={{ color: 'var(--sand)', letterSpacing: '0.2em' }}>{unit.id}</span>
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
          style={{ background: room.status === 'vacant' ? 'var(--text-dim)' : room.status === 'occupied' ? '#e07070' : room.status === 'arriving' ? '#6abf8e' : '#e0b05a' }} />
      </div>
      {!compact && (
        <div className="font-cinzel text-[7px] mb-2" style={{ color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
          {unit.type.replace(/_/g, ' ').toUpperCase()}
        </div>
      )}
      {room.status !== 'vacant' && room.guest ? (
        <>
          <div className="font-cormorant text-xs leading-tight" style={{ color: 'var(--text-primary)' }}>
            {room.guest.discretion_level === 'maximum' ? '— Confidential —' : `${room.guest.first_name} ${room.guest.last_name[0]}.`}
          </div>
          {!compact && room.checkOut && (
            <div className="font-raleway mt-1" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
              Out: {format(parseISO(room.checkOut), 'MMM d')}
            </div>
          )}
        </>
      ) : (
        <div className="font-cinzel text-[7px] mt-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
          {statusLabel[room.status]}
        </div>
      )}
    </div>
  )

  if (room.reservation) {
    return <Link href={`/reservations/${room.reservation.id}`}>{content}</Link>
  }
  return content
}

function VIPBadge({ tier }: { tier?: string }) {
  const map: Record<string, string> = {
    standard: 'badge badge-sand', silver: 'badge', gold: 'badge badge-warning', platinum: 'badge badge-platinum'
  }
  return <span className={map[tier || 'standard'] || 'badge badge-sand'}>{tier?.slice(0, 4).toUpperCase() || 'STD'}</span>
}
