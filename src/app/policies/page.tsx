'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Toast, useToast } from '@/components/Toast'
import { Pagination } from '@/components/Pagination'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { formatCurrency, formatDate, formatStatus, getIslandLabel, getIslandFlag, POLICY_STATUS_STYLES, getRiskColor, daysUntil } from '@/lib/utils'
import { Policy, CoverageType, Island, COVERAGE_LABELS, ISLAND_LABELS } from '@/types'

const EMPTY_FORM = {
  client_id: '', broker_id: '', coverage_type: 'residential' as CoverageType,
  island: 'barbados' as Island, insured_value: '', currency: 'USD',
  annual_premium: '', start_date: '', end_date: '', renewal_date: '',
  wind_zone: '', flood_zone: '', structural_compliance_rating: '',
  construction_year: '', property_address: '', hurricane_deductible_pct: '5', notes: '',
  vessel_name: '', hull_value: '', navigation_area: '', mooring_location: '', vessel_year: '',
}

const EMPTY_ENDORSEMENT = {
  type: 'coverage_extension', description: '', effective_date: '',
  additional_premium: '0', currency: 'USD', notes: '', issued_by: 'Senior Underwriter',
}

const ENDORSEMENT_TYPES: Record<string, string> = {
  coverage_extension: 'Coverage Extension',
  coverage_reduction: 'Coverage Reduction',
  premium_adjustment: 'Premium Adjustment',
  address_change: 'Address Change',
  name_change: 'Name Change',
  deductible_change: 'Deductible Change',
  wind_zone_change: 'Wind Zone Change',
  other: 'Other',
}

// Risk score calculator based on underwriting factors
function calculateRiskScore(form: any): number {
  let score = 50
  const year = parseInt(form.construction_year) || 2000
  const age = new Date().getFullYear() - year
  if (age > 40) score += 20
  else if (age > 20) score += 10
  else if (age < 5) score -= 10
  const compliance = parseFloat(form.structural_compliance_rating) || 50
  if (compliance >= 85) score -= 15
  else if (compliance >= 70) score -= 5
  else if (compliance < 50) score += 20
  else if (compliance < 60) score += 10
  const zone = form.wind_zone?.toLowerCase() || ''
  if (zone.includes('4') || zone.includes('5')) score += 20
  else if (zone.includes('3')) score += 10
  else if (zone.includes('1')) score -= 5
  if (form.coverage_type === 'yacht_marine') score += 15
  if (form.coverage_type === 'construction') score += 10
  if (['bahamas', 'cayman_islands'].includes(form.island)) score += 8
  return Math.max(5, Math.min(98, score))
}

