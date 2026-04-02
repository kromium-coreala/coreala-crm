import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { Plus, FileText, Eye, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

const PACKAGES = [
  {
    id: 'intimate',
    name: 'The Intimate Collection',
    base_usd: 8500,
    desc: 'Perfect for 2–25 guests. Private ceremony site, butler service, curated dining.',
    includes: ['Private ceremony area (4 hours)', 'Dedicated butler & concierge', 'Curated 3-course dinner', 'Fresh floral centrepiece', 'Welcome champagne & canapes', 'Complimentary suite night'],
  },
  {
    id: 'caribbean_sunset',
    name: 'The Caribbean Sunset Collection',
    base_usd: 22000,
    desc: 'Signature package for 25–80 guests. Beach ceremony, pavilion reception, full coordination.',
    includes: ['Private beach ceremony (2 hours)', 'Oceanfront pavilion reception (6 hours)', 'Caribbean-fusion 3-course dinner', 'Bar setup & cocktail hour', 'Tables, chairs, linens (choice of colours)', 'Ambient lighting & décor', 'Personal event coordinator'],
  },
  {
    id: 'grand_buyout',
    name: 'The Grand Buyout',
    base_usd: 65000,
    desc: 'Exclusive full-property buyout for up to 60 guests. All venues, all staff, all services.',
    includes: ['Exclusive use of entire property', 'All 18 suites + 6 villas', 'Private chef & culinary team', 'Unlimited spa access for all guests', 'Dedicated vehicles & drivers', 'Full event coordination team', 'Yacht charter (half-day)', 'Custom entertainment programme'],
  },
]

const ADDONS = [
  { id: 'steel_pan',   name: 'Steel Pan Band (ceremony)',   price: 800 },
  { id: 'dj',          name: 'DJ (5 hours)',                price: 1500 },
  { id: 'live_band',   name: 'Live Band (4 hours)',         price: 3200 },
  { id: 'photography', name: 'Photography (8 hours)',       price: 3500 },
  { id: 'videography', name: 'Videography — highlight reel',price: 2800 },
  { id: 'florals_arch',name: 'Ceremony arch florals',       price: 1200 },
  { id: 'centerpieces',name: 'Centrepieces (10 tables)',    price: 1800 },
  { id: 'bouquet',     name: 'Bridal bouquet + 4 bridesmaids',price: 650 },
  { id: 'champagne',   name: 'Dom Pérignon toast upgrade',  price: 400 },
  { id: 'signature_cocktail', name: 'Signature cocktail station', price: 350 },
  { id: 'photo_booth', name: 'Photo booth (3 hours)',       price: 950 },
  { id: 'yacht_half',  name: 'Yacht charter (half-day)',    price: 2200 },
]

export default function Proposals() {
  const [proposals, setProposals] = useState<any[]>([])
  const [leads, setLeads]         = useState<any[]>([])
  const [tab, setTab]             = useState<'list' | 'create'>('list')
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [selectedPkg, setSelectedPkg]   = useState(PACKAGES[1])
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [discount, setDiscount]   = useState(0)
  const [notes, setNotes]         = useState('')
  const [preview, setPreview]     = useState<any>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: p }, { data: l }] = await Promise.all([
      supabase.from('event_proposals')
        .select('*, lead:inquiry_leads(first_name, last_name, email, event_type, event_date, guest_count)')
        .order('created_at', { ascending: false }),
      supabase.from('inquiry_leads')
        .select('id, first_name, last_name, email, event_type, event_date, guest_count, budget_range, lead_score, lead_tier')
        .in('lead_tier', ['hot','warm'])
        .in('status', ['new','contacted','tour_scheduled','tour_completed'])
        .order('lead_score', { ascending: false }),
    ])
    setProposals(p ?? [])
    setLeads(l ?? [])
    setLoading(false)
  }

  const addonTotal  = selectedAddons.reduce((s, id) => s + (ADDONS.find(a => a.id === id)?.price ?? 0), 0)
  const subtotal    = selectedPkg.base_usd + addonTotal
  const discountAmt = Math.round(subtotal * (discount / 100))
  const total       = subtotal - discountAmt
  const deposit     = Math.round(total * 0.30)

  function toggleAddon(id: string) {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  async function generateProposal() {
    if (!selectedLead) return
    setSaving(true)
    const addonsData = selectedAddons.map(id => {
      const a = ADDONS.find(a => a.id === id)
      return { id, name: a?.name, price: a?.price }
    })
    const { data } = await supabase.from('event_proposals').insert({
      lead_id:      selectedLead.id,
      package_name: selectedPkg.name,
      add_ons:      addonsData,
      total_usd:    total,
      deposit_usd:  deposit,
      notes:        notes || null,
    }).select().single()

    setSaving(false)
    if (data) setPreview({ ...data, lead: selectedLead, package: selectedPkg, addons: addonsData, total, deposit, discountAmt })
    load()
    setTab('list')
  }

  async function markSent(id: string) {
    await supabase.from('event_proposals').update({ sent_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  async function markAccepted(id: string) {
    await supabase.from('event_proposals').update({ accepted_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const stats = {
    total:    proposals.length,
    sent:     proposals.filter(p => p.sent_at).length,
    accepted: proposals.filter(p => p.accepted_at).length,
    value:    proposals.filter(p => p.accepted_at).reduce((s, p) => s + (p.total_usd ?? 0), 0),
  }

  return (
    <>
      <Head><title>Proposals — Coraléa CRM</title></Head>

      <div className="page-header-row">
        <div>
          <div className="page-eyebrow">Lead Generation</div>
          <div className="page-title">Event <em>Proposals</em></div>
          <div className="page-subtitle">{stats.total} proposals · {stats.accepted} accepted</div>
        </div>
        <button className="btn btn-primary" onClick={() => setTab(tab === 'create' ? 'list' : 'create')}>
          <Plus size={13} /> {tab === 'create' ? 'View All' : 'New Proposal'}
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="card card-elevated">
          <div className="card-label">Total Generated</div>
          <div className="card-value" style={{ color: 'var(--gold)' }}>{stats.total}</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Sent to Leads</div>
          <div className="card-value">{stats.sent}</div>
          <div className="card-sub">{stats.total > 0 ? Math.round((stats.sent/stats.total)*100) : 0}% sent rate</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Accepted</div>
          <div className="card-value" style={{ color: 'var(--status-in)' }}>{stats.accepted}</div>
          <div className="card-sub">{stats.sent > 0 ? Math.round((stats.accepted/stats.sent)*100) : 0}% close rate</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Revenue Won</div>
          <div className="card-value-md" style={{ color: 'var(--status-in)' }}>{formatCurrency(stats.value, 'USD')}</div>
        </div>
      </div>

      {tab === 'create' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>

          {/* Left: lead + package selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-elevated">
              <div className="card-label" style={{ marginBottom: 12 }}>Select Lead</div>
              <select className="select" value={selectedLead?.id ?? ''}
                onChange={e => setSelectedLead(leads.find(l => l.id === e.target.value) ?? null)}>
                <option value="">Choose a qualified lead…</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.first_name} {l.last_name} — {(l.event_type ?? 'event').replace(/_/g,' ')} · Score {l.lead_score}
                  </option>
                ))}
              </select>
              {selectedLead && (
                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  {[
                    ['Event', (selectedLead.event_type ?? '—').replace(/_/g,' ')],
                    ['Date',  selectedLead.event_date ? format(parseISO(selectedLead.event_date), 'dd MMM yyyy') : 'Flexible'],
                    ['Guests', selectedLead.guest_count ?? '—'],
                    ['Budget', selectedLead.budget_range?.replace(/_/g,' ') ?? '—'],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
                      <div style={{ fontSize: 12, textTransform: 'capitalize' }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card card-elevated">
              <div className="card-label" style={{ marginBottom: 12 }}>Select Package</div>
              {PACKAGES.map(pkg => (
                <div key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  style={{
                    padding: '14px 16px', marginBottom: 8, cursor: 'pointer',
                    border: `1px solid ${selectedPkg.id === pkg.id ? 'var(--gold)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: selectedPkg.id === pkg.id ? 'var(--gold-glow)' : 'transparent',
                    transition: 'all 150ms',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 16, fontStyle: 'italic', color: selectedPkg.id === pkg.id ? 'var(--gold-light)' : 'var(--text-primary)' }}>
                      {pkg.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--gold)', flexShrink: 0, marginLeft: 12 }}>
                      {formatCurrency(pkg.base_usd, 'USD')}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{pkg.desc}</div>
                </div>
              ))}
            </div>

            <div className="card card-elevated">
              <div className="card-label" style={{ marginBottom: 12 }}>Add-Ons</div>
              <div className='addon-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {ADDONS.map(addon => (
                  <div key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    style={{
                      padding: '10px 12px', cursor: 'pointer',
                      border: `1px solid ${selectedAddons.includes(addon.id) ? 'var(--gold)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: selectedAddons.includes(addon.id) ? 'var(--gold-glow)' : 'transparent',
                      transition: 'all 150ms',
                    }}>
                    <div style={{ fontSize: 11, color: selectedAddons.includes(addon.id) ? 'var(--gold-light)' : 'var(--text-secondary)', marginBottom: 2 }}>
                      {addon.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gold)', fontFamily: 'var(--font-editorial)' }}>
                      ${addon.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: summary + generate */}
          <div className='card card-elevated detail-panel' style={{ position: 'sticky', top: 16 }}>
            <div className="card-label" style={{ marginBottom: 14 }}>Proposal Summary</div>

            {selectedLead ? (
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: 16 }}>
                For {selectedLead.first_name} {selectedLead.last_name}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>Select a lead to continue</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <div className="flex-between" style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{selectedPkg.name}</span>
                <span>{formatCurrency(selectedPkg.base_usd, 'USD')}</span>
              </div>
              {selectedAddons.map(id => {
                const a = ADDONS.find(a => a.id === id)!
                return (
                  <div key={id} className="flex-between" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>+ {a.name}</span>
                    <span>${a.price.toLocaleString()}</span>
                  </div>
                )
              })}
              <hr style={{ borderColor: 'var(--border-subtle)', margin: '6px 0' }} />
              <div className="flex-between" style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>{formatCurrency(subtotal, 'USD')}</span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Early Booking Discount (%)</label>
                <input className="input" type="number" min={0} max={30} value={discount}
                  onChange={e => setDiscount(Number(e.target.value))} />
              </div>

              {discount > 0 && (
                <div className="flex-between" style={{ fontSize: 12, color: 'var(--status-in)' }}>
                  <span>Early booking discount</span>
                  <span>−{formatCurrency(discountAmt, 'USD')}</span>
                </div>
              )}
              <hr style={{ borderColor: 'var(--border-mid)', margin: '4px 0' }} />
              <div className="flex-between">
                <span style={{ fontWeight: 600, fontSize: 14 }}>Total Investment</span>
                <span style={{ fontFamily: 'var(--font-editorial)', fontSize: 24, color: 'var(--gold)', fontStyle: 'italic' }}>
                  {formatCurrency(total, 'USD')}
                </span>
              </div>
            </div>

            {/* Payment schedule */}
            <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Payment Schedule</div>
              {[
                ['Deposit (30%)',       Math.round(total * 0.30)],
                ['Second (40%)',        Math.round(total * 0.40)],
                ['Final balance (30%)', Math.round(total * 0.30)],
              ].map(([label, amount]) => (
                <div key={label as string} className="flex-between" style={{ padding: '5px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color: 'var(--gold)' }}>{formatCurrency(amount as number, 'USD')}</span>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Special inclusions, personalised message…" />
            </div>

            <button className="btn btn-primary w-full" disabled={!selectedLead || saving} onClick={generateProposal}>
              <FileText size={13} /> {saving ? 'Generating…' : 'Generate Proposal'}
            </button>
          </div>
        </div>
      )}

      {tab === 'list' && (
        <div className="card card-elevated">
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Lead</th><th>Package</th><th>Total</th><th className="hide-mobile">Deposit</th>
                <th className="hide-mobile">Generated</th><th>Sent</th><th>Accepted</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {loading && Array.from({ length: 4 }).map((_,i) => (
                  <tr key={i}><td colSpan={8}><div className="skeleton" style={{ height: 40 }} /></td></tr>
                ))}
                {proposals.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>
                        {p.lead?.first_name} {p.lead?.last_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {(p.lead?.event_type ?? '—').replace(/_/g,' ')}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 180 }}>{p.package_name}</td>
                    <td style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--gold)', fontStyle: 'italic' }}>
                      {p.total_usd ? formatCurrency(p.total_usd, 'USD') : '—'}
                    </td>
                    <td className='hide-mobile' style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {p.deposit_usd ? formatCurrency(p.deposit_usd, 'USD') : '—'}
                    </td>
                    <td className='hide-mobile' style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {format(parseISO(p.created_at), 'dd MMM yyyy')}
                    </td>
                    <td>
                      {p.sent_at
                        ? <span className="badge badge-completed"><Check size={9} /> Sent</span>
                        : <button className="btn btn-ghost btn-sm" onClick={() => markSent(p.id)}><Eye size={11} /> Mark Sent</button>
                      }
                    </td>
                    <td>
                      {p.accepted_at
                        ? <span className="badge badge-completed"><Check size={9} /> Won</span>
                        : p.sent_at
                          ? <button className="btn btn-ghost btn-sm" onClick={() => markAccepted(p.id)}>Mark Won</button>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      }
                    </td>
                    <td>
                      <a href={`mailto:${p.lead?.email}?subject=Your Coraléa Event Proposal&body=Dear ${p.lead?.first_name},%0D%0A%0D%0APlease find your personalised event proposal attached.%0D%0A%0D%0ATotal Investment: ${p.total_usd ? formatCurrency(p.total_usd, 'USD') : ''}%0D%0ADeposit Required: ${p.deposit_usd ? formatCurrency(p.deposit_usd, 'USD') : ''}%0D%0A%0D%0AThis proposal is valid for 48 hours.%0D%0A%0D%0AKind regards,%0D%0ACoraléa Events Team`}
                        className="btn btn-ghost btn-sm">
                        <FileText size={11} /> Email
                      </a>
                    </td>
                  </tr>
                ))}
                {!loading && proposals.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    No proposals yet — create your first above
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
