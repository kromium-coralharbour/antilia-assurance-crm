'use client'
import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  onDone: () => void
}

export function Toast({ message, type = 'success', onDone }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300) }, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  const colours = {
    success: { bg: 'rgba(39,174,96,0.15)', border: 'rgba(39,174,96,0.35)', text: '#4ade80', icon: '✓' },
    error:   { bg: 'rgba(192,57,43,0.15)', border: 'rgba(192,57,43,0.35)', text: '#fc8181', icon: '✕' },
    warning: { bg: 'rgba(230,126,34,0.15)', border: 'rgba(230,126,34,0.35)', text: '#fbbf24', icon: '⚠' },
  }
  const c = colours[type]

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      background: 'var(--bg-card)', border: `1px solid ${c.border}`,
      padding: '0.9rem 1.2rem', minWidth: 260, maxWidth: 380,
      boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      transition: 'opacity 0.3s, transform 0.3s',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
    }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: c.text, flexShrink: 0 }}>{c.icon}</span>
      <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.85rem', color: 'var(--text-primary)', letterSpacing: '0.04em', flex: 1 }}>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onDone, 300) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '0.8rem', padding: '0 0.2rem', flexShrink: 0 }}>✕</button>
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const show = (message: string, type: ToastType = 'success') => setToast({ message, type })
  const hide = () => setToast(null)
  return { toast, show, hide }
}
