import { useEffect, useState } from 'react'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { Search, Star, Package } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { formatCurrency } from '@/lib/currency'

const ORDER_STATUSES = ['all', 'ordered', 'in_transit', 'customs', 'arrived', 'delivered']

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'directory' | 'orders'>('directory')
  const [orderStatus, setOrderStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [vRes, oRes] = await Promise.all([
      supabase.from('vendors').select('*').order('preferred', { ascending: false }),
      supabase.from('vendor_orders').select('*, vendors(name, category, island)').order('order_date', { ascending: false }),
    ])
    setVendors(vRes.data || [])
    setOrders(oRes.data || [])
    setLoading(false)
  }

  const filteredVendors = vendors.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase()) ||
    v.island.toLowerCase().includes(search.toLowerCase())
  )

  const filteredOrders = orders.filter(o => orderStatus === 'all' || o.status === orderStatus)

  const statusColor: Record<string, string> = {
    ordered: '#fbbf24', in_transit: '#60a5fa', customs: '#fb923c',
    arrived: '#a78bfa', delivered: '#4ade80', cancelled: '#f87171',
  }

  return (
    <>
      <Head><title>Vendors — Coraléa CRM</title></Head>

      <div className="page-header">
        <div className="page-eyebrow">Supply Chain</div>
        <div className="page-title">Vendors & <em>Import Logistics</em></div>
        <div className="page-subtitle">{vendors.length} vendors · {orders.length} orders tracked</div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="card card-elevated">
          <div className="card-label">Preferred Vendors</div>
          <div className="card-value">{vendors.filter(v => v.preferred).length}</div>
          <div className="card-sub">Of {vendors.length} total</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Active Orders</div>
          <div className="card-value" style={{ color: 'var(--status-conf)' }}>{orders.filter(o => ['ordered', 'in_transit', 'customs'].includes(o.status)).length}</div>
          <div className="card-sub">In pipeline</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">In Transit</div>
          <div className="card-value" style={{ color: '#60a5fa' }}>{orders.filter(o => o.status === 'in_transit').length}</div>
          <div className="card-sub">Shipping now</div>
        </div>
        <div className="card card-elevated">
          <div className="card-label">Customs</div>
          <div className="card-value" style={{ color: '#fb923c' }}>{orders.filter(o => o.status === 'customs').length}</div>
          <div className="card-sub">Awaiting clearance</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
        {(['directory', 'orders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 20px',
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: tab === t ? 'var(--gold)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
            marginBottom: -1, transition: 'all 150ms',
          }}>
            {t === 'directory' ? 'Vendor Directory' : 'Import Orders'}
          </button>
        ))}
      </div>

      {tab === 'directory' ? (
        <>
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 36, maxWidth: 360 }} placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="card card-elevated">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Category</th>
                    <th>Island</th>
                    <th>Contact</th>
                    <th>Lead Days</th>
                    <th>Rating</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map(v => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{v.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{v.notes?.slice(0, 70)}{v.notes?.length > 70 ? '…' : ''}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{v.category?.replace('_', ' ')}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.island}</td>
                      <td>
                        <div style={{ fontSize: 12 }}>{v.contact_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.email}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                        {v.import_lead_days > 0 ? `${v.import_lead_days}d` : 'Same day'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11} fill={i < (v.rating || 0) ? 'var(--gold)' : 'none'} color={i < (v.rating || 0) ? 'var(--gold)' : 'var(--text-muted)'} />
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${v.preferred ? 'badge-checked_in' : 'badge-standard'}`}>
                          {v.preferred ? 'Preferred' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {ORDER_STATUSES.map(s => (
              <button key={s} onClick={() => setOrderStatus(s)} className={`btn btn-sm ${orderStatus === s ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="card card-elevated">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Vendor</th>
                    <th>Origin</th>
                    <th>Ordered</th>
                    <th>Expected</th>
                    <th>Amount</th>
                    <th>Tracking</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500 }}>{o.description}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.vendors?.name}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.origin_island || o.vendors?.island}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.order_date ? format(parseISO(o.order_date), 'dd MMM') : '—'}</td>
                      <td style={{ fontSize: 12 }}>{o.expected_arrival ? format(parseISO(o.expected_arrival), 'dd MMM') : '—'}</td>
                      <td style={{ color: 'var(--gold)', fontSize: 13 }}>{o.amount ? formatCurrency(o.amount, o.currency || 'USD') : '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{o.tracking_number || '—'}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                          letterSpacing: '0.06em', textTransform: 'capitalize',
                          background: `${statusColor[o.status]}18`,
                          color: statusColor[o.status] || 'var(--text-muted)',
                          border: `1px solid ${statusColor[o.status]}30`,
                        }}>
                          {o.status?.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
