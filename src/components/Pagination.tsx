'use client'

interface PaginationProps {
  total: number
  page: number
  perPage: number
  onChange: (page: number) => void
}

export function Pagination({ total, page, perPage, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  // Build page numbers to show: always first, last, current ±1, with ellipsis
  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  const btnBase: React.CSSProperties = {
    fontFamily: 'Barlow Condensed',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    padding: '0.35rem 0.65rem',
    border: '1px solid var(--border-gold)',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--text-mist)',
    transition: 'all 0.15s',
    minWidth: 34,
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem 0 0.25rem' }}>
      {/* Record count */}
      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', letterSpacing: '0.15em', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
        Showing <span style={{ color: 'var(--text-mist)' }}>{start}–{end}</span> of <span style={{ color: 'var(--text-mist)' }}>{total}</span>
      </div>

      {/* Page buttons */}
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.35 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} style={{ ...btnBase, cursor: 'default', borderColor: 'transparent' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              style={{
                ...btnBase,
                background: p === page ? 'var(--gold)' : 'transparent',
                color: p === page ? '#fff' : 'var(--text-mist)',
                borderColor: p === page ? 'var(--gold)' : 'var(--border-gold)',
                fontWeight: p === page ? 600 : 400,
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          style={{ ...btnBase, opacity: page === totalPages ? 0.35 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
        >
          ›
        </button>
      </div>
    </div>
  )
}
