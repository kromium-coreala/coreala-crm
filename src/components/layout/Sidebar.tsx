import { useState, useEffect, createContext, useContext } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard, Users, CalendarDays, Sparkles, Heart,
  PartyPopper, AlertTriangle, TrendingUp, Settings, X, Menu,
  Shield, BedDouble, Package, BarChart3, Sun, Moon, EyeOff, Eye,
  UtensilsCrossed, ClipboardCheck
} from 'lucide-react'

// ─── Contexts ────────────────────────────────────────────────────
const DiscretionContext = createContext({ discretion: false, setDiscretion: (_: boolean) => {} })
export function useDiscretionMode() { return useContext(DiscretionContext) }

const ThemeContext = createContext({ theme: 'dark', toggle: () => {} })
export function useTheme() { return useContext(ThemeContext) }

// ─── Nav structure ────────────────────────────────────────────────
const NAV = [
  {
    label: 'Lead Generation',
      items: [
        { href: '/enquiries',   icon: Inbox,        label: 'Enquiries'    },
        { href: '/attribution', icon: PieChart,      label: 'Attribution'  },
        { href: '/availability',icon: CalendarRange, label: 'Availability' },
        { href: '/nurture',     icon: Mail,          label: 'Nurture'      },
        { href: '/proposals',   icon: FileText,      label: 'Proposals'    },
        { href: '/tours',       icon: MapPin,        label: 'Tours'        },
      ],
    },
    {
      label: 'Operations',
    items: [
      { href: '/',             icon: LayoutDashboard, label: 'Dashboard'   },
      { href: '/occupancy',    icon: BedDouble,       label: 'Occupancy'   },
      { href: '/guests',       icon: Users,           label: 'Guests'      },
      { href: '/reservations', icon: CalendarDays,    label: 'Reservations'},
      { href: '/pre-arrival',  icon: ClipboardCheck,  label: 'Pre-Arrival' },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { href: '/experiences', icon: Sparkles,         label: 'Experiences' },
      { href: '/wellness',    icon: Heart,             label: 'Wellness'    },
      { href: '/dining',      icon: UtensilsCrossed,   label: 'Dining'      },
      { href: '/events',      icon: PartyPopper,       label: 'Events'      },
      { href: '/revenue',     icon: TrendingUp,        label: 'Revenue'     },
    ],
  },
  {
    label: 'Management',
    items: [
      { href: '/vendors',    icon: Package,       label: 'Vendors'       },
      { href: '/investor',   icon: BarChart3,     label: 'Investor'      },
      { href: '/hurricane',  icon: AlertTriangle, label: 'Hurricane'     },
      { href: '/settings',   icon: Settings,      label: 'Settings'      },
    ],
  },
]

// ─── Provider (wraps entire app) ──────────────────────────────────
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [discretion, setDiscretion] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('crm-theme') || 'dark'
    const savedDisc = sessionStorage.getItem('crm-discretion') === 'true'
    setTheme(saved)
    setDiscretion(savedDisc)
    document.documentElement.setAttribute('data-theme', saved)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    sessionStorage.setItem('crm-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const handleSetDiscretion = (v: boolean) => {
    setDiscretion(v)
    sessionStorage.setItem('crm-discretion', String(v))
  }

  if (!mounted) return null

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <DiscretionContext.Provider value={{ discretion, setDiscretion: handleSetDiscretion }}>
        {children}
      </DiscretionContext.Provider>
    </ThemeContext.Provider>
  )
}

// ─── Sidebar component ────────────────────────────────────────────
interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const router = useRouter()
  const { discretion, setDiscretion } = useDiscretionMode()
  const { theme, toggle } = useTheme()

  const isActive = (href: string) =>
    href === '/' ? router.pathname === '/' : router.pathname.startsWith(href)

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${open ? 'show' : ''}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`crm-sidebar ${open ? 'open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="sidebar-logo-name">Coraléa</div>
              <div className="sidebar-logo-sub">Private Retreat · CRM</div>
            </div>
            <button
              onClick={onClose}
              style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              className="sidebar-close-btn"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer toggles */}
        <div className="sidebar-footer">
          {/* Discretion mode */}
          <div
            className={`toggle-row danger ${discretion ? 'active' : ''}`}
            onClick={() => setDiscretion(!discretion)}
          >
            <span className="toggle-row-label">
              {discretion ? <EyeOff size={12} /> : <Eye size={12} />}
              {discretion ? 'Secure Mode' : 'Discretion'}
            </span>
            <div className="toggle-pill" />
          </div>

          {/* Theme toggle */}
          <div className="toggle-row" onClick={toggle}>
            <span className="toggle-row-label">
              {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
            <div className={`toggle-pill ${theme === 'light' ? 'active' : ''}`} style={
              theme === 'light' ? { background: 'var(--gold-glow)', borderColor: 'var(--gold)' } : {}
            } />
          </div>
        </div>
      </aside>

      {/* Mobile close button CSS */}
      <style>{`
        @media (max-width: 1024px) {
          .sidebar-close-btn { display: flex !important; align-items: center; }
        }
      `}</style>
    </>
  )
}
