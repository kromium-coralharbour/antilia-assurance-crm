import Sidebar from '@/components/layout/Sidebar'
import AuthGuard from '@/components/AuthGuard'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
        <Sidebar />
        <main className="crm-main">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
