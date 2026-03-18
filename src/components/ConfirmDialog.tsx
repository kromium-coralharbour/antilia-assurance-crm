'use client'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)',
        width: '100%', maxWidth: 420, padding: '2rem',
      }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.8rem' }}>
          {title}
        </div>
        <div style={{ fontFamily: 'Barlow', fontSize: '0.88rem', color: 'var(--text-mist)', lineHeight: 1.6, marginBottom: '1.8rem' }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              background: danger ? 'rgba(192,57,43,0.2)' : 'var(--gold)',
              color: danger ? '#fc8181' : '#fff',
              border: danger ? '1px solid rgba(192,57,43,0.4)' : 'none',
              fontFamily: 'Barlow Condensed', fontSize: '0.78rem',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              fontWeight: 600, padding: '0.65rem 1.4rem',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
