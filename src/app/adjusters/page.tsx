'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Toast, useToast } from '@/components/Toast'
import { Pagination } from '@/components/Pagination'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { formatCurrency, formatDate, formatStatus, getIslandLabel, getIslandFlag, CLAIM_STATUS_STYLES } from '@/lib/utils'
import { Island, ISLAND_LABELS } from '@/types'

const SPECIALIZATION_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  hospitality: 'Hospitality',
  marine: 'Marine & Yacht',
  catastrophe: 'Catastrophe',
  general: 'General',
}

const EMPTY = {
  name: '', email: '', phone: '', island: 'barbados' as Island,
  license_number: '', specialization: 'general', daily_rate: '', currency: 'USD', notes: '',
}

export default function AdjustersPage() {
  const supabase = createClient()
  const [adjusters, setAdjusters] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editForm, setEditForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const { toast, show: showToast, hide: hideToast } = useToast()
  const [confirmDelete, setConfirmDelete] = useState<any>(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 12
  const [selected, setSelected] = useState<any>(null)
  const [adjTab, setAdjTab] = useState<'profile'|'claims'>('profile')
  const [adjClaims, setAdjClaims] = useState<any[]>([])
  const [adjLoading, setAdjLoading] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    const [adjRes, claimRes] = await Promise.all([
      supabase.from('adjusters').select('*').order('name'),
      supabase.from('claims').select('id, adjuster_id, status').not('adjuster_id', 'is', null),
    ])
    setAdjusters(adjRes.data || [])
    setClaims(claimRes.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function openAdjuster(a: any) {
    setSelected(a)
    setAdjTab('profile')
    setAdjLoading(true)
    const { data } = await supabase.from('claims').select('id, claim_number, status, reported_loss, currency, island, incident_date, coverage_type, clients(first_name, last_name, company_name)').eq('adjuster_id', a.id).order('created_at', { ascending: false })
    setAdjClaims(data || [])
    setAdjLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('adjusters').insert({
      ...form,
      daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : null,
      is_available: true,
    })
    if (!error) { setShowForm(false); setForm(EMPTY); load(); showToast('Adjuster added.', 'success') } else { showToast('Save failed.', 'error') }
    setSaving(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm) return
    setSaving(true)
    const { error } = await supabase.from('adjusters').update({
      name: editForm.name, email: editForm.email, phone: editForm.phone,
      island: editForm.island, license_number: editForm.license_number,
      specialization: editForm.specialization,
      daily_rate: editForm.daily_rate ? parseFloat(editForm.daily_rate) : null,
      currency: editForm.currency, notes: editForm.notes,
    }).eq('id', editForm.id)
    if (!error) { setShowEditForm(false); setEditForm(null); setSelected(null); load(); showToast('Adjuster updated.', 'success') } else { showToast('Update failed.', 'error') }
    setSaving(false)
  }

  async function toggleAvailability(id: string, current: boolean) {
    await supabase.from('adjusters').update({ is_available: !current }).eq('id', id)
    load()
    if (selected?.id === id) setSelected((a: any) => ({ ...a, is_available: !current }))
  }

  const filtered = adjusters.filter(a => !search || `${a.name} ${a.email} ${a.island}`.toLowerCase().includes(search.toLowerCase()))

  const getActiveClaims = (id: string) => claims.filter(c => c.adjuster_id === id && !['settled','rejected'].includes(c.status)).length
  const getTotalClaims = (id: string) => claims.filter(c => c.adjuster_id === id).length

  async function handleDelete(item: any) {
    const { error } = await supabase.from('adjusters').delete().eq('id', item.id)
    if (error) {
      showToast('Delete failed.', 'error')
    } else {
      showToast(`${item.name} deleted.`, 'success')
      setSelected(null)
      load()
    }
    setConfirmDelete(null)
  }

  const totalFiltered = filtered.length
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="page-enter" style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div>
          <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Claims Operations</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Adjusters</h1>
          <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--text-mist)', marginTop: '0.3rem' }}>
            Field Adjuster Roster · Availability · Workload Management
          </div>
        </div>
        <button className="btn-gold" onClick={() => setShowForm(true)}>+ Add Adjuster</button>
      </div>

      {/* KPIs */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '1.5rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Total Adjusters', value: adjusters.length.toString() },
          { label: 'Available', value: adjusters.filter(a => a.is_available).length.toString(), color: '#4ade80' },
          { label: 'Unavailable', value: adjusters.filter(a => !a.is_available).length.toString(), color: '#fc8181' },
          { label: 'Active Assignments', value: claims.filter(c => !['settled','rejected'].includes(c.status)).length.toString(), color: 'var(--text-amber)' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', padding: '1rem 1.2rem' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-mist)' }}>{k.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', fontWeight: 900, color: k.color || '#c9933a', marginTop: '0.2rem' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.2rem' }}>
        <input className="crm-input" style={{ maxWidth: 300 }} placeholder="Search adjuster name, email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {/* Adjuster Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <div style={{ color: 'var(--text-mist)', fontFamily: 'Barlow Condensed' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em' }}>
            No adjusters found. Add your first adjuster to start assigning claims.
          </div>
        ) : paged.map(a => {
          const active = getActiveClaims(a.id)
          const total = getTotalClaims(a.id)
          const load_pct = Math.min(100, active * 20) // 5 active = 100%

          return (
            <div key={a.id} className="crm-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => openAdjuster(a)}>
              {/* Availability indicator */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: a.is_available ? '#4ade80' : '#fc8181' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.is_available ? '#4ade80' : '#fc8181', display: 'inline-block' }} />
                  {a.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              {/* Initials avatar */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '1rem' }}>
                <div style={{ width: 40, height: 40, background: 'rgba(201,147,58,0.12)', border: '1px solid rgba(201,147,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed', fontSize: '0.85rem', color: '#c9933a', flexShrink: 0 }}>
                  {a.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'Barlow', fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: '#c9933a', marginTop: '1px' }}>{SPECIALIZATION_LABELS[a.specialization] || a.specialization}</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', color: 'var(--text-mist)', marginTop: '1px' }}>{getIslandFlag(a.island)} {getIslandLabel(a.island)}</div>
                </div>
              </div>

              {/* Workload bar */}
              <div style={{ marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Current Workload</span>
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: active > 4 ? '#fc8181' : active > 2 ? '#e8b04a' : '#4ade80', fontWeight: 600 }}>{active} active · {total} total</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-raised)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${load_pct}%`, background: load_pct > 80 ? '#c0392b' : load_pct > 50 ? '#e67e22' : '#27ae60', borderRadius: 2, transition: 'width 0.4s' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                  {a.daily_rate ? `${a.currency || 'USD'} ${a.daily_rate}/day` : 'Rate not set'}
                </span>
                <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-dim)' }}>#{a.license_number || 'No license'}</span>
              </div>
            </div>
          )
        })}
      </div>
      <Pagination total={totalFiltered} page={page} perPage={PER_PAGE} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />

      {/* Adjuster Detail Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(201,147,58,0.12)', border: '1px solid rgba(201,147,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed', fontSize: '1rem', color: '#c9933a', flexShrink: 0 }}>
                  {selected.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selected.name}</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: 'var(--text-mist)' }}>{SPECIALIZATION_LABELS[selected.specialization]} · {getIslandFlag(selected.island)} {getIslandLabel(selected.island)}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-mist)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,147,58,0.1)', flexShrink: 0 }}>
              {[['profile','Profile'], ['claims', `Assigned Claims (${adjClaims.length})`]].map(([id, label]) => (
                <button key={id} onClick={() => setAdjTab(id as any)} style={{ padding: '0.8rem 1.2rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Barlow Condensed', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: adjTab === id ? '#c9933a' : 'var(--text-dim)', borderBottom: adjTab === id ? '2px solid #c9933a' : '2px solid transparent', marginBottom: '-1px' }}>{label}</button>
              ))}
            </div>
            {adjTab === 'profile' && (
              <div style={{ padding: '1.5rem' }}>
                {/* Workload summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(201,147,58,0.08)', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Active Claims', value: getActiveClaims(selected.id).toString(), color: getActiveClaims(selected.id) > 4 ? '#fc8181' : '#e8b04a' },
                    { label: 'Total Handled', value: getTotalClaims(selected.id).toString(), color: '#c9933a' },
                    { label: 'Daily Rate', value: selected.daily_rate ? `${selected.currency} ${selected.daily_rate}` : '—', color: 'var(--text-primary)' },
                  ].map((k, i) => (
                    <div key={i} style={{ background: 'var(--bg-deep)', padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>{k.label}</div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', fontWeight: 900, color: k.color, marginTop: '0.3rem' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
                <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                  {[
                    ['Email', selected.email || '—'],
                    ['Phone', selected.phone || '—'],
                    ['Island', `${getIslandFlag(selected.island)} ${getIslandLabel(selected.island)}`],
                    ['Specialization', SPECIALIZATION_LABELS[selected.specialization] || selected.specialization],
                    ['License #', selected.license_number || '—'],
                    ['Availability', selected.is_available ? '✅ Available' : '🔴 Unavailable'],
                  ].map(([l, v], i) => (
                    <div key={i}>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>{l}</div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {selected.notes && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Notes</div>
                    <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: 'var(--text-mist)', lineHeight: 1.6 }}>{selected.notes}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <button className="btn-ghost" onClick={() => { setEditForm({ ...selected, daily_rate: String(selected.daily_rate || '') }); setShowEditForm(true) }}>Edit Adjuster</button>
                  <button onClick={() => toggleAvailability(selected.id, selected.is_available)} style={{ fontFamily: 'Barlow Condensed', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.65rem 1.2rem', background: selected.is_available ? 'rgba(192,57,43,0.12)' : 'rgba(39,174,96,0.1)', border: `1px solid ${selected.is_available ? 'rgba(192,57,43,0.3)' : 'rgba(39,174,96,0.3)'}`, color: selected.is_available ? '#fc8181' : '#4ade80', cursor: 'pointer', fontSize: '0.75rem' }}>
                    {selected.is_available ? 'Mark Unavailable' : 'Mark Available'}
                  </button>
                </div>
              </div>
            )}
            {adjTab === 'claims' && (
              <div style={{ flex: 1 }}>
                {adjLoading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-mist)' }}>Loading…</div> :
                adjClaims.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em' }}>No claims assigned to this adjuster</div> :
                adjClaims.map(c => (
                  <div key={c.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(201,147,58,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.82rem', color: '#c9933a', fontWeight: 600 }}>{c.claim_number}</div>
                      <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{c.clients ? `${c.clients.first_name} ${c.clients.last_name}${c.clients.company_name ? ` — ${c.clients.company_name}` : ''}` : '—'}</div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.68rem', color: 'var(--text-mist)', marginTop: '0.15rem' }}>{getIslandFlag(c.island)} {getIslandLabel(c.island)} · {formatDate(c.incident_date)} · {c.coverage_type}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${CLAIM_STATUS_STYLES[c.status] || ''}`}>{formatStatus(c.status)}</span>
                      <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: '#fc8181', marginTop: '0.3rem', fontSize: '0.82rem' }}>{formatCurrency(c.reported_loss, c.currency, true)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Adjuster Form */}
      {showEditForm && editForm && (
        <div className="modal-backdrop" onClick={() => setShowEditForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Edit Adjuster</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{editForm.name}</div>
            </div>
            <form onSubmit={handleEdit} className="two-col-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label className="crm-label">Full Name *</label><input className="crm-input" value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="crm-label">Email</label><input className="crm-input" type="email" value={editForm.email || ''} onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
              <div><label className="crm-label">Phone</label><input className="crm-input" value={editForm.phone || ''} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
              <div><label className="crm-label">Island</label>
                <select className="crm-select" value={editForm.island} onChange={e => setEditForm((f: any) => ({ ...f, island: e.target.value }))}>
                  {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="crm-label">Specialization</label>
                <select className="crm-select" value={editForm.specialization} onChange={e => setEditForm((f: any) => ({ ...f, specialization: e.target.value }))}>
                  {Object.entries(SPECIALIZATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="crm-label">License Number</label><input className="crm-input" value={editForm.license_number || ''} onChange={e => setEditForm((f: any) => ({ ...f, license_number: e.target.value }))} /></div>
              <div><label className="crm-label">Daily Rate</label><input className="crm-input" type="number" value={editForm.daily_rate} onChange={e => setEditForm((f: any) => ({ ...f, daily_rate: e.target.value }))} /></div>
              <div><label className="crm-label">Currency</label>
                <select className="crm-select" value={editForm.currency || 'USD'} onChange={e => setEditForm((f: any) => ({ ...f, currency: e.target.value }))}>
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

      {/* Add Adjuster Form */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Claims Operations</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Add New Adjuster</div>
            </div>
            <form onSubmit={handleSave} className="two-col-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Full Name *</label><input className="crm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="crm-label">Email</label><input className="crm-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><label className="crm-label">Phone</label><input className="crm-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><label className="crm-label">Island *</label>
                <select className="crm-select" value={form.island} onChange={e => setForm(f => ({ ...f, island: e.target.value as Island }))} required>
                  {Object.entries(ISLAND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="crm-label">Specialization</label>
                <select className="crm-select" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}>
                  {Object.entries(SPECIALIZATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="crm-label">License Number</label><input className="crm-input" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} /></div>
              <div><label className="crm-label">Daily Rate</label><input className="crm-input" type="number" placeholder="e.g. 450" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} /></div>
              <div><label className="crm-label">Currency</label>
                <select className="crm-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  {['USD','BBD','JMD','KYD','TTD','BSD'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}><label className="crm-label">Notes</label><textarea className="crm-input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? 'Saving…' : 'Add Adjuster'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Adjuster"
          message={`Delete ${confirmDelete.name}? This cannot be undone.`}
          confirmLabel="Delete Adjuster"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={hideToast} />}
    </div>
  )
}
