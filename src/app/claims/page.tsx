'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatStatus, getIslandLabel, getIslandFlag, CLAIM_STATUS_STYLES, FRAUD_RISK_STYLES } from '@/lib/utils'
import { Island, CoverageType, CatastropheEvent, COVERAGE_LABELS, ISLAND_LABELS } from '@/types'

const CLAIM_WORKFLOW: Record<string, string> = {
  fnol_received: 'under_review',
  under_review: 'adjuster_assigned',
  adjuster_assigned: 'inspection_scheduled',
  inspection_scheduled: 'assessment_complete',
  assessment_complete: 'approved',
  approved: 'settled',
}

const EMPTY_FORM = {
  policy_id: '', coverage_type: 'residential' as CoverageType,
  catastrophe_event: '' as CatastropheEvent | '', storm_name: '',
  incident_date: '', reported_loss: '', currency: 'USD',
  description: '', property_address: '', island: 'barbados' as Island,
}

export default function ClaimsPage() {
  const supabase = createClient()
  const [claims, setClaims] = useState<any[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [adjusters, setAdjusters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterIsland, setFilterIsland] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  async function load() {
    const [claimRes, policyRes, adjRes] = await Promise.all([
      supabase.from('claims').select(`*, policies(policy_number), clients(first_name, last_name, company_name)`).order('created_at', { ascending: false }),
      supabase.from('policies').select('id, policy_number, client_id, coverage_type, island, currency'),
      supabase.from('adjusters').select('*'),
    ])
    setClaims(claimRes.data || [])
    setPolicies(policyRes.data || [])
    setAdjusters(adjRes.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = claims.filter(c => {
    const clientName = c.clients ? `${c.clients.first_name} ${c.clients.last_name}`.toLowerCase() : ''
    const matchSearch = !search || c.claim_number?.toLowerCase().includes(search.toLowerCase()) || clientName.includes(search.toLowerCase()) || c.storm_name?.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (!filterStatus || c.status === filterStatus) && (!filterIsland || c.island === filterIsland)
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const policy = policies.find(p => p.id === form.policy_id)
    const claimNumber = `CLM-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
    const { error } = await supabase.from('claims').insert({
      ...form,
      claim_number: claimNumber,
      client_id: policy?.client_id,
      coverage_type: policy?.coverage_type || form.coverage_type,
      island: policy?.island || form.island,
      currency: policy?.currency || form.currency,
      reported_loss: parseFloat(form.reported_loss),
      fnol_date: new Date().toISOString().split('T')[0],
      status: 'fnol_received',
      fraud_risk: 'clear',
      catastrophe_event: form.catastrophe_event || undefined,
    })
    if (!error) { setShowForm(false); setForm(EMPTY_FORM); load() }
    setSaving(false)
  }

  async function advanceStatus(id: string, currentStatus: string) {
    const next = CLAIM_WORKFLOW[currentStatus]
    if (!next) return
    await supabase.from('claims').update({ status: next }).eq('id', id)
    load()
    if (selected?.id === id) setSelected((c: any) => ({ ...c, status: next }))
  }

  async function assignAdjuster(claimId: string, adjusterId: string) {
    await supabase.from('claims').update({ adjuster_id: adjusterId, status: 'adjuster_assigned' }).eq('id', claimId)
    load()
    if (selected?.id === claimId) setSelected((c: any) => ({ ...c, adjuster_id: adjusterId, status: 'adjuster_assigned' }))
  }

  async function updateFraud(id: string, fraud_risk: string) {
    const status = fraud_risk === 'flagged' || fraud_risk === 'confirmed_fraud' ? 'fraud_investigation' : undefined
    await supabase.from('claims').update({ fraud_risk, ...(status ? { status } : {}) }).eq('id', id)
    load()
    if (selected?.id === id) setSelected((c: any) => ({ ...c, fraud_risk, ...(status ? { status } : {}) }))
  }

  const openClaims = filtered.filter(c => !['settled','rejected'].includes(c.status))
  const totalReported = filtered.reduce((s, c) => s + (c.reported_loss || 0), 0)
  const fraudFlags = filtered.filter(c => c.fraud_risk !== 'clear').length

  return (
    <div className="page-enter" style={{ padding: '2rem', minHeight: '100vh', background: '#0a0f1e' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>FNOL · Adjuster Routing · Settlement</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: 0 }}>Claims Management</h1>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.12em', color: '#8fa3b8', marginTop: '0.3rem' }}>
            Catastrophe Surge Workflow · 24hr FNOL Acknowledgement
          </div>
        </div>
        <button className="btn-gold" onClick={() => setShowForm(true)}>+ File FNOL</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '1.5rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Open Claims', value: openClaims.length.toString(), color: '#e8b04a' },
          { label: 'Total Reported Loss', value: formatCurrency(totalReported, 'USD', true), color: '#c0392b' },
          { label: 'Fraud Flags', value: fraudFlags.toString(), color: fraudFlags > 0 ? '#fc8181' : '#27ae60' },
          { label: 'Post-Beryl Claims', value: filtered.filter(c => c.storm_name === 'Beryl').length.toString(), color: '#e67e22' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#111827', padding: '1rem 1.2rem' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8fa3b8' }}>{k.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 900, color: k.color, marginTop: '0.2rem' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        <input className="crm-input" style={{ maxWidth: 260 }} placeholder="Search claim #, client, storm…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="crm-select" style={{ maxWidth: 190 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {['fnol_received','under_review','adjuster_assigned','inspection_scheduled','assessment_complete','approved','partial_approved','settled','rejected','fraud_investigation'].map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
        </select>
        <select className="crm-select" style={{ maxWidth: 160 }} value={filterIsland} onChange={e => setFilterIsland(e.target.value)}>
          <option value="">All Islands</option>
          {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.12)', overflow: 'auto' }}>
        <table className="crm-table">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Client</th>
              <th>Policy</th>
              <th>Event</th>
              <th>Reported Loss</th>
              <th>Status</th>
              <th>Fraud Risk</th>
              <th>Island</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#8fa3b8' }}>Loading claims…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#8fa3b8' }}>No claims found. Use the website to file FNOL or add sample data.</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(c)}>
                <td style={{ fontFamily: 'Barlow Condensed', color: '#c9933a', fontSize: '0.82rem', fontWeight: 600 }}>{c.claim_number}</td>
                <td>
                  <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: '#f5f0e8' }}>{c.clients ? `${c.clients.first_name} ${c.clients.last_name}` : '—'}</div>
                  {c.clients?.company_name && <div style={{ fontSize: '0.72rem', color: '#8fa3b8' }}>{c.clients.company_name}</div>}
                </td>
                <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: '#8fa3b8' }}>{c.policies?.policy_number || '—'}</td>
                <td>
                  {c.catastrophe_event && <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: '#e8b04a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{c.catastrophe_event}</div>}
                  {c.storm_name && <div style={{ fontFamily: 'Barlow', fontSize: '0.72rem', color: '#8fa3b8' }}>{c.storm_name}</div>}
                </td>
                <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: '#fc8181' }}>{formatCurrency(c.reported_loss, c.currency, true)}</td>
                <td>
                  <span className={`badge ${CLAIM_STATUS_STYLES[c.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>{formatStatus(c.status)}</span>
                </td>
                <td>
                  <span className={`badge ${FRAUD_RISK_STYLES[c.fraud_risk] || 'bg-green-900/30 text-green-400 border-green-800'}`}>{formatStatus(c.fraud_risk)}</span>
                </td>
                <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem' }}>{getIslandFlag(c.island)} {getIslandLabel(c.island)}</td>
                <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: '#8fa3b8' }}>{formatDate(c.incident_date)}</td>
                <td onClick={e => e.stopPropagation()}>
                  {CLAIM_WORKFLOW[c.status] && (
                    <button className="btn-gold" style={{ padding: '0.3rem 0.6rem', fontSize: '0.62rem' }} onClick={() => advanceStatus(c.id, c.status)}>
                      → {formatStatus(CLAIM_WORKFLOW[c.status])}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Claim Detail */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 660, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Claim File</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{selected.claim_number}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: '#8fa3b8', marginTop: '0.2rem' }}>
                  {selected.clients ? `${selected.clients.first_name} ${selected.clients.last_name}` : ''} · {selected.policies?.policy_number}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8fa3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {/* Fraud Alert Banner */}
              {selected.fraud_risk !== 'clear' && (
                <div style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', padding: '0.8rem 1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: '#fc8181', fontSize: '1rem' }}>⚠</span>
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fc8181' }}>Fraud Risk: {formatStatus(selected.fraud_risk)}</div>
                    {selected.fraud_flags?.length > 0 && <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: '#8fa3b8', marginTop: '0.2rem' }}>{selected.fraud_flags.join(' · ')}</div>}
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                {[
                  ['Status', <span key="s" className={`badge ${CLAIM_STATUS_STYLES[selected.status] || ''}`}>{formatStatus(selected.status)}</span>],
                  ['Fraud Risk', <span key="f" className={`badge ${FRAUD_RISK_STYLES[selected.fraud_risk] || ''}`}>{formatStatus(selected.fraud_risk)}</span>],
                  ['Event', selected.catastrophe_event ? `${selected.catastrophe_event}${selected.storm_name ? ` — ${selected.storm_name}` : ''}` : '—'],
                  ['Incident Date', formatDate(selected.incident_date)],
                  ['FNOL Date', formatDate(selected.fnol_date)],
                  ['Island', `${getIslandFlag(selected.island)} ${getIslandLabel(selected.island)}`],
                  ['Reported Loss', formatCurrency(selected.reported_loss, selected.currency)],
                  ['Assessed Loss', selected.assessed_loss ? formatCurrency(selected.assessed_loss, selected.currency) : 'Pending'],
                  ['Approved Amount', selected.approved_amount ? formatCurrency(selected.approved_amount, selected.currency) : 'Pending'],
                  ['Settlement', selected.settlement_amount ? formatCurrency(selected.settlement_amount, selected.currency) : 'Pending'],
                ].map(([label, value], i) => (
                  <div key={i}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>{label}</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.88rem', color: '#f5f0e8' }}>{value as any}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>Description</div>
                <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: '#8fa3b8', lineHeight: 1.65 }}>{selected.description}</div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>Property Address</div>
                <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: '#f5f0e8' }}>{selected.property_address}</div>
              </div>
              {/* Assign Adjuster */}
              {['fnol_received','under_review'].includes(selected.status) && (
                <div style={{ background: 'rgba(46,64,96,0.3)', border: '1px solid rgba(201,147,58,0.15)', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '0.6rem' }}>Assign Adjuster</div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {adjusters.filter(a => a.is_available).map(a => (
                      <button key={a.id} className="btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.72rem' }} onClick={() => assignAdjuster(selected.id, a.id)}>
                        {a.name} · {getIslandFlag(a.island)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Fraud Actions */}
              <div style={{ background: 'rgba(46,64,96,0.2)', border: '1px solid rgba(201,147,58,0.1)', padding: '1rem' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '0.6rem' }}>Fraud Intelligence</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['clear','watch','suspicious','flagged'].map(fr => (
                    <button key={fr} onClick={() => updateFraud(selected.id, fr)} style={{ padding: '0.3rem 0.7rem', fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', background: selected.fraud_risk === fr ? 'rgba(201,147,58,0.2)' : 'transparent', border: '1px solid rgba(201,147,58,0.2)', color: selected.fraud_risk === fr ? '#e8b04a' : '#8fa3b8', cursor: 'pointer', transition: 'all 0.2s' }}>
                      {fr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,147,58,0.1)', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              {CLAIM_WORKFLOW[selected.status] && (
                <button className="btn-gold" onClick={() => advanceStatus(selected.id, selected.status)}>
                  Advance to: {formatStatus(CLAIM_WORKFLOW[selected.status])}
                </button>
              )}
              {selected.status === 'assessment_complete' && (
                <button className="btn-danger" onClick={() => { supabase.from('claims').update({ status: 'rejected' }).eq('id', selected.id).then(() => { load(); setSelected((c: any) => ({ ...c, status: 'rejected' })) }) }}>
                  Reject Claim
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FNOL Form */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>First Notice of Loss</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>File New Claim</div>
            </div>
            <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="crm-label">Policy *</label>
                <select className="crm-select" value={form.policy_id} onChange={e => setForm(f => ({ ...f, policy_id: e.target.value }))} required>
                  <option value="">Select policy…</option>
                  {policies.map(p => <option key={p.id} value={p.id}>{p.policy_number} — {p.island}</option>)}
                </select>
              </div>
              <div>
                <label className="crm-label">Catastrophe Event</label>
                <select className="crm-select" value={form.catastrophe_event} onChange={e => setForm(f => ({ ...f, catastrophe_event: e.target.value as CatastropheEvent }))}>
                  <option value="">None / Non-cat</option>
                  {['hurricane','tropical_storm','flood','earthquake','fire','other'].map(e => <option key={e} value={e}>{formatStatus(e)}</option>)}
                </select>
              </div>
              <div>
                <label className="crm-label">Storm / Event Name</label>
                <input className="crm-input" placeholder="e.g. Hurricane Beryl" value={form.storm_name} onChange={e => setForm(f => ({ ...f, storm_name: e.target.value }))} />
              </div>
              <div>
                <label className="crm-label">Incident Date *</label>
                <input className="crm-input" type="date" value={form.incident_date} onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))} required />
              </div>
              <div>
                <label className="crm-label">Reported Loss (Amount) *</label>
                <input className="crm-input" type="number" placeholder="e.g. 150000" value={form.reported_loss} onChange={e => setForm(f => ({ ...f, reported_loss: e.target.value }))} required />
              </div>
              <div>
                <label className="crm-label">Currency</label>
                <select className="crm-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  {['USD','BBD','JMD','KYD','TTD','BSD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="crm-label">Property Address *</label>
                <input className="crm-input" placeholder="Full address of damaged property" value={form.property_address} onChange={e => setForm(f => ({ ...f, property_address: e.target.value }))} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="crm-label">Damage Description *</label>
                <textarea className="crm-input" rows={3} placeholder="Describe the damage in detail…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Filing…' : 'File FNOL'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
