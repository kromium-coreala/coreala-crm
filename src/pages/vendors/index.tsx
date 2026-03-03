import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/currency'
import { format, parseISO } from 'date-fns'
import {
  Plus, Star, MapPin, Phone, Mail, Globe, Package,
  ChevronRight, Search, Filter, Truck, Clock, CheckCircle,
  AlertCircle, X, Save, ArrowLeft, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['all','florist','caterer','entertainment','transport','yacht','spa_supplier','produce','wine_spirits','linen','av_tech','security','photography','other']
const ISLANDS = ['Barbados','Jamaica','Trinidad','Cayman Islands','Saint Lucia','Antigua','Grenada','Other']
const ORDER_STATUSES = ['ordered','in_transit','customs','arrived','delivered','cancelled']

const STATUS_COLORS: Record<string, string> = {
  ordered: 'badge-info',
  in_transit: 'badge-warning',
  customs: 'badge-danger',
  arrived: 'badge-success',
  delivered: 'badge-sand',
  cancelled: 'badge-danger',
}

const STATUS_ICONS: Record<string, any> = {
  ordered: Package,
  in_transit: Truck,
  customs: AlertCircle,
  arrived: CheckCircle,
  delivered: CheckCircle,
  cancelled: X,
}

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'directory' | 'orders' | 'new_vendor' | 'new_order'>('directory')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [vendorForm, setVendorForm] = useState({
    name: '', category: 'florist', island: 'Barbados',
    contact_name: '', email: '', phone: '', website: '',
    preferred: false, rating: 5, import_lead_days: 0,
    currency: 'BBD', notes: '',
  })

  const [orderForm, setOrderForm] = useState({
    vendor_id: '', description: '', amount: '',
    currency: 'USD', order_date: format(new Date(), 'yyyy-MM-dd'),
    expected_arrival: '', status: 'ordered',
    tracking_number: '', origin_island: 'Barbados', notes: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [vRes, oRes] = await Promise.all([
      supabase.from('vendors').select('*').order('preferred', { ascending: false }).order('name'),
      supabase.from('vendor_orders').select('*, vendors(name, category, island)').order('created_at', { ascending: false }).limit(50),
    ])
    setVendors(vRes.data || [])
    setOrders(oRes.data || [])
    setLoading(false)
  }

  async function saveVendor(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('vendors').insert({
        ...vendorForm,
        rating: Number(vendorForm.rating),
        import_lead_days: Number(vendorForm.import_lead_days),
      })
      if (error) throw error
      toast.success('Vendor added')
      setVendorForm({ name: '', category: 'florist', island: 'Barbados', contact_name: '', email: '', phone: '', website: '', preferred: false, rating: 5, import_lead_days: 0, currency: 'BBD', notes: '' })
      setTab('directory')
      load()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function saveOrder(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('vendor_orders').insert({
        ...orderForm,
        amount: orderForm.amount ? Number(orderForm.amount) : null,
        expected_arrival: orderForm.expected_arrival || null,
      })
      if (error) throw error
      toast.success('Order logged')
      setOrderForm({ vendor_id: '', description: '', amount: '', currency: 'USD', order_date: format(new Date(), 'yyyy-MM-dd'), expected_arrival: '', status: 'ordered', tracking_number: '', origin_island: 'Barbados', notes: '' })
      setTab('orders')
      load()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    const updates: any = { status }
    if (status === 'arrived' || status === 'delivered') updates.actual_arrival = format(new Date(), 'yyyy-MM-dd')
    const { error } = await supabase.from('vendor_orders').update(updates).eq('id', orderId)
    if (error) toast.error(error.message)
    else { toast.success('Status updated'); load() }
  }

  async function togglePreferred(vendorId: string, current: boolean) {
    const { error } = await supabase.from('vendors').update({ preferred: !current }).eq('id', vendorId)
    if (error) toast.error(error.message)
    else { load() }
  }

  const filteredVendors = vendors.filter(v => {
    const matchesCat = catFilter === 'all' || v.category === catFilter
    const matchesSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.contact_name?.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const inTransit = orders.filter(o => ['ordered','in_transit','customs'].includes(o.status)).length
  const preferredCount = vendors.filter(v => v.preferred).length
  const activeVendors = new Set(orders.map(o => o.vendor_id)).size

  const Field = ({ label, children }: any) => <div><label className="label-luxury">{label}</label>{children}</div>

  const TABS = [
    { id: 'directory', label: `Directory (${vendors.length})` },
    { id: 'orders', label: `Import Tracking (${inTransit} active)` },
    { id: 'new_vendor', label: '+ Vendor' },
    { id: 'new_order', label: '+ Order' },
  ]

  return (
    <>
      <Head><title>Vendors · Coraléa CRM</title></Head>

      <div className="mb-5 animate-fade-up">
        <span className="eyebrow">Caribbean</span>
        <h1 className="module-title mt-1">
          Vendor <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Logistics</span>
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 mb-4 animate-fade-up">
        {[
          { label: 'Vendors', value: vendors.length },
          { label: 'Preferred', value: preferredCount },
          { label: 'In Transit', value: inTransit, color: inTransit > 0 ? '#e0b05a' : 'var(--sand)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-3 text-center">
            <div className="font-cormorant italic text-xl" style={{ color: color || 'var(--sand)' }}>{value}</div>
            <div className="eyebrow mt-1" style={{ fontSize: '7px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-4 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className="flex-shrink-0 px-3 py-2.5 font-cinzel text-[8px] transition-all"
            style={{
              letterSpacing: '0.2em', border: 'none', background: 'transparent',
              color: tab === t.id ? 'var(--sand)' : 'var(--text-dim)',
              borderBottom: tab === t.id ? '1px solid var(--sand)' : '1px solid transparent',
              marginBottom: '-1px',
            }}>
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* DIRECTORY */}
      {tab === 'directory' && (
        <div className="animate-fade-in">
          <div className="flex gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 px-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <Search size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
              <input className="flex-1 bg-transparent py-2.5 font-raleway text-sm outline-none"
                style={{ color: 'var(--text-primary)' }} placeholder="Search vendors..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className="flex-shrink-0 font-cinzel text-[8px] px-3 py-1.5 transition-all capitalize"
                style={{
                  letterSpacing: '0.2em', border: '1px solid',
                  borderColor: catFilter === c ? 'var(--sand)' : 'var(--border)',
                  color: catFilter === c ? 'var(--sand)' : 'var(--text-dim)',
                  background: catFilter === c ? 'rgba(196,168,130,0.08)' : 'transparent',
                }}>
                {c.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded" />)}</div>
          ) : filteredVendors.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="font-cormorant italic text-xl" style={{ color: 'var(--text-dim)' }}>No vendors found</div>
              <button onClick={() => setTab('new_vendor')} className="btn-primary mt-4 mx-auto flex items-center gap-2">
                <Plus size={14} /> Add First Vendor
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVendors.map(vendor => (
                <div key={vendor.id} className="card p-4 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-cormorant text-base" style={{ color: 'var(--text-primary)' }}>{vendor.name}</span>
                        {vendor.preferred && (
                          <span className="badge badge-warning" style={{ fontSize: '7px' }}>PREFERRED</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="font-cinzel text-[8px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
                          {vendor.category?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span style={{ color: 'var(--text-dim)' }}>·</span>
                        <span className="flex items-center gap-1 font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                          <MapPin size={10} /> {vendor.island}
                        </span>
                        {vendor.import_lead_days > 0 && (
                          <>
                            <span style={{ color: 'var(--text-dim)' }}>·</span>
                            <span className="flex items-center gap-1 font-raleway text-xs" style={{ color: '#e0b05a' }}>
                              <Clock size={10} /> {vendor.import_lead_days}d lead
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={9} fill={s <= (vendor.rating || 0) ? 'var(--sand)' : 'none'} style={{ color: 'var(--sand)' }} />
                        ))}
                      </div>
                      <button onClick={() => togglePreferred(vendor.id, vendor.preferred)} className="p-1 transition-all" style={{ color: vendor.preferred ? 'var(--sand)' : 'var(--text-dim)' }}>
                        <Star size={14} fill={vendor.preferred ? 'var(--sand)' : 'none'} />
                      </button>
                    </div>
                  </div>

                  {vendor.contact_name && (
                    <div className="font-raleway text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{vendor.contact_name}</div>
                  )}

                  <div className="flex gap-3 flex-wrap">
                    {vendor.email && (
                      <a href={`mailto:${vendor.email}`} className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                        <Mail size={11} /> <span className="font-raleway text-xs">{vendor.email}</span>
                      </a>
                    )}
                    {vendor.phone && (
                      <a href={`tel:${vendor.phone}`} className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                        <Phone size={11} /> <span className="font-raleway text-xs">{vendor.phone}</span>
                      </a>
                    )}
                    {vendor.website && (
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5" style={{ color: 'var(--sand)' }}>
                        <ExternalLink size={11} /> <span className="font-raleway text-xs">Website</span>
                      </a>
                    )}
                  </div>

                  {vendor.notes && (
                    <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(196,168,130,0.08)' }}>
                      <p className="font-raleway text-xs" style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>{vendor.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-3 pt-2" style={{ borderTop: '1px solid rgba(196,168,130,0.06)' }}>
                    {vendor.last_used && (
                      <span className="font-cinzel text-[7px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>
                        LAST USED {format(parseISO(vendor.last_used), 'MMM d, yyyy').toUpperCase()}
                      </span>
                    )}
                    <button onClick={() => { setOrderForm(p => ({ ...p, vendor_id: vendor.id, origin_island: vendor.island })); setTab('new_order') }}
                      className="font-cinzel text-[8px] ml-auto flex items-center gap-1" style={{ color: 'var(--sand)', letterSpacing: '0.2em' }}>
                      <Package size={11} /> LOG ORDER
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* IMPORT TRACKING */}
      {tab === 'orders' && (
        <div className="animate-fade-in">
          {/* Active shipments */}
          {inTransit > 0 && (
            <div className="mb-4">
              <span className="eyebrow mb-3 block" style={{ fontSize: '8px' }}>Active Shipments</span>
              <div className="card">
                {orders.filter(o => ['ordered','in_transit','customs'].includes(o.status)).map((order, i, arr) => {
                  const Icon = STATUS_ICONS[order.status] || Package
                  return (
                    <div key={order.id} className="p-4" style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(196,168,130,0.06)' : 'none' }}>
                      <div className="flex items-start gap-3">
                        <Icon size={14} style={{ color: order.status === 'customs' ? '#e07070' : '#e0b05a', flexShrink: 0, marginTop: 2 }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{order.description}</span>
                            <span className={`badge ${STATUS_COLORS[order.status]}`}>{order.status.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                            {order.vendors?.name} · From {order.origin_island}
                          </div>
                          {order.expected_arrival && (
                            <div className="font-raleway text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                              Expected {format(parseISO(order.expected_arrival), 'MMM d, yyyy')}
                            </div>
                          )}
                          {order.tracking_number && (
                            <div className="font-cinzel text-[8px] mt-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
                              REF: {order.tracking_number}
                            </div>
                          )}
                        </div>
                        {order.amount && (
                          <span className="font-cormorant italic text-sm flex-shrink-0" style={{ color: 'var(--sand)' }}>
                            {formatCurrency(order.amount, order.currency)}
                          </span>
                        )}
                      </div>
                      {/* Status update buttons */}
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {ORDER_STATUSES.filter(s => s !== order.status && s !== 'cancelled').map(s => (
                          <button key={s} onClick={() => updateOrderStatus(order.id, s)}
                            className="flex-shrink-0 font-cinzel text-[7px] px-2 py-1 transition-all"
                            style={{ letterSpacing: '0.15em', border: '1px solid var(--border)', color: 'var(--text-dim)', background: 'transparent' }}>
                            → {s.replace(/_/g, ' ').toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* All orders */}
          <span className="eyebrow mb-3 block" style={{ fontSize: '8px' }}>All Orders</span>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded" />)}</div>
          ) : orders.length === 0 ? (
            <div className="card p-8 text-center">
              <div className="font-cormorant italic text-xl mb-2" style={{ color: 'var(--text-dim)' }}>No orders logged</div>
              <button onClick={() => setTab('new_order')} className="btn-primary mx-auto flex items-center gap-2">
                <Plus size={14} /> Log First Order
              </button>
            </div>
          ) : (
            <div className="card">
              {orders.map((order, i) => (
                <div key={order.id} className="flex items-center gap-3 p-4" style={{ borderBottom: i < orders.length - 1 ? '1px solid rgba(196,168,130,0.05)' : 'none' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-cormorant text-sm" style={{ color: 'var(--text-primary)' }}>{order.description}</span>
                      <span className={`badge ${STATUS_COLORS[order.status]}`}>{order.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>
                      {order.vendors?.name} · {format(parseISO(order.order_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  {order.amount && (
                    <span className="font-cormorant italic text-sm flex-shrink-0" style={{ color: 'var(--sand)' }}>
                      {formatCurrency(order.amount, order.currency)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NEW VENDOR FORM */}
      {tab === 'new_vendor' && (
        <form onSubmit={saveVendor} className="animate-fade-in">
          <div className="card mb-4">
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="eyebrow" style={{ fontSize: '8px' }}>Vendor Information</span>
            </div>
            <div className="p-4 space-y-4">
              <Field label="Vendor Name *">
                <input className="input-box" value={vendorForm.name} onChange={e => setVendorForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Island Blooms Barbados" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select className="input-box" value={vendorForm.category} onChange={e => setVendorForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
                  </select>
                </Field>
                <Field label="Island">
                  <select className="input-box" value={vendorForm.island} onChange={e => setVendorForm(p => ({ ...p, island: e.target.value }))}>
                    {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Rating (1–5)">
                  <input type="number" min="1" max="5" className="input-box" value={vendorForm.rating} onChange={e => setVendorForm(p => ({ ...p, rating: Number(e.target.value) }))} />
                </Field>
                <Field label="Import Lead Days">
                  <input type="number" min="0" max="30" className="input-box" value={vendorForm.import_lead_days} onChange={e => setVendorForm(p => ({ ...p, import_lead_days: Number(e.target.value) }))}
                    placeholder="0 = same island" />
                </Field>
              </div>
              <div className="flex items-center gap-3 p-3" style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <input type="checkbox" id="preferred" checked={vendorForm.preferred} onChange={e => setVendorForm(p => ({ ...p, preferred: e.target.checked }))}
                  style={{ accentColor: 'var(--sand)', width: 14, height: 14 }} />
                <label htmlFor="preferred" className="font-cinzel text-[9px]" style={{ color: 'var(--text-muted)', letterSpacing: '0.25em' }}>MARK AS PREFERRED VENDOR</label>
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="eyebrow" style={{ fontSize: '8px' }}>Contact Details</span>
            </div>
            <div className="p-4 space-y-4">
              <Field label="Contact Name">
                <input className="input-box" value={vendorForm.contact_name} onChange={e => setVendorForm(p => ({ ...p, contact_name: e.target.value }))} />
              </Field>
              <Field label="Email">
                <input type="email" className="input-box" value={vendorForm.email} onChange={e => setVendorForm(p => ({ ...p, email: e.target.value }))} />
              </Field>
              <Field label="Phone">
                <input className="input-box" value={vendorForm.phone} onChange={e => setVendorForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 246 555 0000" />
              </Field>
              <Field label="Website">
                <input type="url" className="input-box" value={vendorForm.website} onChange={e => setVendorForm(p => ({ ...p, website: e.target.value }))} placeholder="https://" />
              </Field>
              <Field label="Notes">
                <textarea className="input-box" rows={3} value={vendorForm.notes} onChange={e => setVendorForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Import notes, special arrangements, preferred contact times..." />
              </Field>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Add Vendor'}
            </button>
            <button type="button" onClick={() => setTab('directory')} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      )}

      {/* NEW ORDER FORM */}
      {tab === 'new_order' && (
        <form onSubmit={saveOrder} className="animate-fade-in">
          <div className="card mb-4">
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="eyebrow" style={{ fontSize: '8px' }}>Order Details</span>
            </div>
            <div className="p-4 space-y-4">
              <Field label="Vendor *">
                <select className="input-box" value={orderForm.vendor_id} onChange={e => setOrderForm(p => ({ ...p, vendor_id: e.target.value }))} required>
                  <option value="">Select vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.island})</option>)}
                </select>
              </Field>
              <Field label="Description *">
                <input className="input-box" value={orderForm.description} onChange={e => setOrderForm(p => ({ ...p, description: e.target.value }))} required
                  placeholder="e.g. White roses, 200 stems" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Amount">
                  <input type="number" className="input-box" value={orderForm.amount} onChange={e => setOrderForm(p => ({ ...p, amount: e.target.value }))} />
                </Field>
                <Field label="Currency">
                  <select className="input-box" value={orderForm.currency} onChange={e => setOrderForm(p => ({ ...p, currency: e.target.value }))}>
                    {['USD','BBD','GBP','EUR','JMD','TTD','KYD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Order Date *">
                  <input type="date" className="input-box" value={orderForm.order_date} onChange={e => setOrderForm(p => ({ ...p, order_date: e.target.value }))} required />
                </Field>
                <Field label="Expected Arrival">
                  <input type="date" className="input-box" value={orderForm.expected_arrival} onChange={e => setOrderForm(p => ({ ...p, expected_arrival: e.target.value }))} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Origin Island">
                  <select className="input-box" value={orderForm.origin_island} onChange={e => setOrderForm(p => ({ ...p, origin_island: e.target.value }))}>
                    {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select className="input-box" value={orderForm.status} onChange={e => setOrderForm(p => ({ ...p, status: e.target.value }))}>
                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Tracking / Reference">
                <input className="input-box" value={orderForm.tracking_number} onChange={e => setOrderForm(p => ({ ...p, tracking_number: e.target.value }))}
                  placeholder="Tracking number or reference" />
              </Field>
              <Field label="Notes">
                <textarea className="input-box" rows={3} value={orderForm.notes} onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))} />
              </Field>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              <Save size={14} /> {saving ? 'Logging...' : 'Log Order'}
            </button>
            <button type="button" onClick={() => setTab('orders')} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      )}
    </>
  )
}
