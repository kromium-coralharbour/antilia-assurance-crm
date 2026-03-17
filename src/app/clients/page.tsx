'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatStatus, getIslandLabel, getIslandFlag, getRiskColor, getRiskLabel, RISK_BG, POLICY_STATUS_STYLES, CLAIM_STATUS_STYLES, daysUntil } from '@/lib/utils'
import { Island, ClientSegment, Currency, ISLAND_LABELS } from '@/types'

const SEGMENT_LABELS: Record<ClientSegment, string> = {
  high_value_homeowner: 'HV Homeowner',
  commercial_owner: 'Commercial Owner',
  real_estate_developer: 'RE Developer',
  boutique_resort: 'Boutique Resort',
  construction_company: 'Construction Co.',
  hnw_yacht_owner: 'HNW Yacht Owner',
}

const EMPTY = {
  first_name: '', last_name: '', company_name: '', email: '', phone: '',
  segment: 'high_value_homeowner' as ClientSegment, island: 'barbados' as Island,
  address: '', preferred_currency: 'USD' as Currency, notes: '', is_vip: false,
}

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<any[]>([])
  const [brokers, setBrokers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSegment, setFilterSegment] = useState('')
  const [filterIsland, setFilterIsland] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [selected, setSelected] = useState<any>(null)
  const [clientTab, setClientTab] = useState<'profile'|'policies'|'claims'>('profile')
  const [clientPolicies, setClientPolicies] = useState<any[]>([])
  const [clientClaims, setClientClaims] = useState<any[]>([])
  const [clientDataLoading, setClientDataLoading] = useState(false)

  async function load() {
    const [clientRes, brokerRes] = await Promise.all([
      supabase.from('clients').select(`*, brokers(name, company), policies(id, status, annual_premium)`).order('created_at', { ascending: false }),
      supabase.from('brokers').select('id, name, company'),
    ])
    setClients(clientRes.data || [])
    setBrokers(brokerRes.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = clients.filter(c => {
    const matchSearch = !search || `${c.first_name} ${c.last_name} ${c.company_name || ''} ${c.email}`.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (!filterSegment || c.segment === filterSegment) && (!filterIsland || c.island === filterIsland)
  })

  async function openClient(c: any) {
    setSelected(c)
    setClientTab('profile')
    setClientDataLoading(true)
    const [polRes, claimRes] = await Promise.all([
      supabase.from('policies').select('id, policy_number, coverage_type, status, annual_premium, insured_value, currency, premium_currency, renewal_date, island').eq('client_id', c.id).order('created_at', { ascending: false }),
      supabase.from('claims').select('id, claim_number, status, reported_loss, currency, incident_date, island, fraud_risk, catastrophe_event, storm_name').eq('client_id', c.id).order('created_at', { ascending: false }),
    ])
    setClientPolicies(polRes.data || [])
    setClientClaims(claimRes.data || [])
    setClientDataLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('clients').insert({ ...form, risk_score: 50, total_insured_value: 0, total_insured_value_currency: 'USD' })
    if (!error) { setShowForm(false); setForm(EMPTY); load() }
    setSaving(false)
  }

  async function handleEditClient(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm) return
    setSaving(true)
    const { error } = await supabase.from('clients').update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      company_name: editForm.company_name,
      email: editForm.email,
      phone: editForm.phone,
      segment: editForm.segment,
      island: editForm.island,
      address: editForm.address,
      preferred_currency: editForm.preferred_currency,
      notes: editForm.notes,
      is_vip: editForm.is_vip,
    }).eq('id', editForm.id)
    if (!error) {
      setShowEditForm(false)
      setEditForm(null)
      setSelected(null)
      load()
    }
    setSaving(false)
  }

  return (
    <div className="page-enter" style={{ padding: '2rem', minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Relationships</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: 0 }}>Clients</h1>
        </div>
        <button className="btn-gold" onClick={() => setShowForm(true)}>+ New Client</button>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '1.5rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Total Clients', value: filtered.length },
          { label: 'VIP', value: filtered.filter(c => c.is_vip).length },
          { label: 'Boutique Resorts', value: filtered.filter(c => c.segment === 'boutique_resort').length },
          { label: 'HV Homeowners', value: filtered.filter(c => c.segment === 'high_value_homeowner').length },
        ].map((k, i) => (
          <div key={i} style={{ background: '#111827', padding: '1rem 1.2rem' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8fa3b8' }}>{k.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 900, color: '#c9933a', marginTop: '0.2rem' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        <input className="crm-input" style={{ maxWidth: 280 }} placeholder="Search name, company, email…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="crm-select" style={{ maxWidth: 180 }} value={filterSegment} onChange={e => setFilterSegment(e.target.value)}>
          <option value="">All Segments</option>
          {Object.entries(SEGMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="crm-select" style={{ maxWidth: 180 }} value={filterIsland} onChange={e => setFilterIsland(e.target.value)}>
          <option value="">All Islands</option>
          {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.12)', overflow: 'auto' }}>
        <div className="table-scroll"><table className="crm-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Segment</th>
              <th>Island</th>
              <th>Policies</th>
              <th>Total Premium</th>
              <th>Risk Score</th>
              <th>VIP</th>
              <th>Broker</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#8fa3b8' }}>Loading…</td></tr>
            ) : filtered.map(c => {
              const activePolicies = (c.policies || []).filter((p: any) => p.status === 'active')
              const totalPrem = activePolicies.reduce((s: number, p: any) => s + (p.annual_premium || 0), 0)
              const risk = getRiskLabel(c.risk_score || 50)
              async function handleEditClient(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm) return
    setSaving(true)
    const { error } = await supabase.from('clients').update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      company_name: editForm.company_name,
      email: editForm.email,
      phone: editForm.phone,
      segment: editForm.segment,
      island: editForm.island,
      address: editForm.address,
      preferred_currency: editForm.preferred_currency,
      notes: editForm.notes,
      is_vip: editForm.is_vip,
    }).eq('id', editForm.id)
    if (!error) {
      setShowEditForm(false)
      setEditForm(null)
      setSelected(null)
      load()
    }
    setSaving(false)
  }

  return (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openClient(c)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${getRiskColor(c.risk_score || 50)}22`, border: `1px solid ${getRiskColor(c.risk_score || 50)}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: getRiskColor(c.risk_score || 50), flexShrink: 0 }}>
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Barlow', fontSize: '0.88rem', color: '#f5f0e8' }}>{c.first_name} {c.last_name}</div>
                        {c.company_name && <div style={{ fontSize: '0.75rem', color: '#8fa3b8' }}>{c.company_name}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: '#c9933a' }}>{SEGMENT_LABELS[c.segment as ClientSegment] || c.segment}</span></td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.8rem' }}>{getIslandFlag(c.island)} {getIslandLabel(c.island)}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', color: '#f5f0e8' }}>{activePolicies.length} active</td>
                  <td style={{ fontFamily: 'Barlow Condensed', color: '#c9933a' }}>{totalPrem > 0 ? formatCurrency(totalPrem, c.preferred_currency, true) : '—'}</td>
                  <td>
                    <span className={`badge ${RISK_BG[risk]}`}>{risk}</span>
                  </td>
                  <td>{c.is_vip && <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.15em', color: '#e8b04a', background: 'rgba(201,147,58,0.12)', border: '1px solid rgba(201,147,58,0.3)', padding: '0.15rem 0.5rem' }}>VIP</span>}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: '#8fa3b8' }}>{c.brokers?.name || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
      </div>

      {/* Client Detail */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${getRiskColor(selected.risk_score || 50)}22`, border: `1px solid ${getRiskColor(selected.risk_score || 50)}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display', fontSize: '1rem', color: getRiskColor(selected.risk_score || 50), flexShrink: 0 }}>
                  {selected.first_name?.[0]}{selected.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{selected.first_name} {selected.last_name}</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: '#8fa3b8' }}>{selected.company_name || SEGMENT_LABELS[selected.segment as ClientSegment]} {selected.is_vip && <span style={{ color: '#e8b04a', marginLeft: '0.4rem' }}>⭐ VIP</span>}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8fa3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,147,58,0.1)', flexShrink: 0 }}>
              {[['profile','Profile'], ['policies', `Policies (${clientPolicies.length})`], ['claims', `Claims (${clientClaims.length})`]].map(([id, label]) => (
                <button key={id} onClick={() => setClientTab(id as any)} style={{ padding: '0.8rem 1.2rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: clientTab === id ? '#c9933a' : '#4a6080', borderBottom: clientTab === id ? '2px solid #c9933a' : '2px solid transparent', marginBottom: '-1px' }}>{label}</button>
              ))}
            </div>
            {/* Profile Tab */}
            {clientTab === 'profile' && (
              <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  ['Email', selected.email], ['Phone', selected.phone || '—'],
                  ['Island', `${getIslandFlag(selected.island)} ${getIslandLabel(selected.island)}`],
                  ['Segment', SEGMENT_LABELS[selected.segment as ClientSegment] || selected.segment],
                  ['Preferred Currency', selected.preferred_currency],
                  ['Risk Score', `${selected.risk_score || 50}/100`],
                  ['Broker', selected.brokers?.name || 'Direct'],
                  ['Client Since', formatDate(selected.created_at)],
                ].map(([label, value], i) => (
                  <div key={i}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>{label}</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.88rem', color: '#f5f0e8' }}>{value}</div>
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>Address</div>
                  <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: '#f5f0e8' }}>{selected.address}</div>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', paddingTop: '0.5rem' }}>
                  <button className="btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => { setEditForm({ ...selected }); setShowEditForm(true) }}>Edit Client</button>
                </div>
                {selected.notes && <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>Notes</div>
                  <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: '#8fa3b8', lineHeight: 1.6 }}>{selected.notes}</div>
                </div>}
              </div>
            )}
            {/* Policies Tab */}
            {clientTab === 'policies' && (
              <div style={{ flex: 1 }}>
                {clientDataLoading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#8fa3b8' }}>Loading…</div> :
                clientPolicies.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#4a6080', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em' }}>No policies on record</div> :
                clientPolicies.map(p => {
                  const days = p.renewal_date ? daysUntil(p.renewal_date) : 999
                  async function handleEditClient(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm) return
    setSaving(true)
    const { error } = await supabase.from('clients').update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      company_name: editForm.company_name,
      email: editForm.email,
      phone: editForm.phone,
      segment: editForm.segment,
      island: editForm.island,
      address: editForm.address,
      preferred_currency: editForm.preferred_currency,
      notes: editForm.notes,
      is_vip: editForm.is_vip,
    }).eq('id', editForm.id)
    if (!error) {
      setShowEditForm(false)
      setEditForm(null)
      setSelected(null)
      load()
    }
    setSaving(false)
  }

  return (
                    <div key={p.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(201,147,58,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.82rem', color: '#c9933a', fontWeight: 600 }}>{p.policy_number}</div>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: '#8fa3b8', marginTop: '0.2rem' }}>{p.coverage_type} · {getIslandFlag(p.island)} {getIslandLabel(p.island)}</div>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: days <= 30 ? '#fc8181' : '#4a6080', marginTop: '0.2rem' }}>Renewal: {formatDate(p.renewal_date)}{days <= 30 ? ` ⚠ ${days}d` : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${POLICY_STATUS_STYLES[p.status] || ''}`}>{formatStatus(p.status)}</span>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: '#e8b04a', marginTop: '0.3rem' }}>{formatCurrency(p.annual_premium, p.premium_currency, true)}</div>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: '#4a6080' }}>Insured: {formatCurrency(p.insured_value, p.currency, true)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {/* Claims Tab */}
            {clientTab === 'claims' && (
              <div style={{ flex: 1 }}>
                {clientDataLoading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#8fa3b8' }}>Loading…</div> :
                clientClaims.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#4a6080', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em' }}>No claims on record</div> :
                clientClaims.map(c => (
                  <div key={c.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(201,147,58,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.82rem', color: '#c9933a', fontWeight: 600 }}>{c.claim_number}</div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: '#8fa3b8', marginTop: '0.2rem' }}>{getIslandFlag(c.island)} {getIslandLabel(c.island)} · {formatDate(c.incident_date)}</div>
                      {c.catastrophe_event && <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: '#e8b04a', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{c.catastrophe_event}{c.storm_name ? ` — ${c.storm_name}` : ''}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${CLAIM_STATUS_STYLES[c.status] || ''}`}>{formatStatus(c.status)}</span>
                      <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: '#fc8181', marginTop: '0.3rem' }}>{formatCurrency(c.reported_loss, c.currency, true)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Client Form */}
      {showEditForm && editForm && (
        <div className="modal-backdrop" onClick={() => setShowEditForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Edit Client</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{editForm.first_name} {editForm.last_name}</div>
            </div>
            <form onSubmit={handleEditClient} style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="crm-label">First Name *</label><input className="crm-input" value={editForm.first_name} onChange={e => setEditForm((f: any) => ({ ...f, first_name: e.target.value }))} required /></div>
              <div><label className="crm-label">Last Name *</label><input className="crm-input" value={editForm.last_name} onChange={e => setEditForm((f: any) => ({ ...f, last_name: e.target.value }))} required /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Company Name</label><input className="crm-input" value={editForm.company_name || ''} onChange={e => setEditForm((f: any) => ({ ...f, company_name: e.target.value }))} /></div>
              <div><label className="crm-label">Email *</label><input className="crm-input" type="email" value={editForm.email} onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value }))} required /></div>
              <div><label className="crm-label">Phone</label><input className="crm-input" value={editForm.phone || ''} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
              <div><label className="crm-label">Segment</label>
                <select className="crm-select" value={editForm.segment} onChange={e => setEditForm((f: any) => ({ ...f, segment: e.target.value }))}>
                  {Object.entries(SEGMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="crm-label">Island</label>
                <select className="crm-select" value={editForm.island} onChange={e => setEditForm((f: any) => ({ ...f, island: e.target.value }))}>
                  {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="crm-label">Preferred Currency</label>
                <select className="crm-select" value={editForm.preferred_currency} onChange={e => setEditForm((f: any) => ({ ...f, preferred_currency: e.target.value }))}>
                  {['USD','BBD','JMD','KYD','TTD','BSD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingTop: '1.4rem' }}>
                <input type="checkbox" id="edit-vip" checked={editForm.is_vip} onChange={e => setEditForm((f: any) => ({ ...f, is_vip: e.target.checked }))} style={{ accentColor: '#c9933a', width: 16, height: 16 }} />
                <label htmlFor="edit-vip" style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c9933a', cursor: 'pointer' }}>VIP Client</label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Address</label><input className="crm-input" value={editForm.address || ''} onChange={e => setEditForm((f: any) => ({ ...f, address: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Notes</label><textarea className="crm-input" rows={3} value={editForm.notes || ''} onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowEditForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Client Form */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>New Client</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Client Profile</div>
            </div>
            <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="crm-label">First Name *</label><input className="crm-input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} required /></div>
              <div><label className="crm-label">Last Name *</label><input className="crm-input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} required /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Company Name</label><input className="crm-input" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
              <div><label className="crm-label">Email *</label><input className="crm-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div><label className="crm-label">Phone</label><input className="crm-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div>
                <label className="crm-label">Segment *</label>
                <select className="crm-select" value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value as ClientSegment }))} required>
                  {Object.entries(SEGMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="crm-label">Island *</label>
                <select className="crm-select" value={form.island} onChange={e => setForm(f => ({ ...f, island: e.target.value as Island }))} required>
                  {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="crm-label">Preferred Currency</label>
                <select className="crm-select" value={form.preferred_currency} onChange={e => setForm(f => ({ ...f, preferred_currency: e.target.value as Currency }))}>
                  {['USD','BBD','JMD','KYD','TTD','BSD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingTop: '1.4rem' }}>
                <input type="checkbox" id="vip" checked={form.is_vip} onChange={e => setForm(f => ({ ...f, is_vip: e.target.checked }))} style={{ accentColor: '#c9933a', width: 16, height: 16 }} />
                <label htmlFor="vip" style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c9933a', cursor: 'pointer' }}>VIP Client</label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Address *</label><input className="crm-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Notes</label><textarea className="crm-input" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Create Client'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
