'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatStatus, formatDate, getIslandLabel, getIslandFlag, POLICY_STATUS_STYLES, daysUntil } from '@/lib/utils'
import { Island, Currency, ISLAND_LABELS } from '@/types'

const EMPTY = {
  name: '', company: '', email: '', phone: '',
  island: 'barbados' as Island, license_number: '',
  commission_rate: '12', currency: 'USD' as Currency, notes: '',
}

export default function BrokersPage() {
  const supabase = createClient()
  const [brokers, setBrokers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [brokerTab, setBrokerTab] = useState<'profile'|'policies'>('profile')
  const [brokerPolicies, setBrokerPolicies] = useState<any[]>([])
  const [brokerLoading, setBrokerLoading] = useState(false)

  async function load() {
    const { data } = await supabase.from('brokers').select('*').order('ytd_premium_volume', { ascending: false })
    setBrokers(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = brokers.filter(b => !search || `${b.name} ${b.company} ${b.email}`.toLowerCase().includes(search.toLowerCase()))

  async function openBroker(b: any) {
    setSelected(b)
    setBrokerTab('profile')
    setBrokerLoading(true)
    const { data } = await supabase.from('policies').select('id, policy_number, coverage_type, status, annual_premium, premium_currency, insured_value, currency, renewal_date, island, clients(first_name, last_name, company_name)').eq('broker_id', b.id).order('created_at', { ascending: false })
    setBrokerPolicies(data || [])
    setBrokerLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('brokers').insert({ ...form, commission_rate: parseFloat(form.commission_rate), status: 'active' })
    if (!error) { setShowForm(false); setForm(EMPTY); load() }
    setSaving(false)
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === 'active' ? 'inactive' : 'active'
    await supabase.from('brokers').update({ status: next }).eq('id', id)
    load()
  }

  const totalVolume = filtered.reduce((s, b) => s + (b.ytd_premium_volume || 0), 0)
  const totalCommission = filtered.reduce((s, b) => s + (b.ytd_commission_earned || 0), 0)

  async function handleEditBroker(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm) return
    setSaving(true)
    const { error } = await supabase.from('brokers').update({
      name: editForm.name,
      company: editForm.company,
      email: editForm.email,
      phone: editForm.phone,
      island: editForm.island,
      license_number: editForm.license_number,
      commission_rate: parseFloat(editForm.commission_rate),
      currency: editForm.currency,
      notes: editForm.notes,
    }).eq('id', editForm.id)
    if (!error) { setShowEditForm(false); setEditForm(null); setSelected(null); load() }
    setSaving(false)
  }

  return (
    <div className="page-enter" style={{ padding: '2rem', minHeight: '100vh', background: '#0a0f1e' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Distribution</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: 0 }}>Brokers & Commission</h1>
        </div>
        <button className="btn-gold" onClick={() => setShowForm(true)}>+ Add Broker</button>
      </div>

      {/* KPIs */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '1.5rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Active Brokers', value: filtered.filter(b => b.status === 'active').length.toString() },
          { label: 'YTD Premium Volume', value: formatCurrency(totalVolume, 'USD', true) },
          { label: 'YTD Commissions Paid', value: formatCurrency(totalCommission, 'USD', true) },
          { label: 'Total Policies', value: filtered.reduce((s, b) => s + (b.policy_count || 0), 0).toString() },
        ].map((k, i) => (
          <div key={i} style={{ background: '#111827', padding: '1rem 1.2rem' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8fa3b8' }}>{k.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 900, color: '#c9933a', marginTop: '0.2rem' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <input className="crm-input" style={{ maxWidth: 300 }} placeholder="Search broker name, company…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Broker Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {loading ? (
          <div style={{ color: '#8fa3b8', fontFamily: 'Barlow Condensed' }}>Loading…</div>
        ) : filtered.map(b => (
          <div key={b.id} className="crm-card" style={{ cursor: 'pointer', transition: 'border-color 0.2s', position: 'relative' }} onClick={() => openBroker(b)}>
            {b.status !== 'active' && (
              <div style={{ position: 'absolute', top: '0.8rem', right: '0.8rem' }}>
                <span className="badge" style={{ background: 'rgba(100,100,100,0.2)', borderColor: '#4a5a6a', color: '#8fa3b8' }}>Inactive</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, background: 'rgba(201,147,58,0.1)', border: '1px solid rgba(201,147,58,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed', fontSize: '0.85rem', color: '#c9933a', flexShrink: 0 }}>
                {b.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontFamily: 'Barlow', fontSize: '0.95rem', color: '#f5f0e8', fontWeight: 500 }}>{b.name}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: '#8fa3b8', letterSpacing: '0.06em' }}>{b.company}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: '#c9933a', marginTop: '2px' }}>{getIslandFlag(b.island)} {getIslandLabel(b.island)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(201,147,58,0.08)' }}>
              <div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080' }}>Premium Vol.</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.9rem', color: '#c9933a', fontWeight: 600, marginTop: '0.2rem' }}>{formatCurrency(b.ytd_premium_volume, b.currency, true)}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080' }}>Commission</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.9rem', color: '#e8b04a', fontWeight: 600, marginTop: '0.2rem' }}>{formatCurrency(b.ytd_commission_earned, b.currency, true)}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080' }}>Rate</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.9rem', color: '#f5f0e8', fontWeight: 600, marginTop: '0.2rem' }}>{b.commission_rate}%</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem' }}>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: '#8fa3b8' }}>{b.policy_count} policies · {b.client_count} clients</span>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: '#4a6080', letterSpacing: '0.1em' }}>#{b.license_number}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Broker Detail Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Broker Profile</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{selected.name}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: '#8fa3b8', marginTop: '0.2rem' }}>{selected.company} · #{selected.license_number}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8fa3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,147,58,0.1)', flexShrink: 0 }}>
              {[['profile','Profile'], ['policies', `Policies (${brokerPolicies.length})`]].map(([id, label]) => (
                <button key={id} onClick={() => setBrokerTab(id as any)} style={{ padding: '0.8rem 1.2rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: brokerTab === id ? '#c9933a' : '#4a6080', borderBottom: brokerTab === id ? '2px solid #c9933a' : '2px solid transparent', marginBottom: '-1px' }}>{label}</button>
              ))}
            </div>
            {brokerTab === 'profile' && (
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(201,147,58,0.08)', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'YTD Volume', value: formatCurrency(selected.ytd_premium_volume, selected.currency, true) },
                    { label: 'Commission Earned', value: formatCurrency(selected.ytd_commission_earned, selected.currency, true) },
                    { label: 'Commission Rate', value: `${selected.commission_rate}%` },
                  ].map((k, i) => (
                    <div key={i} style={{ background: '#0d1321', padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080' }}>{k.label}</div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 900, color: '#c9933a', marginTop: '0.3rem' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                  {[
                    ['Email', selected.email], ['Phone', selected.phone || '—'],
                    ['Island', `${getIslandFlag(selected.island)} ${getIslandLabel(selected.island)}`],
                    ['Status', formatStatus(selected.status)],
                    ['Policies', `${selected.policy_count}`], ['Clients', `${selected.client_count}`],
                  ].map(([label, value], i) => (
                    <div key={i}>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4a6080', marginBottom: '0.3rem' }}>{label}</div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.88rem', color: '#f5f0e8' }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '1rem', background: 'rgba(46,64,96,0.2)', border: '1px solid rgba(201,147,58,0.1)', marginBottom: '1rem' }}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '0.5rem' }}>Commission Progress vs Target</div>
                  <div style={{ height: 6, background: 'rgba(46,64,96,0.5)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (selected.ytd_commission_earned / (selected.ytd_premium_volume * 0.15)) * 100)}%`, background: '#c9933a', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: '#8fa3b8', marginTop: '0.3rem' }}>
                    {((selected.ytd_commission_earned / Math.max(1, selected.ytd_premium_volume * 0.15)) * 100).toFixed(0)}% of annual target · Est. commission on {formatCurrency(selected.ytd_premium_volume * (selected.commission_rate / 100), selected.currency, true)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button className="btn-ghost" onClick={() => { setEditForm({ ...selected, commission_rate: String(selected.commission_rate) }); setShowEditForm(true) }}>Edit Broker</button>
                  <button className="btn-ghost" onClick={() => toggleStatus(selected.id, selected.status)}>
                    {selected.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )}
            {brokerTab === 'policies' && (
              <div style={{ flex: 1 }}>
                {brokerLoading ? <div style={{ padding: '2rem', textAlign: 'center', color: '#8fa3b8' }}>Loading…</div> :
                brokerPolicies.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#4a6080', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em' }}>No policies distributed through this broker</div> :
                brokerPolicies.map(p => {
                  const days = p.renewal_date ? daysUntil(p.renewal_date) : 999
                  const client = p.clients
                  async function handleEditBroker(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm) return
    setSaving(true)
    const { error } = await supabase.from('brokers').update({
      name: editForm.name,
      company: editForm.company,
      email: editForm.email,
      phone: editForm.phone,
      island: editForm.island,
      license_number: editForm.license_number,
      commission_rate: parseFloat(editForm.commission_rate),
      currency: editForm.currency,
      notes: editForm.notes,
    }).eq('id', editForm.id)
    if (!error) { setShowEditForm(false); setEditForm(null); setSelected(null); load() }
    setSaving(false)
  }

  return (
                    <div key={p.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(201,147,58,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.82rem', color: '#c9933a', fontWeight: 600 }}>{p.policy_number}</div>
                        <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: '#f5f0e8', marginTop: '0.15rem' }}>{client ? `${client.first_name} ${client.last_name}${client.company_name ? ` — ${client.company_name}` : ''}` : '—'}</div>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', color: '#8fa3b8', marginTop: '0.15rem' }}>{p.coverage_type} · {getIslandFlag(p.island)} {getIslandLabel(p.island)}</div>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: days <= 30 ? '#fc8181' : '#4a6080', marginTop: '0.15rem' }}>Renewal: {formatDate(p.renewal_date)}{days <= 30 ? ` ⚠ ${days}d` : ''}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${POLICY_STATUS_STYLES[p.status] || ''}`}>{formatStatus(p.status)}</span>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: '#e8b04a', marginTop: '0.3rem' }}>{formatCurrency(p.annual_premium, p.premium_currency, true)}</div>
                        <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', color: '#c9933a' }}>Est. comm: {formatCurrency(p.annual_premium * (selected.commission_rate / 100), p.premium_currency, true)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Broker Form */}
      {showEditForm && editForm && (
        <div className="modal-backdrop" onClick={() => setShowEditForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Edit Broker</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{editForm.name}</div>
            </div>
            <form onSubmit={handleEditBroker} style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="crm-label">Full Name *</label><input className="crm-input" value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="crm-label">Company *</label><input className="crm-input" value={editForm.company} onChange={e => setEditForm((f: any) => ({ ...f, company: e.target.value }))} required /></div>
              <div><label className="crm-label">Email *</label><input className="crm-input" type="email" value={editForm.email} onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value }))} required /></div>
              <div><label className="crm-label">Phone</label><input className="crm-input" value={editForm.phone || ''} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
              <div><label className="crm-label">Island</label>
                <select className="crm-select" value={editForm.island} onChange={e => setEditForm((f: any) => ({ ...f, island: e.target.value }))}>
                  {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="crm-label">License Number</label><input className="crm-input" value={editForm.license_number || ''} onChange={e => setEditForm((f: any) => ({ ...f, license_number: e.target.value }))} /></div>
              <div><label className="crm-label">Commission Rate %</label><input className="crm-input" type="number" step="0.5" value={editForm.commission_rate} onChange={e => setEditForm((f: any) => ({ ...f, commission_rate: e.target.value }))} /></div>
              <div><label className="crm-label">Currency</label>
                <select className="crm-select" value={editForm.currency} onChange={e => setEditForm((f: any) => ({ ...f, currency: e.target.value }))}>
                  {['USD','BBD','JMD','KYD','TTD','BSD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Notes</label><textarea className="crm-input" rows={2} value={editForm.notes || ''} onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowEditForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Broker Form */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111827', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Distribution</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Add New Broker</div>
            </div>
            <form onSubmit={handleSave} style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="crm-label">Full Name *</label><input className="crm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="crm-label">Company *</label><input className="crm-input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required /></div>
              <div><label className="crm-label">Email *</label><input className="crm-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div><label className="crm-label">Phone</label><input className="crm-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div>
                <label className="crm-label">Island *</label>
                <select className="crm-select" value={form.island} onChange={e => setForm(f => ({ ...f, island: e.target.value as Island }))} required>
                  {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="crm-label">License Number *</label><input className="crm-input" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} required /></div>
              <div><label className="crm-label">Commission Rate %</label><input className="crm-input" type="number" step="0.5" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))} /></div>
              <div>
                <label className="crm-label">Currency</label>
                <select className="crm-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))}>
                  {['USD','BBD','JMD','KYD','TTD','BSD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Notes</label><textarea className="crm-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Add Broker'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
