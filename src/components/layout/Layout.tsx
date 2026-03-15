import { useState } from 'react'
import { useRouter } from 'next/router'
import { Menu, Shield, LogOut } from 'lucide-react'
import Sidebar, { useDiscretionMode } from './Sidebar'
import { Toaster } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

const PAGE_TITLES: Record<string, string> = {
  '/':              'Property Overview',
  '/occupancy':     'Occupancy Map',
  '/guests':        'Guest Intelligence',
  '/reservations':  'Reservations',
  '/pre-arrival':   'Pre-Arrival Workflows',
  '/experiences':   'Experiences',
  '/wellness':      'Wellness Pavilion',
  '/dining':        'Dining Reservations',
  '/events':        'Events & Occasions',
  '/revenue':       'Revenue & Finance',
  '/vendors':       'Vendors & Imports',
  '/investor':      'Investor Portal',
  '/hurricane':     'Hurricane Response',
  '/settings':      'Settings',
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/guests/') && pathname.endsWith('/edit')) return 'Edit Guest'
  if (pathname.startsWith('/guests/') && pathname !== '/guests') return 'Guest Profile'
  if (pathname.startsWith('/reservations/') && pathname !== '/reservations') return 'Reservation Detail'
  if (pathname.startsWith('/events/') && pathname !== '/events') return 'Event Detail'
  if (pathname === '/guests/new') return 'New Guest'
  if (pathname === '/reservations/new') return 'New Reservation'
  if (pathname === '/experiences/new') return 'Log Experience'
  if (pathname === '/events/new') return 'New Event'
  return PAGE_TITLES[pathname] || 'Coraléa CRM'
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { discretion } = useDiscretionMode()
  const router = useRouter()
  const title = getPageTitle(router.pathname)

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="crm-shell">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-mid)',
            fontFamily: 'var(--font-ui)',
            fontSize: '13px',
          },
        }}
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="crm-main">
        {/* Topbar */}
        <header className="crm-topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="topbar-page-title">{title}</span>
          </div>
          <div className="topbar-right">
            {discretion && (
              <div className="discretion-banner">
                <Shield size={10} style={{ display: 'inline', marginRight: 4 }} />
                Secure Mode
              </div>
            )}
            <div className="live-badge">
              <span className="live-dot" />
              Live
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                gap: 5, fontSize: 11, fontFamily: 'var(--font-ui)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                transition: 'color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="crm-content">
          {children}
        </main>
      </div>
    </div>
  )
}
