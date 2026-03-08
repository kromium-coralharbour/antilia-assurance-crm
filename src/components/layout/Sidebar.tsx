'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Command Center', icon: '⬡', eyebrow: 'Overview' },
  { href: '/policies', label: 'Policy Lifecycle', icon: '◈', eyebrow: 'Underwriting' },
  { href: '/clients', label: 'Clients', icon: '◎', eyebrow: 'Relationships' },
  { href: '/claims', label: 'Claims Management', icon: '◇', eyebrow: 'FNOL & Adjusting' },
  { href: '/brokers', label: 'Brokers & Commission', icon: '◉', eyebrow: 'Distribution' },
  { href: '/reinsurance', label: 'Reinsurance', icon: '◈', eyebrow: 'Treaty Reporting' },
  { href: '/risk-intelligence', label: 'Risk Intelligence', icon: '◑', eyebrow: 'Hurricane · Cat · Exposure' },
  { href: '/fraud', label: 'Fraud Detection', icon: '⚠', eyebrow: 'Intelligence Layer' },
  { href: '/reports', label: 'Reports & Compliance', icon: '▤', eyebrow: 'Regulatory' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: '#0d1321',
      borderRight: '1px solid rgba(201,147,58,0.12)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.2rem', borderBottom: '1px solid rgba(201,147,58,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <svg width="30" height="30" viewBox="0 0 38 38" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="19" cy="19" r="17" stroke="#c9933a" strokeWidth="1.2"/>
            <circle cx="19" cy="19" r="9" stroke="#c9933a" strokeWidth="0.8" strokeDasharray="3 2"/>
            <circle cx="19" cy="19" r="3" fill="#c9933a"/>
          </svg>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.95rem', color: '#fff', lineHeight: 1 }}>
              Antillia
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c9933a', marginTop: '2px' }}>
              Assurance CRM
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.8rem 0' }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '0.6rem 1.2rem',
                textDecoration: 'none',
                background: active ? 'rgba(201,147,58,0.08)' : 'transparent',
                borderLeft: active ? '2px solid #c9933a' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: active ? '#c9933a' : '#4a6080',
                marginBottom: '1px',
              }}>
                {item.eyebrow}
              </div>
              <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '0.85rem',
                letterSpacing: '0.04em',
                color: active ? '#f5f0e8' : '#8fa3b8',
                fontWeight: active ? 600 : 400,
              }}>
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Hurricane Season Alert */}
      <div style={{ margin: '0 0.8rem 0.8rem', padding: '0.8rem', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c0392b', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fc8181' }}>
            Hurricane Season Active
          </span>
        </div>
        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: '#8fa3b8' }}>
          June 1 – Nov 30 · Enhanced monitoring
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '1rem 1.2rem', borderTop: '1px solid rgba(201,147,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: '#f5f0e8', letterSpacing: '0.06em' }}>
            Underwriter
          </div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9933a' }}>
            AAG Staff
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a6080', fontSize: '0.75rem', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.5rem' }}
          title="Sign out"
        >
          Out
        </button>
      </div>
    </aside>
  )
}
