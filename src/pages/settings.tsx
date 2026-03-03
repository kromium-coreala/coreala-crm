import Head from 'next/head'
import { Settings, Shield, Database, DollarSign, Globe } from 'lucide-react'
import { CURRENCIES } from '@/lib/currency'

export default function SettingsPage() {
  return (
    <>
      <Head><title>Settings · Coraléa CRM</title></Head>

      <div className="mb-5 animate-fade-up">
        <span className="eyebrow">System</span>
        <h1 className="module-title mt-1">
          <span className="font-cormorant italic" style={{ color: 'var(--sand-light)' }}>Settings</span>
        </h1>
      </div>

      {/* Property */}
      <div className="card mb-4 animate-fade-up">
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Globe size={13} style={{ color: 'var(--sand)' }} />
            <span className="eyebrow" style={{ fontSize: '8px' }}>Property Information</span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[
            { label: 'Property Name', value: 'Coraléa Private Retreat' },
            { label: 'Location', value: 'West Coast, Barbados' },
            { label: 'Total Suites', value: '18 Private Suites' },
            { label: 'Total Villas', value: '6 Oceanfront Villas' },
            { label: 'Total Capacity', value: '24 Units' },
            { label: 'Max Event Guests', value: '60' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="font-cinzel text-[8px] tracking-widest" style={{ color: 'var(--text-dim)', letterSpacing: '0.25em' }}>{label}</span>
              <span className="font-raleway text-xs" style={{ color: 'var(--text-muted)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Currencies */}
      <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <DollarSign size={13} style={{ color: 'var(--sand)' }} />
            <span className="eyebrow" style={{ fontSize: '8px' }}>Supported Currencies</span>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(CURRENCIES).map(([code, { name, symbol }]) => (
              <div key={code} className="flex items-center gap-2 px-3 py-2" style={{ border: '1px solid var(--border)' }}>
                <span className="font-cinzel text-[10px]" style={{ color: 'var(--sand)', letterSpacing: '0.2em' }}>{code}</span>
                <span className="font-raleway text-xs" style={{ color: 'var(--text-dim)' }}>{symbol} · {name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database */}
      <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Database size={13} style={{ color: 'var(--sand)' }} />
            <span className="eyebrow" style={{ fontSize: '8px' }}>Database</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-raleway text-xs" style={{ color: 'var(--text-muted)' }}>Backend</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)', animation: 'pulse 2s infinite' }} />
              <span className="font-cinzel text-[9px]" style={{ color: '#6abf8e', letterSpacing: '0.2em' }}>SUPABASE CONNECTED</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-raleway text-xs" style={{ color: 'var(--text-muted)' }}>Deployment</span>
            <span className="font-cinzel text-[9px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.2em' }}>VERCEL</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-raleway text-xs" style={{ color: 'var(--text-muted)' }}>RLS Policies</span>
            <span className="font-cinzel text-[9px]" style={{ color: '#6abf8e', letterSpacing: '0.2em' }}>ENABLED</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card mb-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Shield size={13} style={{ color: 'var(--sand)' }} />
            <span className="eyebrow" style={{ fontSize: '8px' }}>Security & Privacy</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[
            { label: 'Guest Data Encryption', status: 'ACTIVE' },
            { label: 'VIP Discretion Mode', status: 'AVAILABLE' },
            { label: 'Row Level Security', status: 'ENFORCED' },
            { label: 'Audit Logging', status: 'ENABLED' },
          ].map(({ label, status }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="font-raleway text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="font-cinzel text-[8px]" style={{ color: '#6abf8e', letterSpacing: '0.2em' }}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 p-4 text-center" style={{ border: '1px solid var(--border)' }}>
        <div className="font-cinzel text-[9px] tracking-widest mb-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.4em' }}>CORALÉA PRIVATE RETREAT</div>
        <div className="font-cormorant italic text-sm" style={{ color: 'var(--text-dim)' }}>Hospitality Intelligence Platform v1.0</div>
        <div className="font-raleway text-xs mt-1" style={{ color: 'var(--text-dim)', fontSize: '10px' }}>Built by Kromium Digital</div>
      </div>
    </>
  )
}
