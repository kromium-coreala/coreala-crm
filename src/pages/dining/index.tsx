import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns'
import { formatCurrency } from '@/lib/currency'
import { Search, Plus, ChevronRight, UtensilsCrossed, Wine, ChefHat, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDiscretionMode } from '@/components/layout/Sidebar'

const LOCATIONS = ['main_restaurant', 'private_terrace', 'beach_dining', 'villa_in_room', 'wine_cellar', 'clifftop']
const MENUS = ['tasting_menu', 'a_la_carte', 'private_chef', 'wine_pairing', 'custom']
const LOCATION_LABELS: Record<string, string> = {
  main_restaurant: 'Main Restaurant', private_terrace: 'Private Terrace',
  beach_dining: 'Beach Dining', villa_in_room: 'In-Villa', wine_cellar: 'Wine Cellar', clifftop: 'Clifftop',
}
const LOCATION_CAPACITY: Record<string, number> = {
  main_restaurant: 30, private_terrace: 12, beach_dining: 8,
  villa_in_room: 6, wine_cellar: 10, clifftop: 6,
}

export default function Dining() {
  const { discretion } = useDiscretionMode()
  const [reservations, setReservations] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])
  const [tab, setTab] = useState<'today' | 'upcoming' | 'history' | 'new'>('today')
  const [loading, setLoading] = useState(true)
  const [gs, setGs] = useState('')
  const [form, setForm] = useState({
    guest_id: '', date: format(new Date(), 'yyyy-MM-dd'), time: '19:30',
    covers: 2, location: 'private_terrace', occasion: '',
    menu_preference: 'tasting_menu', dietary_notes: '', special_setup: '',
    wine_pairing: false, private_chef: false, amount: '', currency: 'USD', concierge_notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [rRes, gRes] = await Promise.all([
      supabase.from('dining_reservations')
        .select('*, guests(first_name, last_name, vip_tier, discretion_level, allergies)')
        .order('date', { ascending: false }).order('time', { ascending: true }),
      supabase.from('guests').select('id, first_name, last_name, vip_tier, dietary_requirements, allergies, discretion_level').order('last_name'),
    ])
    setReservations(rRes.data || [])
    setGuests(gRes.data || [])
    setLoading(false)
  }

  const gname = (g: any) => {
    if (!g) return '—'
    if (discretion && g.discretion_level === 'maximum') return '— Confidential —'
    if (discretion && g.discretion_level === 'high') return `${g.first_name?.[0]}. ${g.last_name?.[0]}.`
    return `${g.first_name} ${g.last_name}`
  }

  const filteredGuests = guests.filter(g =>
    `${g.first_name} ${g.last_name}`.toLowerCase().includes(gs.toLowerCase())
  ).slice(0, 8)

  const selectedGuest = guests.find(g => g.id === form.guest_id)

  const today = reservations.filter(r => r.date === format(new Date(), 'yyyy-MM-dd') && r.status !== 'cancelled')
  const upcoming = reservations.filter(r => {
    const d = new Date(r.date)
    const now = new Date()
    return d > now && r.status !== 'cancelled'
  }).sort((a, b) => a.date.localeCompare(b.date))
  const history = reservations.filter(r => r.status === 'completed' || r.status === 'no_show')

  const stats = {
    totalCovers: today.reduce((s, r) => s + (r.covers || 0), 0),
    bookingsToday: today.length,
    revenue: reservations.filter(r => r.status === 'completed').reduce((s, r) => s + (r.amount || 0), 0),
    upcoming: upcoming.length,
  }

  async function createBooking() {
    if (!form.guest_id || !form.date || !form.time) return toast.error('Guest, date and time required')
    setSaving(true)
    const { error } = await supabase.from('dining_reservations').insert({
      ...form,
      covers: Number(form.covers),
      amount: form.amount ? Number(form.amount) : null,
      wine_pairing: Boolean(form.wine_pairing),
      private_chef: Boolean(form.private_chef),
      status: 'confirmed',
    })
    if (error) { toast.error(error.message); setSaving(false) }
    else { toast.success('Dining reservation confirmed'); setTab('upcoming'); load(); setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('dining_reservations').update({ status }).eq('id', id)
    toast.success(`Marked as ${status}`)
    load()
  }

  const ReservationRow = ({ r }: { r: any }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 16px',
      background: r.status === 'seated' ? 'rgba(74,222,128,0.05)' : 'var(--bg-overlay)',
      border: `1px solid ${r.status === 'seated' ? 'rgba(74,222,128,0.2)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-sm)',
      transition: 'all 150ms',
    }}>
      {/* Time */}
      <div style={{ textAlign: 'center', minWidth: 48, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--gold)', letterSpacing: '0.06em' }}>{r.time}</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 1 }}>{r.covers} cvr</div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 36, background: 'var(--border-subtle)', flexShrink: 0 }} />

      {/* Guest */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{gname(r.guests)}</span>
          {r.guests?.vip_tier && <span className={`badge badge-${r.guests.vip_tier}`} style={{ fontSize: 9 }}>{r.guests.vip_tier}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{LOCATION_LABELS[r.location]}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{r.menu_preference?.replace(/_/g, ' ')}</span>
          {r.wine_pairing && <span style={{ fontSize: 11, color: 'var(--gold)' }}>· Wine pairing</span>}
          {r.private_chef && <span style={{ fontSize: 11, color: '#a78bfa' }}>· Private chef</span>}
        </div>
        {r.dietary_notes && r.dietary_notes !== 'No restrictions' && (
          <div style={{ fontSize: 11, color: '#fb923c', marginTop: 3 }}>⚠ {r.dietary_notes}</div>
        )}
      </div>

      {/* Amount */}
      {r.amount && (
        <div style={{ fontSize: 14, color: 'var(--gold)', fontFamily: 'var(--font-editorial)', flexShrink: 0 }}>
          {formatCurrency(r.amount, r.currency || 'USD')}
        </div>
      )}

      {/* Status + actions */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <span className={`badge badge-${r.status}`}>{r.status}</span>
        {r.status === 'confirmed' && (
          <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(r.id, 'seated')}>Seat</button>
        )}
        {r.status === 'seated' && (
          <button className="btn btn-primary btn-sm" onClick={() => updateStatus(r.id, 'completed')}>Complete</button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <Head><title>Dining — Coraléa CRM</title></Head>

      <div className="page-header">
        <div className="page-eyebrow">Restaurant</div>
        <div className="page-title">Dining <em>Reservations</em></div>
        <div className="page-subtitle">Farm-to-table · Private dining · In-villa chef experiences</div>
      </div>

      {/* KPIs */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="card card-elevated">
          <div className="card-label">Today's Covers</div>
          <div className="card-value">{stats.totalCovers}</div>
          <div className="card-sub">{stats.bookingsToday} reservations today</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Upcoming</div>
          <div className="card-value" style={{ color: 'var(--status-conf)' }}>{stats.upcoming}</div>
          <div className="card-sub">Confirmed bookings</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Dining Revenue</div>
          <div className="card-value">{formatCurrency(stats.revenue, 'USD')}</div>
          <div className="card-sub">All completed sittings</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Venue Capacity</div>
          <div className="card-value">60</div>
          <div className="card-sub">Max private event capacity</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
        {([
          { key: 'today', label: `Today (${today.length})` },
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'history', label: 'History' },
          { key: 'new', label: '+ New Booking' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 20px',
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: tab === t.key ? (t.key === 'new' ? 'var(--gold)' : 'var(--gold)') : 'var(--text-muted)',
            borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 150ms',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Today */}
      {tab === 'today' && (
        <div className="card card-elevated">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 20, color: 'var(--text-primary)' }}>
              {format(new Date(), 'EEEE, MMMM d')}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {LOCATIONS.map(loc => {
                const booked = today.filter(r => r.location === loc).reduce((s, r) => s + (r.covers || 0), 0)
                const cap = LOCATION_CAPACITY[loc]
                if (booked === 0) return null
                return (
                  <div key={loc} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{LOCATION_LABELS[loc]}</div>
                    <div style={{ fontSize: 12, color: booked >= cap ? 'var(--status-cancel)' : 'var(--gold)' }}>{booked}/{cap}</div>
                  </div>
                )
              })}
            </div>
          </div>
          {today.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              No dining reservations for today
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {today.sort((a, b) => a.time.localeCompare(b.time)).map(r => <ReservationRow key={r.id} r={r} />)}
            </div>
          )}
        </div>
      )}

      {/* Upcoming */}
      {tab === 'upcoming' && (
        <div className="card card-elevated">
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>No upcoming reservations</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Group by date */}
              {Array.from(new Set(upcoming.map(r => r.date))).map(date => (
                <div key={date}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
                    {isToday(new Date(date)) ? 'Today' : isTomorrow(new Date(date)) ? 'Tomorrow' : format(parseISO(date), 'EEEE, MMMM d yyyy')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {upcoming.filter(r => r.date === date).map(r => <ReservationRow key={r.id} r={r} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="card card-elevated">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Time</th><th>Guest</th><th className="hide-mobile">Location</th><th className="hide-mobile">Covers</th><th className="hide-mobile">Menu</th><th className="hide-mobile">Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {history.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 12 }}>{format(parseISO(r.date), 'dd MMM yyyy')}</td>
                    <td style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.06em' }}>{r.time}</td>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{gname(r.guests)}</div>
                      {r.guests?.vip_tier && <span className={`badge badge-${r.guests.vip_tier}`} style={{ fontSize: 9 }}>{r.guests.vip_tier}</span>}
                    </td>
                    <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{LOCATION_LABELS[r.location]}</td>
                    <td className='hide-mobile' style={{ fontSize: 13, textAlign: 'center' }}>{r.covers}</td>
                    <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{r.menu_preference?.replace(/_/g, ' ')}</td>
                    <td className='hide-mobile' style={{ color: 'var(--gold)', fontSize: 13 }}>{r.amount ? formatCurrency(r.amount, r.currency || 'USD') : '—'}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New booking form */}
      {tab === 'new' && (
        <div className="grid-2">
          <div className="card card-elevated">
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, marginBottom: 16 }}>Select Guest</div>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: 36 }} placeholder="Search guest…" value={gs} onChange={e => setGs(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}>
              {filteredGuests.map(g => (
                <div key={g.id}
                  onClick={() => { setForm(p => ({ ...p, guest_id: g.id, dietary_notes: g.dietary_requirements || '' })); setGs(`${g.first_name} ${g.last_name}`) }}
                  style={{ padding: '8px 12px', background: form.guest_id === g.id ? 'var(--gold-glow)' : 'var(--bg-overlay)', border: `1px solid ${form.guest_id === g.id ? 'var(--gold)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, transition: 'all 150ms' }}>
                  <div>
                    <span>{g.first_name} {g.last_name}</span>
                    {g.dietary_requirements && g.dietary_requirements !== 'No restrictions' && (
                      <div style={{ fontSize: 10, color: '#fb923c', marginTop: 1 }}>{g.dietary_requirements}</div>
                    )}
                  </div>
                  <span className={`badge badge-${g.vip_tier}`} style={{ fontSize: 9 }}>{g.vip_tier}</span>
                </div>
              ))}
            </div>

            {/* Venue map */}
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 16, marginBottom: 12, color: 'var(--text-primary)' }}>Venue Selection</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
              {LOCATIONS.map(loc => {
                const cap = LOCATION_CAPACITY[loc]
                const bookedToday = reservations.filter(r => r.date === form.date && r.location === loc && r.status !== 'cancelled').reduce((s, r) => s + (r.covers || 0), 0)
                const available = cap - bookedToday
                const selected = form.location === loc
                return (
                  <div key={loc} onClick={() => setForm(p => ({ ...p, location: loc }))}
                    style={{ padding: '10px 12px', background: selected ? 'var(--gold-glow)' : 'var(--bg-overlay)', border: `1px solid ${selected ? 'var(--gold)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 150ms' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: selected ? 'var(--gold)' : 'var(--text-primary)' }}>{LOCATION_LABELS[loc]}</div>
                    <div style={{ fontSize: 10, color: available <= 2 ? 'var(--status-cancel)' : 'var(--text-muted)', marginTop: 2 }}>
                      {available} / {cap} covers available
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card card-elevated">
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, marginBottom: 16 }}>Reservation Details</div>
            <div className="form-row">
              <div className="form-group"><label>Date</label><input className="input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div className="form-group"><label>Time</label><input className="input" type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Covers</label><input className="input" type="number" min={1} max={60} value={form.covers} onChange={e => setForm(p => ({ ...p, covers: Number(e.target.value) }))} /></div>
              <div className="form-group"><label>Occasion</label><input className="input" placeholder="e.g. Anniversary" value={form.occasion} onChange={e => setForm(p => ({ ...p, occasion: e.target.value }))} /></div>
            </div>
            <div className="form-group">
              <label>Menu Preference</label>
              <select className="select" value={form.menu_preference} onChange={e => setForm(p => ({ ...p, menu_preference: e.target.value }))}>
                {MENUS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Dietary Notes</label><input className="input" value={form.dietary_notes} onChange={e => setForm(p => ({ ...p, dietary_notes: e.target.value }))} /></div>
            <div className="form-group"><label>Special Setup</label><input className="input" placeholder="e.g. Flowers on table, low lighting…" value={form.special_setup} onChange={e => setForm(p => ({ ...p, special_setup: e.target.value }))} /></div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: form.wine_pairing ? 'var(--gold-glow)' : 'var(--bg-overlay)', border: `1px solid ${form.wine_pairing ? 'var(--gold)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontWeight: 400, fontSize: 13, color: form.wine_pairing ? 'var(--gold)' : 'var(--text-secondary)', flex: 1, justifyContent: 'center', transition: 'all 150ms' }}>
                <input type="checkbox" checked={form.wine_pairing} onChange={e => setForm(p => ({ ...p, wine_pairing: e.target.checked }))} style={{ accentColor: 'var(--gold)' }} />
                <Wine size={13} /> Wine Pairing
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: form.private_chef ? 'rgba(167,139,250,0.1)' : 'var(--bg-overlay)', border: `1px solid ${form.private_chef ? 'rgba(167,139,250,0.4)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontWeight: 400, fontSize: 13, color: form.private_chef ? '#a78bfa' : 'var(--text-secondary)', flex: 1, justifyContent: 'center', transition: 'all 150ms' }}>
                <input type="checkbox" checked={form.private_chef} onChange={e => setForm(p => ({ ...p, private_chef: e.target.checked }))} style={{ accentColor: '#a78bfa' }} />
                <ChefHat size={13} /> Private Chef
              </label>
            </div>

            <div className="form-row">
              <div className="form-group"><label>Estimated Amount</label><input className="input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div className="form-group"><label>Currency</label><select className="select" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}><option>USD</option><option>GBP</option><option>EUR</option><option>CAD</option></select></div>
            </div>
            <div className="form-group"><label>Concierge Notes</label><textarea className="input" rows={3} value={form.concierge_notes} onChange={e => setForm(p => ({ ...p, concierge_notes: e.target.value }))} /></div>
            <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={createBooking} disabled={saving}>
              <UtensilsCrossed size={13} /> {saving ? 'Booking…' : 'Confirm Dining Reservation'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
