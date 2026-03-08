'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatStatus, getIslandLabel, getIslandFlag } from '@/lib/utils'
import { Island, Currency, ISLAND_LABELS } from '@/types'

export default function ReinsurancePage() {
  const supabase = createClient()
  const [treaties, setTreaties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState({
    treaty_name: '', reinsurer_name: '', treaty_type: 'catastrophe_xl',
    islands_covered: [] as Island[], inception_date: '', expiry_date: '',
    limit_amount: '', retention: '', currency: 'USD' as Currency,
    cession_rate: '', attachment_point: '', notes: '',
  })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('reinsurance_treaties').select('*').order('created_at', { ascending: false })
    setTreaties(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('reinsurance_treaties').insert({
      ...form,
      limit_amount: parseFloat(form.limit_amount),
      retention: parseFloat(form.retention),
      cession_rate: form.cession_rate ? parseFloat(form.cession_rate) : null,
      attachment_point: form.attachment_point ? parseFloat(form.attachment_point) : null,
      premium_ceded: 0, exposure_ceded: 0, loss_recoverable: 0, status: 'active',
    })
    if (!error) { setShowForm(false); load() }
    setSaving(false)
  }

  const totalLimit = treaties.filter(t => t.status === 'active').reduce((s, t) => s + (t.limit_amount || 0), 0)
  const totalExposureCeded = treaties.filter(t => t.status === 'active').reduce((s, t) => s + (t.exposure_ceded || 0), 0)
  const totalPremiumCeded = treaties.filter(t => t.status === 'active').reduce((s, t) => s + (t.premium_ceded || 0), 0)

  const TREATY_TYPE_LABELS: Record<string, string> = {
    quota_share: 'Quota Share', excess_of_loss: 'Excess of Loss',
    catastrophe_xl: 'Catastrophe XL', facultative: 'Facultative',
  }

  return (
    <div className="page-enter" style={{ padding: '2rem', minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Treaty Management</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: 0 }}>Reinsurance</h1>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.12em', color: '#8fa3b8', marginTop: '0.3rem' }}>Exposure Reporting · Treaty Dashboard · Cession Tracking</div>
        </div>
        <button className="btn-gold" onClick={() => setShowForm(true)}>+ New Treaty</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '2rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Active Treaties', value: treaties.filter(t => t.status === 'active').length.toString() },
          { label: 'Total Reinsurance Limit', value: formatCurrency(totalLimit, 'USD', true) },
          { label: 'Total Exposure Ceded', value: formatCurrency(totalExposureCeded, 'USD', true) },
          { label: 'Premium Ceded YTD', value: formatCurrency(totalPremiumCeded, 'USD', true) },
        ].map((k, i) => (
          <div key={i} style={{ background: '#111827', padding: '1rem 1.2rem' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8fa3b8' }}>{k.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 900, color: '#c9933a', marginTop: '0.2rem' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Treaty Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <div style={{ color: '#8fa3b8' }}>Loading treaties…</div>
        ) : treaties.map(t => {
          const utilizationPct = t.limit_amount > 0 ? Math.min(100, (t.exposure_ceded / t.limit_amount) * 100) : 0
          const isExpiringSoon = t.expiry_date && new Date(t.expiry_date) < new Date(Date.now() + 90 * 86400000)
          return (
            <div key={t.id} className="crm-card" style={{ cursor: 'pointer' }} onClick={() => setSelected(t)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>{t.treaty_name}</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: '#8fa3b8', letterSpacing: '0.06em' }}>{t.reinsurer_name}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="badge" style={{ background: 'rgba(201,147,58,0.1)', borderColor: 'rgba(201,147,58,0.3)', color: '#e8b04a' }}>
                    {TREATY_TYPE_LABELS[t.treaty_type] || t.treaty_type}
                  </span>
                  {isExpiringSoon && <span className="badge" style={{ background: 'rgba(231,76,60,0.15)', borderColor: 'rgba(231,76,60,0.3)', color: '#fc8181' }}>Expiring Soon</span>}
                </div>
              </div>

              {/* Financial Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(201,147,58,0.08)' }}>
                {[
                  { label: 'Limit', value: formatCurrency(t.limit_amount, t.currency, true) },
                  { label: 'Retention', value: formatCurrency(t.retention, t.currency, true) },
                  { label: t.cession_rate ? 'Cession Rate' : 'Attach Point', value: t.cession_rate ? `${t.cession_rate}%` : formatCurrency(t.attachment_point, t.currency, true) },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4a6080' }}>{item.label}</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.88rem', color: '#c9933a', fontWeight: 600, marginTop: '0.2rem' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Utilization Bar */}
              <div style={{ marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4a6080' }}>Treaty Utilization</span>
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', color: utilizationPct > 70 ? '#fc8181' : '#8fa3b8' }}>{utilizationPct.toFixed(0)}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(46,64,96,0.5)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${utilizationPct}%`, background: utilizationPct > 70 ? '#c0392b' : '#c9933a', borderRadius: 2, transition: 'width 0.5s' }} />
                </div>
              </div>

              {/* Islands + Dates */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {(t.islands_covered || []).map((island: Island) => (
                    <span key={island} style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: '#8fa3b8' }}>{getIslandFlag(island)}</span>
                  ))}
                </div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: '#4a6080' }}>
                  {formatDate(t.inception_date)} → {formatDate(t.expiry_date)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Treaty Detail */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 620, maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Treaty Detail</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{selected.treaty_name}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: '#8fa3b8', marginTop: '0.2rem' }}>{selected.reinsurer_name} · {TREATY_TYPE_LABELS[selected.treaty_type]}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8fa3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                ['Treaty Limit', formatCurrency(selected.limit_amount, selected.currency)],
                ['Retention', formatCurrency(selected.retention, selected.currency)],
                ['Premium Ceded', formatCurrency(selected.premium_ceded, selected.currency)],
                ['Exposure Ceded', formatCurrency(selected.exposure_ceded, selected.currency)],
                ['Loss Recoverable', formatCurrency(selected.loss_recoverable || 0, selected.currency)],
                ['Currency', selected.currency],
                ['Inception', formatDate(selected.inception_date)],
                ['Expiry', formatDate(selected.expiry_date)],
                ['Status', formatStatus(selected.status)],
                ['Cession Rate', selected.cession_rate ? `${selected.cession_rate}%` : '—'],
                ['Attachment Point', selected.attachment_point ? formatCurrency(selected.attachment_point, selected.currency) : '—'],
              ].map(([label, value], i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>{label}</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.88rem', color: '#f5f0e8' }}>{value}</div>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.4rem' }}>Islands Covered</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(selected.islands_covered || []).map((island: Island) => (
                    <span key={island} style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', background: 'rgba(46,64,96,0.4)', border: '1px solid rgba(201,147,58,0.15)', color: '#e8b04a', padding: '0.2rem 0.6rem' }}>
                      {getIslandFlag(island)} {getIslandLabel(island)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Treaty Form */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Reinsurance</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>New Treaty</div>
            </div>
            <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Treaty Name *</label><input className="crm-input" value={form.treaty_name} onChange={e => setForm(f => ({ ...f, treaty_name: e.target.value }))} required /></div>
              <div><label className="crm-label">Reinsurer *</label><input className="crm-input" value={form.reinsurer_name} onChange={e => setForm(f => ({ ...f, reinsurer_name: e.target.value }))} required /></div>
              <div>
                <label className="crm-label">Treaty Type</label>
                <select className="crm-select" value={form.treaty_type} onChange={e => setForm(f => ({ ...f, treaty_type: e.target.value }))}>
                  {Object.entries(TREATY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="crm-label">Islands Covered</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  {(Object.keys(ISLAND_LABELS) as Island[]).map(island => (
                    <label key={island} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.islands_covered.includes(island)} onChange={e => setForm(f => ({ ...f, islands_covered: e.target.checked ? [...f.islands_covered, island] : f.islands_covered.filter(i => i !== island) }))} style={{ accentColor: '#c9933a' }} />
                      <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: '#8fa3b8' }}>{getIslandFlag(island)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div><label className="crm-label">Currency</label><select className="crm-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}>{['USD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="crm-label">Limit Amount *</label><input className="crm-input" type="number" value={form.limit_amount} onChange={e => setForm(f => ({ ...f, limit_amount: e.target.value }))} required /></div>
              <div><label className="crm-label">Retention *</label><input className="crm-input" type="number" value={form.retention} onChange={e => setForm(f => ({ ...f, retention: e.target.value }))} required /></div>
              <div><label className="crm-label">Cession Rate %</label><input className="crm-input" type="number" placeholder="For QS only" value={form.cession_rate} onChange={e => setForm(f => ({ ...f, cession_rate: e.target.value }))} /></div>
              <div><label className="crm-label">Attachment Point</label><input className="crm-input" type="number" placeholder="For XL only" value={form.attachment_point} onChange={e => setForm(f => ({ ...f, attachment_point: e.target.value }))} /></div>
              <div><label className="crm-label">Inception Date *</label><input className="crm-input" type="date" value={form.inception_date} onChange={e => setForm(f => ({ ...f, inception_date: e.target.value }))} required /></div>
              <div><label className="crm-label">Expiry Date *</label><input className="crm-input" type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} required /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Notes</label><textarea className="crm-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Add Treaty'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
