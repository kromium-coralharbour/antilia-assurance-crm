'use client'
import { useAuthGuard } from '@/hooks/useAuthGuard'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, authenticated } = useAuthGuard()

  if (loading || !authenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0f1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <circle cx="19" cy="19" r="17" stroke="#c9933a" strokeWidth="1.2" opacity="0.4"/>
          <circle cx="19" cy="19" r="10" stroke="#c9933a" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.6">
            <animateTransform attributeName="transform" type="rotate" from="0 19 19" to="360 19 19" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="19" cy="19" r="3.5" fill="#c9933a"/>
        </svg>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: '0.65rem',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#4a5a6a'
        }}>
          Verifying Access
        </div>
      </div>
    )
  }

  return <>{children}</>
}
