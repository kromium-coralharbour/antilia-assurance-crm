'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard',         label: 'Command Center',       eyebrow: 'Overview' },
  { href: '/policies',          label: 'Policy Lifecycle',     eyebrow: 'Underwriting' },
  { href: '/clients',           label: 'Clients',              eyebrow: 'Relationships' },
  { href: '/claims',            label: 'Claims Management',    eyebrow: 'FNOL & Adjusting' },
  { href: '/brokers',           label: 'Brokers & Commission', eyebrow: 'Distribution' },
  { href: '/reinsurance',       label: 'Reinsurance',          eyebrow: 'Treaty Reporting' },
  { href: '/risk-intelligence', label: 'Risk Intelligence',    eyebrow: 'Hurricane · Cat · Exposure' },
  { href: '/adjusters',         label: 'Adjusters',            eyebrow: 'Claims Operations' },
  { href: '/fraud',             label: 'Fraud Detection',      eyebrow: 'Intelligence Layer' },
  { href: '/reports',           label: 'Reports & Compliance', eyebrow: 'Regulatory' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<'dark'|'light'>('dark')

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (open) document.body.classList.add('mobile-nav-open')
    else document.body.classList.remove('mobile-nav-open')
    return () => document.body.classList.remove('mobile-nav-open')
  }, [open])

  // Sync theme state from html attribute
  useEffect(() => {
    const t = document.documentElement.getAttribute('data-theme') as 'dark'|'light' || 'dark'
    setTheme(t)
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') as 'dark'|'light' || 'dark')
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('antillia-theme', next)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <>
      {/* ── MOBILE TOP BAR ─────────────────────────────────────── */}
      <div className="mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <button
            className="mobile-hamburger"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="22" height="22" viewBox="0 0 38 38" fill="none">
              <circle cx="19" cy="19" r="17" stroke="#c9933a" strokeWidth="1.5"/>
              <circle cx="19" cy="19" r="9" stroke="#c9933a" strokeWidth="1" strokeDasharray="3 2"/>
              <circle cx="19" cy="19" r="3" fill="#c9933a"/>
            </svg>
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--topbar-text)', lineHeight: 1 }}>
              Antillia
            </span>
          </div>
        </div>
        <button className="mobile-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀' : '☽'}
        </button>
      </div>

      {/* ── OVERLAY ────────────────────────────────────────────── */}
      <div
        className={`sidebar-overlay${open ? ' active' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* ── SIDEBAR ────────────────────────────────────────────── */}
      <aside className={`crm-sidebar${open ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{
          padding: '1.4rem 1.2rem',
          borderBottom: '1px solid rgba(201,147,58,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <svg width="30" height="30" viewBox="0 0 38 38" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="19" cy="19" r="17" stroke="#c9933a" strokeWidth="1.2"/>
              <circle cx="19" cy="19" r="9" stroke="#c9933a" strokeWidth="0.8" strokeDasharray="3 2"/>
              <circle cx="19" cy="19" r="3" fill="#c9933a"/>
            </svg>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--sidebar-text)', lineHeight: 1 }}>
                Antillia
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c9933a', marginTop: '2px' }}>
                Assurance CRM
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="sidebar-close-btn"
            aria-label="Close menu"
          >✕</button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.6rem 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '0.55rem 1.2rem',
                  textDecoration: 'none',
                  background: active ? 'rgba(201,147,58,0.08)' : 'transparent',
                  borderLeft: active ? '2px solid #c9933a' : '2px solid transparent',
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '0.58rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: active ? '#c9933a' : 'var(--sidebar-dim)',
                  marginBottom: '1px',
                }}>
                  {item.eyebrow}
                </div>
                <div style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '0.85rem',
                  letterSpacing: '0.04em',
                  color: active ? 'var(--sidebar-text)' : 'var(--sidebar-mist)',
                  fontWeight: active ? 600 : 400,
                }}>
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Hurricane alert */}
        <div style={{ margin: '0 0.8rem 0.8rem', padding: '0.7rem 0.9rem', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.22)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c0392b', display: 'inline-block' }} />
            <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fc8181' }}>
              Hurricane Season Active
            </span>
          </div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: 'var(--sidebar-mist)' }}>
            June 1 – Nov 30 · Enhanced monitoring
          </div>
        </div>

        {/* User footer */}
        <div style={{
          padding: '0.9rem 1.2rem',
          borderTop: '1px solid rgba(201,147,58,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: 'var(--sidebar-text)', letterSpacing: '0.06em' }}>Underwriter</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9933a' }}>AAG Staff</div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {/* Theme toggle — desktop sidebar only */}
            <button
              onClick={toggleTheme}
              className="sidebar-theme-btn"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀' : '☽'}
            </button>
            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sidebar-dim)', fontSize: '0.75rem', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.3rem 0.5rem' }}
            >
              Out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
