import Sidebar from '@/components/layout/Sidebar'
import AuthGuard from '@/components/AuthGuard'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1e' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowX: 'hidden', minHeight: '100vh' }}>
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
