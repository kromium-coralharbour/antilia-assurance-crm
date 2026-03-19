'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Toast, useToast } from '@/components/Toast'
import { Pagination } from '@/components/Pagination'
import { ConfirmDialog } from '@/components/ConfirmDialog'
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

const EMPTY_SURGE = {
  name: '', event_type: 'hurricane', islands: [] as string[], notes: '', expected_claims: '',
}

export default function ClaimsPage() {
  const supabase = createClient()
  const [claims, setClaims] = useState<any[]>([])
  const [policies, setPolicies] = useState<any[]>([])
  const [adjusters, setAdjusters] = useState<any[]>([])
  const [surgeEvents, setSurgeEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterIsland, setFilterIsland] = useState('')
  const [filterSurge, setFilterSurge] = useState('')

  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [activeTab, setActiveTab] = useState<'claims' | 'surge'>('claims')
  const [showForm, setShowForm] = useState(false)
  const [showSurgeForm, setShowSurgeForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [surgeForm, setSurgeForm] = useState(EMPTY_SURGE)
  const [saving, setSaving] = useState(false)
  const { toast, show: showToast, hide: hideToast } = useToast()
  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 15
  const [surgeSaving, setSurgeSaving] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [editAmounts, setEditAmounts] = useState(false)
  const [amountForm, setAmountForm] = useState({ assessed_loss: '', approved_amount: '', settlement_amount: '' })

  async function load() {
    const [claimRes, policyRes, adjRes, surgeRes] = await Promise.all([
      supabase.from('claims').select(`*, policies(policy_number), clients(first_name, last_name, company_name)`).order('created_at', { ascending: false }),
      supabase.from('policies').select('id, policy_number, client_id, coverage_type, island, currency'),
      supabase.from('adjusters').select('*'),
      supabase.from('cat_surge_events').select('*').order('created_at', { ascending: false }),
    ])
    setClaims(claimRes.data || [])
    setPolicies(policyRes.data || [])
    setAdjusters(adjRes.data || [])
    setSurgeEvents(surgeRes.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }
  const sortIcon = (col: string) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'

  const filtered = claims.filter(c => {
    const clientName = c.clients ? `${c.clients.first_name} ${c.clients.last_name}`.toLowerCase() : ''
    return (!search || c.claim_number?.toLowerCase().includes(search.toLowerCase()) || clientName.includes(search.toLowerCase()) || c.storm_name?.toLowerCase().includes(search.toLowerCase()))
      && (!filterStatus || c.status === filterStatus)
      && (!filterIsland || c.island === filterIsland)
      && (!filterSurge || c.storm_name?.toLowerCase().includes(filterSurge.toLowerCase()) || c.catastrophe_event === filterSurge)
  }).sort((a, b) => {
    let av: any, bv: any
    if (sortBy === 'reported_loss') { av = a.reported_loss || 0; bv = b.reported_loss || 0 }
    else if (sortBy === 'incident_date') { av = a.incident_date || ''; bv = b.incident_date || '' }
    else if (sortBy === 'status') { av = a.status || ''; bv = b.status || '' }
    else { av = a.created_at || ''; bv = b.created_at || '' }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
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
    if (!error) { setShowForm(false); setForm(EMPTY_FORM); load(); showToast('Claim filed successfully.', 'success') } else { showToast('FNOL submission failed.', 'error') }
    setSaving(false)
  }

  async function handleSurge(e: React.FormEvent) {
    e.preventDefault()
    setSurgeSaving(true)
    const { error } = await supabase.from('cat_surge_events').insert({
      ...surgeForm,
      expected_claims: parseInt(surgeForm.expected_claims) || 0,
      status: 'active',
      activated_by: 'AAG Staff',
    })
    if (!error) { setShowSurgeForm(false); setSurgeForm(EMPTY_SURGE); load() }
    setSurgeSaving(false)
  }

  async function closeSurge(id: string) {
    await supabase.from('cat_surge_events').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  async function updateSurgeStatus(id: string, status: string) {
    await supabase.from('cat_surge_events').update({ status }).eq('id', id)
    load()
  }

  async function saveAmounts() {
    if (!selected) return
    const updates: any = {}
    if (amountForm.assessed_loss) updates.assessed_loss = parseFloat(amountForm.assessed_loss)
    if (amountForm.approved_amount) updates.approved_amount = parseFloat(amountForm.approved_amount)
    if (amountForm.settlement_amount) updates.settlement_amount = parseFloat(amountForm.settlement_amount)
    await supabase.from('claims').update(updates).eq('id', selected.id)
    setSelected((c: any) => ({ ...c, ...updates }))
    setEditAmounts(false)
    load()
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
    const status = ['flagged','confirmed_fraud'].includes(fraud_risk) ? 'fraud_investigation' : undefined
    await supabase.from('claims').update({ fraud_risk, ...(status ? { status } : {}) }).eq('id', id)
    load()
    if (selected?.id === id) setSelected((c: any) => ({ ...c, fraud_risk, ...(status ? { status } : {}) }))
  }

  const activeSurge = surgeEvents.filter(s => s.status === 'active')
  // Reset to page 1 when filters/sort change — handled via useEffect-free approach:
  // slice filtered for current page
  const totalFiltered = filtered.length
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const openClaims = filtered.filter(c => !['settled','rejected'].includes(c.status))
  const totalReported = filtered.reduce((s, c) => s + (c.reported_loss || 0), 0)
  const fraudFlags = filtered.filter(c => c.fraud_risk !== 'clear').length

  // Per-adjuster load for surge mode
  const adjusterLoad = adjusters.map(a => ({
    ...a,
    activeClaims: claims.filter(c => c.adjuster_id === a.id && !['settled','rejected'].includes(c.status)).length,
  }))

  async function handleDelete(claim: any) {
    const { error } = await supabase.from('claims').delete().eq('id', claim.id)
    if (error) {
      showToast('Delete failed.', 'error')
    } else {
      showToast(`Claim ${claim.claim_number} deleted.`, 'success')
      setSelected(null)
      load()
    }
    setConfirmDelete(null)
  }

  return (
    <div className="page-enter" style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>FNOL · Adjuster Routing · Settlement</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Claims Management</h1>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--text-mist)', marginTop: '0.3rem' }}>
            Catastrophe Surge Workflow · 24hr FNOL Acknowledgement
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button className="btn-danger" onClick={() => { setActiveTab('surge'); setShowSurgeForm(true) }}>⚡ Activate CAT Surge</button>
          <button className="btn-gold" onClick={() => setShowForm(true)}>+ File FNOL</button>
        </div>
      </div>

      {/* Active Surge Banner */}
      {activeSurge.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem 1.2rem', background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.35)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c0392b', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
            <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#fc8181' }}>CAT SURGE ACTIVE</span>
          </div>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.85rem', color: 'var(--text-primary)', flex: 1 }}>
            {activeSurge.map(s => s.name).join(' · ')} — Enhanced triage mode · All adjusters on standby
          </div>
          <button onClick={() => setActiveTab('surge')} style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)', color: '#fc8181', padding: '0.4rem 0.8rem', cursor: 'pointer' }}>
            Surge Dashboard →
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '1.5rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Open Claims', value: openClaims.length.toString(), color: 'var(--text-amber)' },
          { label: 'Total Reported Loss', value: formatCurrency(totalReported, 'USD', true), color: '#fc8181' },
          { label: 'Fraud Flags', value: fraudFlags.toString(), color: fraudFlags > 0 ? '#fc8181' : '#4ade80' },
          { label: 'Active Surge Events', value: activeSurge.length.toString(), color: activeSurge.length > 0 ? '#fc8181' : 'var(--text-dim)' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', padding: '1rem 1.2rem' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-mist)' }}>{k.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 900, color: k.color, marginTop: '0.2rem' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,147,58,0.1)', marginBottom: '1.5rem' }}>
        {[['claims', 'Claims Register'], ['surge', `CAT Surge Mode ${activeSurge.length > 0 ? `(${activeSurge.length} Active)` : ''}`]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id as any)} style={{
            padding: '0.8rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            color: activeTab === id ? (id === 'surge' && activeSurge.length > 0 ? '#fc8181' : '#c9933a') : 'var(--text-dim)',
            borderBottom: activeTab === id ? `2px solid ${id === 'surge' && activeSurge.length > 0 ? '#c0392b' : '#c9933a'}` : '2px solid transparent',
            marginBottom: '-1px',
          }}>{label}</button>
        ))}
      </div>

      {/* ── CLAIMS REGISTER TAB ── */}
      {activeTab === 'claims' && (
        <>
          <div className="filter-bar" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
            <input className="crm-input" style={{ maxWidth: 240 }} placeholder="Search claim #, client, storm…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            <select className="crm-select" style={{ maxWidth: 180 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
              <option value="">All Statuses</option>
              {['fnol_received','under_review','adjuster_assigned','inspection_scheduled','assessment_complete','approved','partial_approved','settled','rejected','fraud_investigation'].map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
            </select>
            <select className="crm-select" style={{ maxWidth: 150 }} value={filterIsland} onChange={e => { setFilterIsland(e.target.value); setPage(1) }}>
              <option value="">All Islands</option>
              {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.12)' }}>
            <div className="table-scroll"><table className="crm-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('created_at')}>Claim #{sortIcon('created_at')}</th><th>Client</th><th>Policy</th><th>Event</th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('reported_loss')}>Reported Loss{sortIcon('reported_loss')}</th><th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('status')}>Status{sortIcon('status')}</th><th>Fraud Risk</th>
                  <th>Island</th><th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('incident_date')}>Date{sortIcon('incident_date')}</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-mist)' }}>Loading claims…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-mist)' }}>No claims found.</td></tr>
                ) : paged.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(c)}>
                    <td style={{ fontFamily: 'Barlow Condensed', color: '#c9933a', fontSize: '0.82rem', fontWeight: 600 }}>{c.claim_number}</td>
                    <td>
                      <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{c.clients ? `${c.clients.first_name} ${c.clients.last_name}` : '—'}</div>
                      {c.clients?.company_name && <div style={{ fontSize: '0.72rem', color: 'var(--text-mist)' }}>{c.clients.company_name}</div>}
                    </td>
                    <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: 'var(--text-mist)' }}>{c.policies?.policy_number || '—'}</td>
                    <td>
                      {c.catastrophe_event && <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', color: 'var(--text-amber)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{c.catastrophe_event}</div>}
                      {c.storm_name && <div style={{ fontFamily: 'Barlow', fontSize: '0.72rem', color: 'var(--text-mist)' }}>{c.storm_name}</div>}
                    </td>
                    <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: '#fc8181' }}>{formatCurrency(c.reported_loss, c.currency, true)}</td>
                    <td><span className={`badge ${CLAIM_STATUS_STYLES[c.status] || ''}`}>{formatStatus(c.status)}</span></td>
                    <td><span className={`badge ${FRAUD_RISK_STYLES[c.fraud_risk] || ''}`}>{formatStatus(c.fraud_risk)}</span></td>
                    <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem' }}>{getIslandFlag(c.island)} {getIslandLabel(c.island)}</td>
                    <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: 'var(--text-mist)' }}>{formatDate(c.incident_date)}</td>
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
            </table></div>
          </div>
        </>
      )}

      {/* ── CAT SURGE MODE TAB ── */
              <Pagination total={totalFiltered} page={page} perPage={PER_PAGE} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
      {activeTab === 'surge' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fc8181', marginBottom: '0.3rem' }}>Catastrophe Response Operations</div>
              <div style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: 'var(--text-mist)' }}>Activate surge mode when a named storm or cat event triggers mass claims intake</div>
            </div>
            <button className="btn-danger" onClick={() => setShowSurgeForm(true)}>⚡ Activate New Event</button>
          </div>

          {/* Surge Events */}
          {surgeEvents.length === 0 ? (
            <div className="crm-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⛈️</div>
              <div style={{ fontFamily: 'Barlow Condensed', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.82rem' }}>No CAT surge events recorded</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {surgeEvents.map(surge => {
                const surgeClaims = claims.filter(c => c.storm_name?.toLowerCase().includes(surge.name.toLowerCase()) || (c.catastrophe_event === surge.event_type && surge.status === 'active'))
                const surgeOpen = surgeClaims.filter(c => !['settled','rejected'].includes(c.status)).length
                const surgeSettled = surgeClaims.filter(c => c.status === 'settled').length
                const surgeLoss = surgeClaims.reduce((s, c) => s + (c.reported_loss || 0), 0)
                const pct = surge.expected_claims > 0 ? Math.round((surgeClaims.length / surge.expected_claims) * 100) : 0

                return (
                  <div key={surge.id} style={{ background: 'var(--bg-card)', border: `1px solid ${surge.status === 'active' ? 'rgba(192,57,43,0.4)' : 'rgba(201,147,58,0.12)'}` }}>
                    <div style={{ padding: '1.2rem 1.5rem', borderBottom: `1px solid ${surge.status === 'active' ? 'rgba(192,57,43,0.2)' : 'rgba(201,147,58,0.08)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                          {surge.status === 'active' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c0392b', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />}
                          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: surge.status === 'active' ? '#fc8181' : 'var(--text-primary)' }}>{surge.name}</span>
                          <span className="badge" style={{ background: surge.status === 'active' ? 'rgba(192,57,43,0.2)' : surge.status === 'monitoring' ? 'rgba(241,196,15,0.15)' : 'var(--bg-raised)', borderColor: surge.status === 'active' ? 'rgba(192,57,43,0.4)' : surge.status === 'monitoring' ? 'rgba(241,196,15,0.3)' : 'var(--bg-raised)', color: surge.status === 'active' ? '#fc8181' : surge.status === 'monitoring' ? '#f1c40f' : 'var(--text-mist)' }}>
                            {surge.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: 'var(--text-mist)' }}>
                          {formatStatus(surge.event_type)} · Activated {formatDate(surge.activated_at)} · By {surge.activated_by}
                        </div>
                        {surge.islands?.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                            {surge.islands.map((isl: string) => (
                              <span key={isl} style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.2)', color: '#fc8181', padding: '0.15rem 0.5rem' }}>
                                {getIslandFlag(isl as Island)} {getIslandLabel(isl as Island)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {surge.status === 'active' && <button className="btn-ghost" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }} onClick={() => updateSurgeStatus(surge.id, 'monitoring')}>→ Monitoring</button>}
                        {['active','monitoring'].includes(surge.status) && <button className="btn-ghost" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', color: '#4ade80', borderColor: 'rgba(39,174,96,0.3)' }} onClick={() => closeSurge(surge.id)}>Close Event</button>}
                      </div>
                    </div>

                    {/* Surge Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(192,57,43,0.08)' }}>
                      {[
                        { label: 'Claims Filed', value: surgeClaims.length.toString(), sub: `of ${surge.expected_claims || '?'} expected` },
                        { label: 'Open / Active', value: surgeOpen.toString(), sub: 'in workflow' },
                        { label: 'Settled', value: surgeSettled.toString(), sub: 'completed' },
                        { label: 'Total Reported Loss', value: formatCurrency(surgeLoss, 'USD', true), sub: 'reported' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: 'var(--bg-card)', padding: '0.8rem 1rem' }}>
                          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-mist)' }}>{s.label}</div>
                          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: '1.4rem', color: '#fc8181' }}>{s.value}</div>
                          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-dim)' }}>{s.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Intake progress */}
                    {surge.expected_claims > 0 && (
                      <div style={{ padding: '0.8rem 1.5rem', borderTop: '1px solid rgba(192,57,43,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                          <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-mist)' }}>Intake Progress</span>
                          <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: '#fc8181', fontWeight: 700 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg-raised)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: '#c0392b', borderRadius: 2, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    )}

                    {/* Adjuster Load Balancing */}
                    {surge.status === 'active' && (
                      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(192,57,43,0.1)' }}>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '0.8rem' }}>Adjuster Load · Real-Time</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {adjusterLoad.map(a => (
                            <div key={a.id} style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-input)', border: `1px solid ${a.is_available ? 'rgba(39,174,96,0.25)' : 'rgba(192,57,43,0.25)'}`, minWidth: 120 }}>
                              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>{a.name}</div>
                              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', color: 'var(--text-mist)' }}>{getIslandFlag(a.island)} {getIslandLabel(a.island)}</div>
                              <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: a.activeClaims > 5 ? '#fc8181' : a.activeClaims > 2 ? '#e8b04a' : '#4ade80' }}>{a.activeClaims}</span>
                                <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', color: 'var(--text-dim)' }}>active</span>
                              </div>
                              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', color: a.is_available ? '#4ade80' : '#fc8181', marginTop: '0.2rem' }}>
                                {a.is_available ? '● Available' : '● Unavailable'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {surge.notes && (
                      <div style={{ padding: '0.6rem 1.5rem 1rem', borderTop: '1px solid rgba(201,147,58,0.06)' }}>
                        <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>{surge.notes}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CLAIM DETAIL MODAL ── */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 660, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Claim File</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.claim_number}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: 'var(--text-mist)', marginTop: '0.2rem' }}>
                  {selected.clients ? `${selected.clients.first_name} ${selected.clients.last_name}` : ''} · {selected.policies?.policy_number}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-mist)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {selected.fraud_risk !== 'clear' && (
                <div style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', padding: '0.8rem 1rem', marginBottom: '1.2rem' }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fc8181' }}>⚠ Fraud Risk: {formatStatus(selected.fraud_risk)}</div>
                  {selected.fraud_flags?.length > 0 && <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: 'var(--text-mist)', marginTop: '0.2rem' }}>{selected.fraud_flags.join(' · ')}</div>}
                </div>
              )}
              <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                {[
                  ['Status', <span key="s" className={`badge ${CLAIM_STATUS_STYLES[selected.status] || ''}`}>{formatStatus(selected.status)}</span>],
                  ['Fraud Risk', <span key="f" className={`badge ${FRAUD_RISK_STYLES[selected.fraud_risk] || ''}`}>{formatStatus(selected.fraud_risk)}</span>],
                  ['Event', selected.catastrophe_event ? `${formatStatus(selected.catastrophe_event)}${selected.storm_name ? ` — ${selected.storm_name}` : ''}` : '—'],
                  ['Incident Date', formatDate(selected.incident_date)],
                  ['FNOL Date', formatDate(selected.fnol_date)],
                  ['Island', `${getIslandFlag(selected.island)} ${getIslandLabel(selected.island)}`],
                  ['Reported Loss', formatCurrency(selected.reported_loss, selected.currency)],
                  ['Assessed Loss', selected.assessed_loss ? formatCurrency(selected.assessed_loss, selected.currency) : 'Pending'],
                  ['Approved Amount', selected.approved_amount ? formatCurrency(selected.approved_amount, selected.currency) : 'Pending'],
                  ['Settlement', selected.settlement_amount ? formatCurrency(selected.settlement_amount, selected.currency) : 'Pending'],
                  ['Assigned Adjuster', adjusters.find(a => a.id === selected.adjuster_id)?.name || '—'],
                  ['Policy', selected.policies?.policy_number || '—'],
                ].map(([label, value], i) => (
                  <div key={i}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>{label}</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{value as any}</div>
                  </div>
                ))}
              </div>
              {selected.description && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Description</div>
                  <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: 'var(--text-mist)', lineHeight: 1.65 }}>{selected.description}</div>
                </div>
              )}
              {/* Financial amounts editing */}
              {['assessment_complete','approved','partial_approved'].includes(selected.status) && (
                <div style={{ background: 'rgba(var(--raised-rgb),0.2)', border: '1px solid rgba(201,147,58,0.12)', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9933a' }}>Financial Assessment</div>
                    <button onClick={() => { setEditAmounts(!editAmounts); setAmountForm({ assessed_loss: String(selected.assessed_loss || ''), approved_amount: String(selected.approved_amount || ''), settlement_amount: String(selected.settlement_amount || '') }) }} className="btn-ghost" style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem' }}>{editAmounts ? 'Cancel' : 'Edit Amounts'}</button>
                  </div>
                  {editAmounts ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div><label className="crm-label">Assessed Loss</label><input className="crm-input" type="number" placeholder="0" value={amountForm.assessed_loss} onChange={e => setAmountForm(f => ({ ...f, assessed_loss: e.target.value }))} /></div>
                      <div><label className="crm-label">Approved Amount</label><input className="crm-input" type="number" placeholder="0" value={amountForm.approved_amount} onChange={e => setAmountForm(f => ({ ...f, approved_amount: e.target.value }))} /></div>
                      <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Settlement Amount</label><input className="crm-input" type="number" placeholder="0" value={amountForm.settlement_amount} onChange={e => setAmountForm(f => ({ ...f, settlement_amount: e.target.value }))} /></div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}><button className="btn-gold" style={{ fontSize: '0.72rem', padding: '0.5rem 1rem' }} onClick={saveAmounts}>Save Amounts</button></div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      {[['Assessed', selected.assessed_loss], ['Approved', selected.approved_amount], ['Settlement', selected.settlement_amount]].map(([l, v]: any) => (
                        <div key={l} style={{ background: 'rgba(10,15,30,0.4)', padding: '0.5rem 0.7rem' }}>
                          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>{l}</div>
                          <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, color: v ? '#4ade80' : 'var(--text-dim)', fontSize: '0.85rem' }}>{v ? formatCurrency(v, selected.currency, true) : 'Pending'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {['fnol_received','under_review'].includes(selected.status) && (
                <div style={{ background: 'var(--bg-raised)', border: '1px solid rgba(201,147,58,0.15)', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '0.6rem' }}>Assign Adjuster</div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {adjusters.filter(a => a.is_available).map(a => (
                      <button key={a.id} className="btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.72rem' }} onClick={() => assignAdjuster(selected.id, a.id)}>
                        {a.name} · {getIslandFlag(a.island)} · {adjusterLoad.find(al => al.id === a.id)?.activeClaims || 0} active
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ background: 'rgba(var(--raised-rgb),0.2)', border: '1px solid rgba(201,147,58,0.1)', padding: '1rem' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '0.6rem' }}>Fraud Intelligence Rating</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['clear','watch','suspicious','flagged','confirmed_fraud'].map(fr => (
                    <button key={fr} onClick={() => updateFraud(selected.id, fr)} style={{ padding: '0.3rem 0.7rem', fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', background: selected.fraud_risk === fr ? 'rgba(201,147,58,0.2)' : 'transparent', border: '1px solid rgba(201,147,58,0.2)', color: selected.fraud_risk === fr ? '#e8b04a' : 'var(--text-mist)', cursor: 'pointer' }}>{fr}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,147,58,0.1)', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              {CLAIM_WORKFLOW[selected.status] && (
                <button className="btn-gold" onClick={() => advanceStatus(selected.id, selected.status)}>
                  Advance → {formatStatus(CLAIM_WORKFLOW[selected.status])}
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

      {/* ── FNOL FORM ── */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>First Notice of Loss</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>File New Claim</div>
            </div>
            <form onSubmit={handleSave} className="two-col-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                  {['hurricane','tropical_storm','flood','earthquake','fire','other'].map(ev => <option key={ev} value={ev}>{formatStatus(ev)}</option>)}
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
                <label className="crm-label">Reported Loss *</label>
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

      {/* ── CAT SURGE ACTIVATION FORM ── */}
      {showSurgeForm && (
        <div className="modal-backdrop" onClick={() => setShowSurgeForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(192,57,43,0.4)', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(192,57,43,0.2)', background: 'rgba(192,57,43,0.06)' }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#fc8181', marginBottom: '0.4rem' }}>⚡ Emergency Protocol</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Activate CAT Surge Mode</div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: 'var(--text-mist)', marginTop: '0.2rem' }}>
                This will activate all-hands surge protocols and alert the claims team.
              </div>
            </div>
            <form onSubmit={handleSurge} className="two-col-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="crm-label">Event Name *</label>
                <input className="crm-input" placeholder="e.g. Hurricane Milton" value={surgeForm.name} onChange={e => setSurgeForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="crm-label">Event Type *</label>
                <select className="crm-select" value={surgeForm.event_type} onChange={e => setSurgeForm(f => ({ ...f, event_type: e.target.value }))}>
                  {['hurricane','tropical_storm','flood','earthquake','fire','other'].map(ev => <option key={ev} value={ev}>{formatStatus(ev)}</option>)}
                </select>
              </div>
              <div>
                <label className="crm-label">Expected Claims</label>
                <input className="crm-input" type="number" placeholder="e.g. 80" value={surgeForm.expected_claims} onChange={e => setSurgeForm(f => ({ ...f, expected_claims: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="crm-label">Affected Islands</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  {Object.entries(ISLAND_LABELS).map(([k, v]) => (
                    <button type="button" key={k} onClick={() => setSurgeForm(f => ({ ...f, islands: f.islands.includes(k) ? f.islands.filter(i => i !== k) : [...f.islands, k] }))} style={{ padding: '0.35rem 0.7rem', fontFamily: 'Barlow Condensed', fontSize: '0.7rem', letterSpacing: '0.1em', background: surgeForm.islands.includes(k) ? 'rgba(192,57,43,0.2)' : 'transparent', border: `1px solid ${surgeForm.islands.includes(k) ? 'rgba(192,57,43,0.5)' : 'rgba(201,147,58,0.2)'}`, color: surgeForm.islands.includes(k) ? '#fc8181' : 'var(--text-mist)', cursor: 'pointer' }}>
                      {getIslandFlag(k as Island)} {v}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="crm-label">Operational Notes</label>
                <textarea className="crm-input" rows={2} placeholder="Response notes, special instructions…" value={surgeForm.notes} onChange={e => setSurgeForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowSurgeForm(false)}>Cancel</button>
                <button type="submit" className="btn-danger" disabled={surgeSaving}>{surgeSaving ? 'Activating…' : '⚡ Activate Surge Mode'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Claim"
          message={`Permanently delete claim ${confirmDelete.claim_number}? All associated documents and fraud alerts will also be removed.`}
          confirmLabel="Delete Claim"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={hideToast} />}
    </div>
  )
}
