'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatStatus, getIslandLabel, getIslandFlag, POLICY_STATUS_STYLES, getRiskColor, daysUntil } from '@/lib/utils'
import { Policy, CoverageType, Island, PolicyStatus, COVERAGE_LABELS, ISLAND_LABELS } from '@/types'

const EMPTY_FORM = {
  client_id: '', broker_id: '', coverage_type: 'residential' as CoverageType,
  island: 'barbados' as Island, insured_value: '', currency: 'USD',
  annual_premium: '', start_date: '', end_date: '', renewal_date: '',
  wind_zone: '', flood_zone: '', structural_compliance_rating: '',
  construction_year: '', property_address: '', hurricane_deductible_pct: '5',
  notes: '',
}

export default function PoliciesPage() {
  const supabase = createClient()
  const [policies, setPolicies] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [brokers, setBrokers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterIsland, setFilterIsland] = useState('')
  const [filterCoverage, setFilterCoverage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  async function load() {
    const [polRes, clientRes, brokerRes] = await Promise.all([
      supabase.from('policies').select(`*, clients(first_name, last_name, company_name, email), brokers(name, company)`).order('created_at', { ascending: false }),
      supabase.from('clients').select('id, first_name, last_name, company_name, email'),
      supabase.from('brokers').select('id, name, company'),
    ])
    setPolicies(polRes.data || [])
    setClients(clientRes.data || [])
    setBrokers(brokerRes.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = policies.filter(p => {
    const clientName = p.clients ? `${p.clients.first_name} ${p.clients.last_name} ${p.clients.company_name || ''}`.toLowerCase() : ''
    const matchSearch = !search || p.policy_number?.toLowerCase().includes(search.toLowerCase()) || clientName.includes(search.toLowerCase()) || p.property_address?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || p.status === filterStatus
    const matchIsland = !filterIsland || p.island === filterIsland
    const matchCoverage = !filterCoverage || p.coverage_type === filterCoverage
    return matchSearch && matchStatus && matchIsland && matchCoverage
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const policyNumber = `AAG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
    const { error } = await supabase.from('policies').insert({
      ...form,
      policy_number: policyNumber,
      insured_value: parseFloat(form.insured_value),
      annual_premium: parseFloat(form.annual_premium),
      structural_compliance_rating: form.structural_compliance_rating ? parseFloat(form.structural_compliance_rating) : null,
      construction_year: form.construction_year ? parseInt(form.construction_year) : null,
      hurricane_deductible_pct: parseFloat(form.hurricane_deductible_pct),
      status: 'pending',
      premium_currency: form.currency,
      risk_score: 50,
    })
    if (!error) { setShowForm(false); setForm(EMPTY_FORM); load() }
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('policies').update({ status }).eq('id', id)
    load()
    if (selected?.id === id) setSelected((p: any) => ({ ...p, status }))
  }

  const totalGWP = filtered.reduce((s, p) => s + (p.annual_premium || 0), 0)
  const totalExposure = filtered.reduce((s, p) => s + (p.insured_value || 0), 0)

  return (
    <div className="page-enter" style={{ padding: '2rem', minHeight: '100vh', background: '#0a0f1e' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Underwriting</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: 0 }}>Policy Lifecycle</h1>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.12em', color: '#8fa3b8', marginTop: '0.3rem' }}>
            Quote · Bind · Endorse · Renew · Cancel
          </div>
        </div>
        <button className="btn-gold" onClick={() => setShowForm(true)}>+ New Policy</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '1.5rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Total Policies', value: filtered.length.toString() },
          { label: 'Active', value: filtered.filter(p => p.status === 'active').length.toString() },
          { label: 'GWP (Filtered)', value: formatCurrency(totalGWP, 'USD', true) },
          { label: 'Total Exposure', value: formatCurrency(totalExposure, 'USD', true) },
        ].map((k, i) => (
          <div key={i} style={{ background: '#111827', padding: '1rem 1.2rem' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8fa3b8' }}>{k.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 900, color: '#c9933a', marginTop: '0.2rem' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        <input className="crm-input" style={{ maxWidth: 260 }} placeholder="Search policy #, client, address…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="crm-select" style={{ maxWidth: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['active','pending','renewal_due','lapsed','cancelled','quoted'].map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
        </select>
        <select className="crm-select" style={{ maxWidth: 160 }} value={filterIsland} onChange={e => setFilterIsland(e.target.value)}>
          <option value="">All Islands</option>
          {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="crm-select" style={{ maxWidth: 200 }} value={filterCoverage} onChange={e => setFilterCoverage(e.target.value)}>
          <option value="">All Coverage Types</option>
          {Object.entries(COVERAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.12)', overflow: 'auto' }}>
        <table className="crm-table">
          <thead>
            <tr>
              <th>Policy #</th>
              <th>Client</th>
              <th>Coverage</th>
              <th>Island</th>
              <th>Insured Value</th>
              <th>Annual Premium</th>
              <th>Status</th>
              <th>Renewal</th>
              <th>Risk</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#8fa3b8' }}>Loading policies…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#8fa3b8' }}>No policies found</td></tr>
            ) : filtered.map(p => {
              const days = p.renewal_date ? daysUntil(p.renewal_date) : 999
              const renewalUrgent = days <= 30
              const renewalSoon = days <= 60
              return (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(p)}>
                  <td style={{ fontFamily: 'Barlow Condensed', color: '#c9933a', fontSize: '0.82rem', fontWeight: 600 }}>{p.policy_number}</td>
                  <td>
                    <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: '#f5f0e8' }}>
                      {p.clients ? `${p.clients.first_name} ${p.clients.last_name}` : '—'}
                    </div>
                    {p.clients?.company_name && <div style={{ fontSize: '0.75rem', color: '#8fa3b8' }}>{p.clients.company_name}</div>}
                  </td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: '#8fa3b8' }}>{COVERAGE_LABELS[p.coverage_type as CoverageType] || p.coverage_type}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.8rem' }}>{getIslandFlag(p.island)} {getIslandLabel(p.island)}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: '#f5f0e8' }}>{formatCurrency(p.insured_value, p.currency, true)}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', color: '#c9933a' }}>{formatCurrency(p.annual_premium, p.premium_currency, true)}</td>
                  <td><span className={`badge ${POLICY_STATUS_STYLES[p.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>{formatStatus(p.status)}</span></td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: renewalUrgent ? '#fc8181' : renewalSoon ? '#e8b04a' : '#8fa3b8', whiteSpace: 'nowrap' }}>
                    {formatDate(p.renewal_date)}
                    {renewalUrgent && <div style={{ fontSize: '0.65rem', color: '#fc8181' }}>⚠ {days}d</div>}
                  </td>
                  <td>
                    <div style={{ width: 40, height: 4, background: 'rgba(46,64,96,0.5)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${p.risk_score || 50}%`, background: getRiskColor(p.risk_score || 50), borderRadius: 2 }} />
                    </div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', color: '#8fa3b8', marginTop: '2px' }}>{p.risk_score || 50}</div>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {p.status === 'quoted' && <button className="btn-gold" style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem' }} onClick={() => updateStatus(p.id, 'active')}>Bind</button>}
                      {p.status === 'active' && <button className="btn-ghost" style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem' }} onClick={() => updateStatus(p.id, 'renewal_due')}>Flag Renewal</button>}
                      {p.status === 'renewal_due' && <button className="btn-gold" style={{ padding: '0.3rem 0.7rem', fontSize: '0.65rem' }} onClick={() => updateStatus(p.id, 'active')}>Renew</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Policy Detail Panel */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Policy Detail</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{selected.policy_number}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: '#8fa3b8', marginTop: '0.2rem' }}>
                  {selected.clients ? `${selected.clients.first_name} ${selected.clients.last_name}` : ''} · {COVERAGE_LABELS[selected.coverage_type as CoverageType] || selected.coverage_type}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8fa3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              {[
                ['Status', <span key="s" className={`badge ${POLICY_STATUS_STYLES[selected.status] || ''}`}>{formatStatus(selected.status)}</span>],
                ['Island', `${getIslandFlag(selected.island)} ${getIslandLabel(selected.island)}`],
                ['Insured Value', formatCurrency(selected.insured_value, selected.currency)],
                ['Annual Premium', formatCurrency(selected.annual_premium, selected.premium_currency)],
                ['Policy Period', `${formatDate(selected.start_date)} – ${formatDate(selected.end_date)}`],
                ['Renewal Date', formatDate(selected.renewal_date)],
                ['Wind Zone', selected.wind_zone || '—'],
                ['Flood Zone', selected.flood_zone || '—'],
                ['Structural Rating', selected.structural_compliance_rating ? `${selected.structural_compliance_rating}%` : '—'],
                ['Hurricane Deductible', selected.hurricane_deductible_pct ? `${selected.hurricane_deductible_pct}%` : '—'],
                ['Construction Year', selected.construction_year || '—'],
                ['Broker', selected.brokers?.name || '—'],
              ].map(([label, value], i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>{label}</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.88rem', color: '#f5f0e8' }}>{value as any}</div>
                </div>
              ))}
            </div>
            {selected.property_address && (
              <div style={{ padding: '0 1.5rem 1rem' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>Property Address</div>
                <div style={{ fontFamily: 'Barlow', fontSize: '0.88rem', color: '#f5f0e8' }}>{selected.property_address}</div>
              </div>
            )}
            {selected.notes && (
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>Notes</div>
                <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: '#8fa3b8', lineHeight: 1.6 }}>{selected.notes}</div>
              </div>
            )}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,147,58,0.1)', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              {selected.status === 'quoted' && <button className="btn-gold" onClick={() => updateStatus(selected.id, 'active')}>Bind Policy</button>}
              {selected.status === 'active' && <button className="btn-ghost" onClick={() => updateStatus(selected.id, 'renewal_due')}>Flag for Renewal</button>}
              {selected.status === 'renewal_due' && <button className="btn-gold" onClick={() => updateStatus(selected.id, 'active')}>Renew Policy</button>}
              {selected.status !== 'cancelled' && <button className="btn-danger" onClick={() => updateStatus(selected.id, 'cancelled')}>Cancel</button>}
            </div>
          </div>
        </div>
      )}

      {/* New Policy Form */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Underwriting</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>New Policy Quote</div>
            </div>
            <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="crm-label">Client *</label>
                <select className="crm-select" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} required>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}{c.company_name ? ` — ${c.company_name}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="crm-label">Coverage Type *</label>
                <select className="crm-select" value={form.coverage_type} onChange={e => setForm(f => ({ ...f, coverage_type: e.target.value as CoverageType }))} required>
                  {Object.entries(COVERAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="crm-label">Island *</label>
                <select className="crm-select" value={form.island} onChange={e => setForm(f => ({ ...f, island: e.target.value as Island }))} required>
                  {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="crm-label">Insured Value *</label>
                <input className="crm-input" type="number" placeholder="e.g. 2500000" value={form.insured_value} onChange={e => setForm(f => ({ ...f, insured_value: e.target.value }))} required />
              </div>
              <div>
                <label className="crm-label">Currency</label>
                <select className="crm-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  {['USD','BBD','JMD','KYD','TTD','BSD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="crm-label">Annual Premium *</label>
                <input className="crm-input" type="number" placeholder="e.g. 25000" value={form.annual_premium} onChange={e => setForm(f => ({ ...f, annual_premium: e.target.value }))} required />
              </div>
              <div>
                <label className="crm-label">Hurricane Deductible %</label>
                <input className="crm-input" type="number" placeholder="5" value={form.hurricane_deductible_pct} onChange={e => setForm(f => ({ ...f, hurricane_deductible_pct: e.target.value }))} />
              </div>
              <div>
                <label className="crm-label">Start Date *</label>
                <input className="crm-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
              </div>
              <div>
                <label className="crm-label">End Date *</label>
                <input className="crm-input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required />
              </div>
              <div>
                <label className="crm-label">Renewal Date *</label>
                <input className="crm-input" type="date" value={form.renewal_date} onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))} required />
              </div>
              <div>
                <label className="crm-label">Wind Zone</label>
                <input className="crm-input" placeholder="e.g. Zone 3" value={form.wind_zone} onChange={e => setForm(f => ({ ...f, wind_zone: e.target.value }))} />
              </div>
              <div>
                <label className="crm-label">Flood Zone</label>
                <input className="crm-input" placeholder="e.g. 100-year" value={form.flood_zone} onChange={e => setForm(f => ({ ...f, flood_zone: e.target.value }))} />
              </div>
              <div>
                <label className="crm-label">Structural Compliance %</label>
                <input className="crm-input" type="number" min="0" max="100" placeholder="e.g. 78" value={form.structural_compliance_rating} onChange={e => setForm(f => ({ ...f, structural_compliance_rating: e.target.value }))} />
              </div>
              <div>
                <label className="crm-label">Construction Year</label>
                <input className="crm-input" type="number" placeholder="e.g. 2018" value={form.construction_year} onChange={e => setForm(f => ({ ...f, construction_year: e.target.value }))} />
              </div>
              <div>
                <label className="crm-label">Broker</label>
                <select className="crm-select" value={form.broker_id} onChange={e => setForm(f => ({ ...f, broker_id: e.target.value }))}>
                  <option value="">No broker</option>
                  {brokers.map(b => <option key={b.id} value={b.id}>{b.name} — {b.company}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="crm-label">Property Address</label>
                <input className="crm-input" placeholder="Full property address" value={form.property_address} onChange={e => setForm(f => ({ ...f, property_address: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="crm-label">Notes</label>
                <textarea className="crm-input" rows={3} placeholder="Underwriting notes, special conditions…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Create Policy Quote'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