export default function PoliciesPage() {
  const supabase = createClient()
  const [policies, setPolicies] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [brokers, setBrokers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [filterIsland, setFilterIsland] = useState('')
  const [filterCoverage, setFilterCoverage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const { toast, show: showToast, hide: hideToast } = useToast()
  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 15
  const [selected, setSelected] = useState<any>(null)
  const [selectedTab, setSelectedTab] = useState<'details' | 'endorsements'>('details')
  const [endorsements, setEndorsements] = useState<any[]>([])
  const [showEndorseForm, setShowEndorseForm] = useState(false)
  const [endorseForm, setEndorseForm] = useState(EMPTY_ENDORSEMENT)
  const [endorseSaving, setEndorseSaving] = useState(false)
  const [computedRisk, setComputedRisk] = useState(50)

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

  async function loadEndorsements(policyId: string) {
    const { data } = await supabase.from('policy_endorsements').select('*').eq('policy_id', policyId).order('effective_date', { ascending: false })
    setEndorsements(data || [])
  }

  function openPolicy(p: any) {
    setSelected(p)
    setSelectedTab('details')
    loadEndorsements(p.id)
  }

  useEffect(() => { setComputedRisk(calculateRiskScore(form)) }, [form])

  function toggleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }
  const sortIcon = (col: string) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'

  const filtered = policies.filter(p => {
    const clientName = p.clients ? `${p.clients.first_name} ${p.clients.last_name} ${p.clients.company_name || ''}`.toLowerCase() : ''
    return (!search || p.policy_number?.toLowerCase().includes(search.toLowerCase()) || clientName.includes(search.toLowerCase()) || p.property_address?.toLowerCase().includes(search.toLowerCase()))
      && (!filterStatus || p.status === filterStatus)
      && (!filterIsland || p.island === filterIsland)
      && (!filterCoverage || p.coverage_type === filterCoverage)
  }).sort((a, b) => {
    let av: any, bv: any
    if (sortBy === 'annual_premium') { av = a.annual_premium || 0; bv = b.annual_premium || 0 }
    else if (sortBy === 'renewal_date') { av = a.renewal_date || ''; bv = b.renewal_date || '' }
    else if (sortBy === 'risk_score') { av = a.risk_score || 0; bv = b.risk_score || 0 }
    else if (sortBy === 'insured_value') { av = a.insured_value || 0; bv = b.insured_value || 0 }
    else { av = a.policy_number || ''; bv = b.policy_number || '' }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalFiltered = filtered.length
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

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
      status: 'quoted',
      premium_currency: form.currency,
      risk_score: computedRisk,
    })
    if (!error) { setShowForm(false); setForm(EMPTY_FORM); load() }
    setSaving(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm) return
    setSaving(true)
    const { error } = await supabase.from('policies').update({
      coverage_type: editForm.coverage_type,
      island: editForm.island,
      insured_value: parseFloat(editForm.insured_value),
      currency: editForm.currency,
      annual_premium: parseFloat(editForm.annual_premium),
      premium_currency: editForm.currency,
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      renewal_date: editForm.renewal_date,
      wind_zone: editForm.wind_zone,
      flood_zone: editForm.flood_zone,
      structural_compliance_rating: editForm.structural_compliance_rating ? parseFloat(editForm.structural_compliance_rating) : null,
      construction_year: editForm.construction_year ? parseInt(editForm.construction_year) : null,
      hurricane_deductible_pct: parseFloat(editForm.hurricane_deductible_pct) || 5,
      property_address: editForm.property_address,
      notes: editForm.notes,
      risk_score: calculateRiskScore(editForm),
      vessel_name: editForm.vessel_name,
      hull_value: editForm.hull_value ? parseFloat(editForm.hull_value) : null,
      navigation_area: editForm.navigation_area,
      mooring_location: editForm.mooring_location,
      vessel_year: editForm.vessel_year ? parseInt(editForm.vessel_year) : null,
    }).eq('id', editForm.id)
    if (!error) {
      setShowEditForm(false)
      setEditForm(null)
      load()
      showToast('Policy updated.', 'success')
    } else { showToast('Update failed.', 'error') }
    setSaving(false)
  }

  async function handleDelete(policy: any) {
    const { error } = await supabase.from('policies').delete().eq('id', policy.id)
    if (error) {
      showToast(error.message.includes('restrict') ? 'Cannot delete — policy has active claims.' : 'Delete failed.', 'error')
    } else {
      showToast(`Policy ${policy.policy_number} deleted.`, 'success')
      setSelected(null)
      load()
    }
    setConfirmDelete(null)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('policies').update({ status }).eq('id', id)
    load()
    if (selected?.id === id) setSelected((p: any) => ({ ...p, status }))
  }

  async function handleEndorse(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setEndorseSaving(true)
    const num = `END-${selected.policy_number}-${String(endorsements.length + 1).padStart(3, '0')}`
    const { error } = await supabase.from('policy_endorsements').insert({
      ...endorseForm,
      policy_id: selected.id,
      endorsement_number: num,
      additional_premium: parseFloat(endorseForm.additional_premium),
      currency: endorseForm.currency || selected.premium_currency || 'USD',
    })
    if (!error) {
      setShowEndorseForm(false)
      setEndorseForm(EMPTY_ENDORSEMENT)
      loadEndorsements(selected.id)
    }
    setEndorseSaving(false)
  }

  const totalGWP = filtered.reduce((s, p) => s + (p.annual_premium || 0), 0)
  const totalExposure = filtered.reduce((s, p) => s + (p.insured_value || 0), 0)

  const RISK_LABEL = computedRisk >= 80 ? 'Extreme' : computedRisk >= 65 ? 'High' : computedRisk >= 45 ? 'Moderate' : 'Low'
  const RISK_COLOR = getRiskColor(computedRisk)

  return (
    <div className="page-enter" style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Underwriting</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Policy Lifecycle</h1>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--text-mist)', marginTop: '0.3rem' }}>
            Quote · Bind · Endorse · Renew · Cancel
          </div>
        </div>
        <button className="btn-gold" onClick={() => setShowForm(true)}>+ New Policy Quote</button>
      </div>

      {/* KPIs */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '1.5rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Total Policies', value: filtered.length.toString() },
          { label: 'Active', value: filtered.filter(p => p.status === 'active').length.toString() },
          { label: 'GWP (Filtered)', value: formatCurrency(totalGWP, 'USD', true) },
          { label: 'Total Exposure', value: formatCurrency(totalExposure, 'USD', true) },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', padding: '1rem 1.2rem' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-mist)' }}>{k.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 900, color: '#c9933a', marginTop: '0.2rem' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        <input className="crm-input" style={{ maxWidth: 260 }} placeholder="Search policy #, client, address…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="crm-select" style={{ maxWidth: 160 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {['active','pending','renewal_due','lapsed','cancelled','quoted'].map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
        </select>
        <select className="crm-select" style={{ maxWidth: 160 }} value={filterIsland} onChange={e => { setFilterIsland(e.target.value); setPage(1) }}>
          <option value="">All Islands</option>
          {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="crm-select" style={{ maxWidth: 200 }} value={filterCoverage} onChange={e => { setFilterCoverage(e.target.value); setPage(1) }}>
          <option value="">All Coverage Types</option>
          {Object.entries(COVERAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.12)' }}>
        <div className="table-scroll"><table className="crm-table">
          <thead>
            <tr>
              <th style={{ cursor:'pointer', userSelect:'none' }} onClick={() => toggleSort('policy_number')}>Policy #{sortIcon('policy_number')}</th><th>Client</th><th>Coverage</th><th>Island</th>
              <th style={{ cursor:'pointer', userSelect:'none' }} onClick={() => toggleSort('insured_value')}>Insured Value{sortIcon('insured_value')}</th><th>Annual Premium</th><th>Status</th>
              <th style={{ cursor:'pointer', userSelect:'none' }} onClick={() => toggleSort('renewal_date')}>Renewal{sortIcon('renewal_date')}</th><th>Risk Score</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-mist)' }}>Loading policies…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-mist)' }}>No policies found</td></tr>
            ) : paged.map(p => {
              const days = p.renewal_date ? daysUntil(p.renewal_date) : 999
              const renewalUrgent = days <= 30
              const renewalSoon = days <= 60
              return (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => openPolicy(p)}>
                  <td style={{ fontFamily: 'Barlow Condensed', color: '#c9933a', fontSize: '0.82rem', fontWeight: 600 }}>{p.policy_number}</td>
                  <td>
                    <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.clients ? `${p.clients.first_name} ${p.clients.last_name}` : '—'}</div>
                    {p.clients?.company_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-mist)' }}>{p.clients.company_name}</div>}
                  </td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: 'var(--text-mist)' }}>{COVERAGE_LABELS[p.coverage_type as CoverageType] || p.coverage_type}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.8rem' }}>{getIslandFlag(p.island)} {getIslandLabel(p.island)}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(p.insured_value, p.currency, true)}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', color: '#c9933a' }}>{formatCurrency(p.annual_premium, p.premium_currency, true)}</td>
                  <td><span className={`badge ${POLICY_STATUS_STYLES[p.status] || ''}`}>{formatStatus(p.status)}</span></td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: renewalUrgent ? '#fc8181' : renewalSoon ? '#e8b04a' : 'var(--text-mist)', whiteSpace: 'nowrap' }}>
                    {formatDate(p.renewal_date)}
                    {renewalUrgent && <div style={{ fontSize: '0.65rem', color: '#fc8181' }}>⚠ {days}d</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 40, height: 4, background: 'var(--bg-raised)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${p.risk_score || 50}%`, background: getRiskColor(p.risk_score || 50), borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: getRiskColor(p.risk_score || 50), fontWeight: 700 }}>{p.risk_score || 50}</span>
                    </div>
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
        </table></div>
      </div>

      {/* ── POLICY DETAIL PANEL ── */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div>
                <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Policy Detail</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.policy_number}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: 'var(--text-mist)', marginTop: '0.2rem' }}>
                  {selected.clients ? `${selected.clients.first_name} ${selected.clients.last_name}` : ''} · {COVERAGE_LABELS[selected.coverage_type as CoverageType] || selected.coverage_type}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-mist)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,147,58,0.1)', flexShrink: 0 }}>
              {[['details', 'Policy Details'], ['endorsements', `Endorsements (${endorsements.length})`]].map(([id, label]) => (
                <button key={id} onClick={() => setSelectedTab(id as any)} style={{
                  padding: '0.8rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: selectedTab === id ? '#c9933a' : 'var(--text-dim)',
                  borderBottom: selectedTab === id ? '2px solid #c9933a' : '2px solid transparent',
                  marginBottom: '-1px',
                }}>{label}</button>
              ))}
            </div>

            {/* Details Tab */}
            {selectedTab === 'details' && (
              <>
                <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', flex: 1 }}>
                  {[
                    ['Status', <span key="s" className={`badge ${POLICY_STATUS_STYLES[selected.status] || ''}`}>{formatStatus(selected.status)}</span>],
                    ['Island', `${getIslandFlag(selected.island)} ${getIslandLabel(selected.island)}`],
                    ['Insured Value', formatCurrency(selected.insured_value, selected.currency)],
                    ['Annual Premium', formatCurrency(selected.annual_premium, selected.premium_currency)],
                    ['Policy Period', `${formatDate(selected.start_date)} – ${formatDate(selected.end_date)}`],
                    ['Renewal Date', formatDate(selected.renewal_date)],
                    ['Wind Zone', selected.wind_zone || '—'],
                    ['Flood Zone', selected.flood_zone || '—'],
                    ['Structural Compliance', selected.structural_compliance_rating ? `${selected.structural_compliance_rating}%` : '—'],
                    ['Hurricane Deductible', selected.hurricane_deductible_pct ? `${selected.hurricane_deductible_pct}%` : '—'],
                    ['Construction Year', selected.construction_year || '—'],
                    ['Broker', selected.brokers?.name || '—'],
                  ].map(([label, value], i) => (
                    <div key={i}>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>{label}</div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{value as any}</div>
                    </div>
                  ))}
                </div>
                {/* Risk Score bar */}
                <div style={{ padding: '0 1.5rem 1rem' }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Risk Score</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-raised)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${selected.risk_score || 50}%`, background: getRiskColor(selected.risk_score || 50), borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 900, color: getRiskColor(selected.risk_score || 50), minWidth: 36 }}>{selected.risk_score || 50}</span>
                  </div>
                </div>
                {selected.property_address && (
                  <div style={{ padding: '0 1.5rem 1rem' }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Property Address</div>
                    <div style={{ fontFamily: 'Barlow', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{selected.property_address}</div>
                  </div>
                )}
                {selected.notes && (
                  <div style={{ padding: '0 1.5rem 1rem' }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Notes</div>
                    <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: 'var(--text-mist)', lineHeight: 1.6 }}>{selected.notes}</div>
                  </div>
                )}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,147,58,0.1)', display: 'flex', gap: '0.8rem', flexWrap: 'wrap', flexShrink: 0 }}>
                  {selected.status === 'quoted' && <button className="btn-gold" onClick={() => updateStatus(selected.id, 'active')}>Bind Policy</button>}
                  {selected.status === 'active' && <button className="btn-ghost" onClick={() => updateStatus(selected.id, 'renewal_due')}>Flag for Renewal</button>}
                  {selected.status === 'renewal_due' && <button className="btn-gold" onClick={() => updateStatus(selected.id, 'active')}>Renew Policy</button>}
                  <button className="btn-danger" style={{ fontSize: '0.75rem' }} onClick={() => setConfirmDelete(selected)}>Delete</button>
              <button className="btn-ghost" onClick={() => { setEditForm({ ...selected, insured_value: String(selected.insured_value), annual_premium: String(selected.annual_premium), structural_compliance_rating: String(selected.structural_compliance_rating || ''), construction_year: String(selected.construction_year || ''), hurricane_deductible_pct: String(selected.hurricane_deductible_pct || 5), hull_value: String(selected.hull_value || ''), vessel_year: String(selected.vessel_year || '') }); setShowEditForm(true) }}>Edit Policy</button>
              {selected.status === 'active' && <button className="btn-ghost" onClick={() => { setSelectedTab('endorsements'); setShowEndorseForm(true) }}>+ Add Endorsement</button>}
                  {selected.status !== 'cancelled' && <button className="btn-danger" onClick={() => updateStatus(selected.id, 'cancelled')}>Cancel Policy</button>}
                </div>
              </>
            )}

            {/* Endorsements Tab */}
            {selectedTab === 'endorsements' && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(201,147,58,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-mist)' }}>Mid-Term Policy Changes</div>
                    <div style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                      Additional premium: {formatCurrency(endorsements.reduce((s, e) => s + (e.additional_premium || 0), 0), selected.premium_currency)}
                    </div>
                  </div>
                  <button className="btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.72rem' }} onClick={() => setShowEndorseForm(true)}>+ New Endorsement</button>
                </div>

                {endorsements.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em' }}>
                    No endorsements on record for this policy.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(201,147,58,0.06)' }}>
                    {endorsements.map((e, i) => (
                      <div key={e.id} style={{ background: 'var(--bg-card)', padding: '1.2rem 1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                          <div>
                            <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', letterSpacing: '0.15em', color: '#c9933a' }}>{e.endorsement_number}</span>
                            <span style={{ marginLeft: '0.8rem' }}><span className="badge" style={{ background: 'rgba(201,147,58,0.08)', borderColor: 'rgba(201,147,58,0.2)', color: 'var(--text-amber)' }}>{ENDORSEMENT_TYPES[e.type] || e.type}</span></span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: e.additional_premium > 0 ? '#c9933a' : e.additional_premium < 0 ? '#4ade80' : 'var(--text-mist)' }}>
                              {e.additional_premium > 0 ? '+' : ''}{formatCurrency(e.additional_premium, e.currency)}
                            </div>
                            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-dim)' }}>additional premium</div>
                          </div>
                        </div>
                        <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.5 }}>{e.description}</div>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', color: 'var(--text-dim)' }}>Effective: <span style={{ color: 'var(--text-mist)' }}>{formatDate(e.effective_date)}</span></div>
                          {e.issued_by && <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', color: 'var(--text-dim)' }}>Issued by: <span style={{ color: 'var(--text-mist)' }}>{e.issued_by}</span></div>}
                          <span className="badge" style={{ background: e.status === 'active' ? 'rgba(39,174,96,0.1)' : 'var(--bg-raised)', borderColor: e.status === 'active' ? 'rgba(39,174,96,0.3)' : 'var(--bg-raised)', color: e.status === 'active' ? '#4ade80' : 'var(--text-dim)', fontSize: '0.6rem' }}>{e.status}</span>
                        </div>
                        {e.notes && <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontStyle: 'italic' }}>{e.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Endorsement Form */}
                {showEndorseForm && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(201,147,58,0.15)', background: 'rgba(201,147,58,0.03)' }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '1rem' }}>New Endorsement</div>
                    <form onSubmit={handleEndorse} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="crm-label">Endorsement Type *</label>
                        <select className="crm-select" value={endorseForm.type} onChange={e => setEndorseForm(f => ({ ...f, type: e.target.value }))} required>
                          {Object.entries(ENDORSEMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="crm-label">Description *</label>
                        <textarea className="crm-input" rows={2} placeholder="Describe the policy change…" value={endorseForm.description} onChange={e => setEndorseForm(f => ({ ...f, description: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="crm-label">Effective Date *</label>
                        <input className="crm-input" type="date" value={endorseForm.effective_date} onChange={e => setEndorseForm(f => ({ ...f, effective_date: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="crm-label">Additional Premium</label>
                        <input className="crm-input" type="number" placeholder="0" value={endorseForm.additional_premium} onChange={e => setEndorseForm(f => ({ ...f, additional_premium: e.target.value }))} />
                      </div>
                      <div>
                        <label className="crm-label">Currency</label>
                        <select className="crm-select" value={endorseForm.currency} onChange={e => setEndorseForm(f => ({ ...f, currency: e.target.value }))}>
                          {['USD','BBD','JMD','KYD','TTD','BSD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="crm-label">Issued By</label>
                        <input className="crm-input" placeholder="Underwriter name" value={endorseForm.issued_by} onChange={e => setEndorseForm(f => ({ ...f, issued_by: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="crm-label">Internal Notes</label>
                        <input className="crm-input" placeholder="Optional notes…" value={endorseForm.notes} onChange={e => setEndorseForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }} onClick={() => setShowEndorseForm(false)}>Cancel</button>
                        <button type="submit" className="btn-gold" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }} disabled={endorseSaving}>{endorseSaving ? 'Saving…' : 'Issue Endorsement'}</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NEW POLICY FORM ── */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Underwriting Intelligence</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>New Policy Quote</div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: 'var(--text-mist)', marginTop: '0.2rem' }}>
                Risk score is calculated automatically from structural inputs
              </div>
            </div>

            {/* Live Risk Score */}
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(201,147,58,0.04)', borderBottom: '1px solid rgba(201,147,58,0.1)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Calculated Risk Score</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 900, color: RISK_COLOR, lineHeight: 1 }}>{computedRisk}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: RISK_COLOR, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.2rem' }}>{RISK_LABEL} Risk</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, background: 'var(--bg-raised)', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${computedRisk}%`, background: RISK_COLOR, borderRadius: 4, transition: 'all 0.3s ease' }} />
                </div>
                <div style={{ fontFamily: 'Barlow', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  Score factors: construction year, structural compliance, wind zone, island, coverage type
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="two-col-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              {/* Risk scoring inputs */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(201,147,58,0.12)' }}>
                  Underwriting Intelligence · Risk Scoring Inputs
                </div>
              </div>
              <div>
                <label className="crm-label">Construction Year</label>
                <input className="crm-input" type="number" placeholder="e.g. 2018" value={form.construction_year} onChange={e => setForm(f => ({ ...f, construction_year: e.target.value }))} />
              </div>
              <div>
                <label className="crm-label">Structural Compliance % <span style={{ color: '#c9933a' }}>↑ affects score</span></label>
                <input className="crm-input" type="number" min="0" max="100" placeholder="e.g. 78" value={form.structural_compliance_rating} onChange={e => setForm(f => ({ ...f, structural_compliance_rating: e.target.value }))} />
              </div>
              <div>
                <label className="crm-label">Wind Zone <span style={{ color: '#c9933a' }}>↑ affects score</span></label>
                <select className="crm-select" value={form.wind_zone} onChange={e => setForm(f => ({ ...f, wind_zone: e.target.value }))}>
                  <option value="">Select wind zone…</option>
                  <option value="Zone 1 – Low">Zone 1 – Low (&lt;90mph)</option>
                  <option value="Zone 2 – Moderate">Zone 2 – Moderate (90–110mph)</option>
                  <option value="Zone 3 – High">Zone 3 – High (110–130mph)</option>
                  <option value="Zone 4 – Very High">Zone 4 – Very High (130–150mph)</option>
                  <option value="Zone 5 – Extreme">Zone 5 – Extreme (&gt;150mph)</option>
                </select>
              </div>
              <div>
                <label className="crm-label">Flood Zone</label>
                <select className="crm-select" value={form.flood_zone} onChange={e => setForm(f => ({ ...f, flood_zone: e.target.value }))}>
                  <option value="">Select flood zone…</option>
                  <option value="Zone A – 100-Year Floodplain">Zone A – 100-Year Floodplain</option>
                  <option value="Zone AE – Base Flood">Zone AE – Base Flood</option>
                  <option value="Zone X – Minimal Flood">Zone X – Minimal Flood</option>
                  <option value="Zone D – Unknown">Zone D – Unknown</option>
                </select>
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
              {/* Yacht/Marine fields — shown only when coverage type is yacht_marine */}
              {form.coverage_type === 'yacht_marine' && <>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '0.8rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(201,147,58,0.12)' }}>
                    Yacht & Marine Details
                  </div>
                </div>
                <div>
                  <label className="crm-label">Vessel Name *</label>
                  <input className="crm-input" placeholder="e.g. Sea Breeze III" value={form.vessel_name} onChange={e => setForm(f => ({ ...f, vessel_name: e.target.value }))} />
                </div>
                <div>
                  <label className="crm-label">Hull Value</label>
                  <input className="crm-input" type="number" placeholder="e.g. 850000" value={form.hull_value} onChange={e => setForm(f => ({ ...f, hull_value: e.target.value }))} />
                </div>
                <div>
                  <label className="crm-label">Vessel Year</label>
                  <input className="crm-input" type="number" placeholder="e.g. 2019" value={form.vessel_year} onChange={e => setForm(f => ({ ...f, vessel_year: e.target.value }))} />
                </div>
                <div>
                  <label className="crm-label">Mooring Location</label>
                  <input className="crm-input" placeholder="e.g. Bridgetown Harbour, Barbados" value={form.mooring_location} onChange={e => setForm(f => ({ ...f, mooring_location: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="crm-label">Navigation Area</label>
                  <select className="crm-select" value={form.navigation_area} onChange={e => setForm(f => ({ ...f, navigation_area: e.target.value }))}>
                    <option value="">Select navigation area…</option>
                    <option value="Eastern Caribbean">Eastern Caribbean (Barbados to BVI)</option>
                    <option value="Western Caribbean">Western Caribbean (Jamaica, Cayman, Bahamas)</option>
                    <option value="Full Caribbean">Full Caribbean Waters</option>
                    <option value="Caribbean + Gulf of Mexico">Caribbean + Gulf of Mexico</option>
                    <option value="Coastal Only">Coastal Waters Only (within 12nm)</option>
                  </select>
                </div>
              </>}
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="crm-label">Underwriting Notes</label>
                <textarea className="crm-input" rows={3} placeholder="Special conditions, risk notes, exclusions…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving…' : `Create Quote · Risk ${computedRisk}`}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Policy Form */}
      {showEditForm && editForm && (
        <div className="modal-backdrop" onClick={() => setShowEditForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Edit Policy</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{editForm.policy_number}</div>
            </div>
            <form onSubmit={handleEdit} className="two-col-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="crm-label">Coverage Type</label>
                <select className="crm-select" value={editForm.coverage_type} onChange={e => setEditForm((f: any) => ({ ...f, coverage_type: e.target.value }))}>
                  {Object.entries(COVERAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="crm-label">Island</label>
                <select className="crm-select" value={editForm.island} onChange={e => setEditForm((f: any) => ({ ...f, island: e.target.value }))}>
                  {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="crm-label">Insured Value</label><input className="crm-input" type="number" value={editForm.insured_value} onChange={e => setEditForm((f: any) => ({ ...f, insured_value: e.target.value }))} /></div>
              <div><label className="crm-label">Currency</label>
                <select className="crm-select" value={editForm.currency} onChange={e => setEditForm((f: any) => ({ ...f, currency: e.target.value }))}>
                  {['USD','BBD','JMD','KYD','TTD','BSD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="crm-label">Annual Premium</label><input className="crm-input" type="number" value={editForm.annual_premium} onChange={e => setEditForm((f: any) => ({ ...f, annual_premium: e.target.value }))} /></div>
              <div><label className="crm-label">Hurricane Deductible %</label><input className="crm-input" type="number" value={editForm.hurricane_deductible_pct} onChange={e => setEditForm((f: any) => ({ ...f, hurricane_deductible_pct: e.target.value }))} /></div>
              <div><label className="crm-label">Start Date</label><input className="crm-input" type="date" value={editForm.start_date?.split('T')[0] || ''} onChange={e => setEditForm((f: any) => ({ ...f, start_date: e.target.value }))} /></div>
              <div><label className="crm-label">End Date</label><input className="crm-input" type="date" value={editForm.end_date?.split('T')[0] || ''} onChange={e => setEditForm((f: any) => ({ ...f, end_date: e.target.value }))} /></div>
              <div><label className="crm-label">Renewal Date</label><input className="crm-input" type="date" value={editForm.renewal_date?.split('T')[0] || ''} onChange={e => setEditForm((f: any) => ({ ...f, renewal_date: e.target.value }))} /></div>
              <div><label className="crm-label">Wind Zone</label>
                <select className="crm-select" value={editForm.wind_zone || ''} onChange={e => setEditForm((f: any) => ({ ...f, wind_zone: e.target.value }))}>
                  <option value="">Select…</option>
                  {['Zone 1 – Low','Zone 2 – Moderate','Zone 3 – High','Zone 4 – Very High','Zone 5 – Extreme'].map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div><label className="crm-label">Flood Zone</label>
                <select className="crm-select" value={editForm.flood_zone || ''} onChange={e => setEditForm((f: any) => ({ ...f, flood_zone: e.target.value }))}>
                  <option value="">Select…</option>
                  {['Zone A – 100-Year Floodplain','Zone AE – Base Flood','Zone X – Minimal Flood','Zone D – Unknown'].map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div><label className="crm-label">Structural Compliance %</label><input className="crm-input" type="number" min="0" max="100" value={editForm.structural_compliance_rating} onChange={e => setEditForm((f: any) => ({ ...f, structural_compliance_rating: e.target.value }))} /></div>
              <div><label className="crm-label">Construction Year</label><input className="crm-input" type="number" value={editForm.construction_year} onChange={e => setEditForm((f: any) => ({ ...f, construction_year: e.target.value }))} /></div>
              {editForm.coverage_type === 'yacht_marine' && <>
                <div><label className="crm-label">Vessel Name</label><input className="crm-input" value={editForm.vessel_name || ''} onChange={e => setEditForm((f: any) => ({ ...f, vessel_name: e.target.value }))} /></div>
                <div><label className="crm-label">Hull Value</label><input className="crm-input" type="number" value={editForm.hull_value || ''} onChange={e => setEditForm((f: any) => ({ ...f, hull_value: e.target.value }))} /></div>
                <div><label className="crm-label">Mooring Location</label><input className="crm-input" value={editForm.mooring_location || ''} onChange={e => setEditForm((f: any) => ({ ...f, mooring_location: e.target.value }))} /></div>
                <div><label className="crm-label">Vessel Year</label><input className="crm-input" type="number" value={editForm.vessel_year || ''} onChange={e => setEditForm((f: any) => ({ ...f, vessel_year: e.target.value }))} /></div>
              </>}
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Property Address</label><input className="crm-input" value={editForm.property_address || ''} onChange={e => setEditForm((f: any) => ({ ...f, property_address: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Notes</label><textarea className="crm-input" rows={3} value={editForm.notes || ''} onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowEditForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Policy"
          message={`Permanently delete ${confirmDelete.policy_number}? This cannot be undone. Policies with active claims cannot be deleted.`}
          confirmLabel="Delete Policy"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={hideToast} />}
    </div>
  )
}
