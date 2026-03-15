import { useState } from 'react'
import { useRouter } from 'next/router'
import { Menu, Shield } from 'lucide-react'
import Sidebar, { useDiscretionMode } from './Sidebar'
import { Toaster } from 'react-hot-toast'

const PAGE_TITLES: Record<string, string> = {
  '/':              'Property Overview',
  '/occupancy':     'Occupancy Map',
  '/guests':        'Guest Intelligence',
  '/reservations':  'Reservations',
  '/experiences':   'Experiences',
  '/wellness':      'Wellness Pavilion',
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
