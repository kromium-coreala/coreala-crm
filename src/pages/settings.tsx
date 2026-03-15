import Head from 'next/head'
import { Settings, Building, Globe, Shield, Bell } from 'lucide-react'

export default function SettingsPage() {
  return (
    <>
      <Head><title>Settings — Coraléa CRM</title></Head>

      <div className="page-header">
        <div className="page-eyebrow">Configuration</div>
        <div className="page-title">Settings</div>
        <div className="page-subtitle">Property configuration and CRM preferences</div>
      </div>

      <div className="grid-2">
        {/* Property info */}
        <div className="card card-elevated">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div className="card-icon"><Building /></div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)' }}>Property Details</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Property Name', value: 'Coraléa Private Retreat' },
              { label: 'Location', value: 'West Coast, Barbados' },
              { label: 'Total Units', value: '24 (18 Suites + 5 Villas + 1 Grand Villa)' },
              { label: 'ADR Range', value: '$950 – $2,500 USD' },
              { label: 'Brand Positioning', value: 'Discreet luxury with Caribbean soul' },
            ].map(({ label, value }) => (
              <div key={label} className="form-group" style={{ marginBottom: 0 }}>
                <label>{label}</label>
                <input className="input" defaultValue={value} />
              </div>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="card card-elevated">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div className="card-icon"><Globe /></div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)' }}>Currency & Locale</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Base Currency</label>
              <select className="select">
                <option>USD — US Dollar</option>
                <option>BBD — Barbados Dollar</option>
                <option>GBP — British Pound</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Date Format</label>
              <select className="select">
                <option>DD MMM YYYY (01 Jan 2026)</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Timezone</label>
              <select className="select">
                <option>America/Barbados (AST, UTC-4)</option>
                <option>UTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="card card-elevated">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div className="card-icon"><Shield /></div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)' }}>Privacy & Discretion</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Mask guest names in printed reports',
              'Require PIN to access investor portal',
              'Log all discretion mode activations',
              'Watermark exported documents',
              'Auto-lock after 15 minutes inactivity',
            ].map(label => (
              <label key={label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', cursor: 'pointer',
                background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)',
                fontWeight: 400, letterSpacing: 0, textTransform: 'none',
              }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--gold)', width: 14, height: 14 }} />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card card-elevated">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div className="card-icon"><Bell /></div>
            <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, color: 'var(--text-primary)' }}>Notifications</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Platinum guest arrival alerts',
              'VIP birthday & anniversary reminders',
              'Hurricane watch notifications',
              'Vendor order status updates',
              'Occupancy threshold alerts (>85%)',
            ].map(label => (
              <label key={label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', cursor: 'pointer',
                background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)',
                fontWeight: 400, letterSpacing: 0, textTransform: 'none',
              }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--gold)', width: 14, height: 14 }} />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button className="btn btn-primary">Save Changes</button>
        <button className="btn btn-ghost">Reset to Defaults</button>
      </div>
    </>
  )
}
