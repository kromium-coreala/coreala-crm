import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard, Users, CalendarDays, Sparkles, Heart,
  PartyPopper, AlertTriangle, TrendingUp, Settings, X, Menu,
  Shield, ChevronRight, BedDouble, Package, BarChart3, EyeOff, Eye
} from 'lucide-react'

// Global discretion mode - stored in sessionStorage
export function useDiscretionMode() {
  const [discretion, setDiscretion] = useState(false)
  useEffect(() => {
    setDiscretion(sessionStorage.getItem('discretion_mode') === '1')
  }, [])
  const toggle = () => {
    const next = !discretion
    setDiscretion(next)
    sessionStorage.setItem('discretion_mode', next ? '1' : '0')
    window.dispatchEvent(new Event('discretion_change'))
  }
  return { discretion, toggle }
}

const NAV_SECTIONS = [
  {
    label: 'Operations',
    items: [
      { href: '/', icon: LayoutDashboard, label: 'Dashboard', eyebrow: 'Overview' },
      { href: '/occupancy', icon: BedDouble, label: 'Occupancy', eyebrow: 'Live Map' },
      { href: '/guests', icon: Users, label: 'Guests', eyebrow: 'Intelligence' },
      { href: '/reservations', icon: CalendarDays, label: 'Reservations', eyebrow: 'Bookings' },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { href: '/experiences', icon: Sparkles, label: 'Experiences', eyebrow: 'Revenue' },
      { href: '/wellness', icon: Heart, label: 'Wellness', eyebrow: 'Pavilion' },
      { href: '/events', icon: PartyPopper, label: 'Events', eyebrow: 'Private' },
      { href: '/revenue', icon: TrendingUp, label: 'Revenue', eyebrow: 'Analytics' },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/vendors', icon: Package, label: 'Vendors', eyebrow: 'Caribbean' },
      { href: '/hurricane', icon: AlertTriangle, label: 'Crisis', eyebrow: 'Response' },
      { href: '/investor', icon: BarChart3, label: 'Investor', eyebrow: 'Portal' },
      { href: '/settings', icon: Settings, label: 'Settings', eyebrow: 'System' },
    ],
  },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { discretion, toggle: toggleDiscretion } = useDiscretionMode()

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4"
        style={{ background: 'rgba(5,5,5,0.96)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}
      >
        <div>
          <div className="font-cinzel text-sm tracking-widest" style={{ color: 'var(--sand)', letterSpacing: '0.35em' }}>CORALÉA</div>
          <div className="font-cormorant italic text-xs" style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Private Retreat · CRM</div>
        </div>
        <div className="flex items-center gap-3">
          {discretion && (
            <div className="flex items-center gap-1.5 px-2 py-1" style={{ border: '1px solid rgba(156,58,58,0.4)', background: 'rgba(156,58,58,0.1)' }}>
              <EyeOff size={10} style={{ color: '#e07070' }} />
              <span className="font-cinzel text-[8px]" style={{ color: '#e07070', letterSpacing: '0.3em' }}>DISC</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1" style={{ border: '1px solid rgba(196,168,130,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)', animation: 'pulse 2s infinite' }} />
            <span className="font-cinzel text-[8px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.3em' }}>LIVE</span>
          </div>
          <button onClick={() => setOpen(true)} className="p-1.5" style={{ color: 'var(--sand)' }}>
            <Menu size={20} />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)} />
      )}

      <div className="fixed top-0 left-0 bottom-0 z-50 flex flex-col w-72 transition-transform duration-500"
        style={{
          background: 'var(--obsidian)',
          borderRight: '1px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="font-cinzel tracking-widest mb-1" style={{ color: 'var(--sand)', fontSize: '16px', letterSpacing: '0.35em' }}>CORALÉA</div>
            <div className="font-cormorant italic" style={{ color: 'var(--text-dim)', fontSize: '12px' }}>Hospitality Intelligence</div>
          </div>
          <button onClick={() => setOpen(false)} style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
        </div>

        <div className="mx-4 my-3 px-3 py-2 flex items-center gap-2"
          style={{ background: 'rgba(196,168,130,0.05)', border: '1px solid rgba(196,168,130,0.15)' }}>
          <Shield size={12} style={{ color: 'var(--sand)' }} />
          <span className="font-cinzel text-[9px]" style={{ color: 'var(--sand)', letterSpacing: '0.3em' }}>SECURE ACCESS · MANAGER</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-5 pt-4 pb-1">
                <span className="font-cinzel text-[7px]" style={{ color: 'var(--text-dim)', letterSpacing: '0.5em', opacity: 0.5 }}>
                  {section.label.toUpperCase()}
                </span>
              </div>
              {section.items.map((item) => {
                const active = router.pathname === item.href ||
                  (item.href !== '/' && router.pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className="flex items-center gap-4 px-5 py-3 transition-all duration-200"
                    style={{
                      background: active ? 'rgba(196,168,130,0.08)' : 'transparent',
                      borderLeft: active ? '2px solid var(--sand)' : '2px solid transparent',
                    }}>
                    <item.icon size={15} style={{ color: active ? 'var(--sand)' : 'var(--text-dim)', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-cinzel text-[9px] mb-0.5"
                        style={{ color: active ? 'var(--sand)' : 'var(--text-dim)', letterSpacing: '0.3em' }}>
                        {item.eyebrow}
                      </div>
                      <div className="font-cormorant text-base font-light"
                        style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {item.label}
                      </div>
                    </div>
                    {active && <ChevronRight size={12} style={{ color: 'var(--sand)' }} />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-5" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Discretion Mode Toggle */}
          <button
            onClick={toggleDiscretion}
            className="w-full flex items-center gap-3 mb-4 p-3 transition-all"
            style={{
              background: discretion ? 'rgba(156,58,58,0.15)' : 'rgba(196,168,130,0.05)',
              border: `1px solid ${discretion ? 'rgba(156,58,58,0.4)' : 'rgba(196,168,130,0.15)'}`,
            }}>
            {discretion
              ? <EyeOff size={13} style={{ color: '#e07070', flexShrink: 0 }} />
              : <Eye size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
            }
            <div className="flex-1 text-left">
              <div className="font-cinzel text-[8px]" style={{ color: discretion ? '#e07070' : 'var(--text-dim)', letterSpacing: '0.25em' }}>
                {discretion ? 'DISCRETION MODE ON' : 'DISCRETION MODE'}
              </div>
              {discretion && (
                <div className="font-raleway text-[10px] mt-0.5" style={{ color: 'rgba(224,112,112,0.7)' }}>
                  Guest names are masked
                </div>
              )}
            </div>
          </button>
          <div className="font-cinzel text-[8px] mb-1" style={{ color: 'var(--text-dim)', letterSpacing: '0.4em' }}>WEST COAST BARBADOS</div>
          <div className="font-cormorant italic text-xs" style={{ color: 'var(--text-dim)' }}>Discreet Luxury · Caribbean Soul</div>
        </div>
      </div>
    </>
  )
}
