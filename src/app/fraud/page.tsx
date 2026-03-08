'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatStatus, getIslandLabel, getIslandFlag, FRAUD_RISK_STYLES } from '@/lib/utils'

const FRAUD_PATTERNS = [
  { pattern: 'Multiple claims within 12 months', weight: 35, triggered: 8 },
  { pattern: 'Claim filed within 90 days of policy', weight: 30, triggered: 5 },
  { pattern: 'Reported loss exceeds insured value', weight: 45, triggered: 2 },
  { pattern: 'Contractor not on approved panel', weight: 20, triggered: 11 },
  { pattern: 'No police report for theft claim', weight: 25, triggered: 6 },
  { pattern: 'Pre-existing damage evidence', weight: 40, triggered: 3 },
  { pattern: 'Same adjuster + contractor combo', weight: 30, triggered: 4 },
  { pattern: 'Social media contradicts loss claim', weight: 35, triggered: 1 },
]

type AlertStatus = 'open' | 'under_review' | 'cleared' | 'escalated' | 'confirmed'

export default function FraudPage() {
  const supabase = createClient()
  const [alerts, setAlerts] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [alertRes, claimRes] = await Promise.all([
        supabase.from('fraud_alerts').select(`*, claims(claim_number, reported_loss, currency, incident_date, island, coverage_type, fraud_risk, fraud_flags), clients(first_name, last_name, company_name, email, is_vip, segment)`).order('created_at', { ascending: false }),
        supabase.from('claims').select('id, claim_number, fraud_risk, fraud_flags, reported_loss, currency, island, coverage_type, clients(first_name, last_name, company_name)').in('fraud_risk', ['watch', 'suspicious', 'flagged', 'confirmed_fraud']),
      ])
      setAlerts(alertRes.data || [])
      setClaims(claimRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function updateAlertStatus(id: string, newStatus: string) {
    setSaving(true)
    await supabase.from('fraud_alerts').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status: newStatus }))
    setSaving(false)
  }

  async function updateClaimFraudRisk(claimId: string, risk: string) {
    await supabase.from('claims').update({ fraud_risk: risk, updated_at: new Date().toISOString() }).eq('id', claimId)
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, fraud_risk: risk } : c))
  }

  const filtered = alerts.filter(a => !filterStatus || a.status === filterStatus)
  const openCount = alerts.filter(a => a.status === 'open').length
  const flaggedCount = alerts.filter(a => ['flagged', 'confirmed_fraud'].includes(a.claims?.fraud_risk || '')).length
  const avgRisk = alerts.length > 0 ? Math.round(alerts.reduce((s, a) => s + (a.risk_score || 0), 0) / alerts.length) : 0
  const totalExposure = alerts.reduce((s, a) => s + (a.claims?.reported_loss || 0), 0)

  // Seed some mock alerts if DB is empty
  const MOCK_ALERTS = [
    { id: 'm1', status: 'open', risk_score: 82, alert_type: 'Multiple Claims Pattern', flags: ['3rd claim in 14 months', 'Same contractor', 'No police report'], claims: { claim_number: 'CLM-2024-050003', reported_loss: 580000, currency: 'USD', island: 'barbados', coverage_type: 'commercial', fraud_risk: 'flagged' }, clients: { first_name: 'Marcus', last_name: 'Reynolds', email: 'mreynolds@bayviewgroup.bb', is_vip: false, segment: 'commercial_owner' }, created_at: '2024-09-12T14:22:00Z' },
    { id: 'm2', status: 'under_review', risk_score: 64, alert_type: 'Early Claim Filing', flags: ['Claimed 44 days after policy inception', 'Loss inconsistent with property age'], claims: { claim_number: 'CLM-2024-050007', reported_loss: 1250000, currency: 'USD', island: 'jamaica', coverage_type: 'residential', fraud_risk: 'suspicious' }, clients: { first_name: 'Yvonne', last_name: 'Clarke-Whitfield', email: 'yclarke@privmail.jm', is_vip: true, segment: 'high_value_homeowner' }, created_at: '2024-09-18T09:45:00Z' },
    { id: 'm3', status: 'cleared', risk_score: 45, alert_type: 'Contractor Concern', flags: ['Unapproved contractor used', 'Invoice appears altered'], claims: { claim_number: 'CLM-2024-050002', reported_loss: 145000, currency: 'USD', island: 'cayman_islands', coverage_type: 'residential', fraud_risk: 'watch' }, clients: { first_name: 'Dominic', last_name: 'Farquhar', email: 'dfarquhar@cayman.ky', is_vip: false, segment: 'high_value_homeowner' }, created_at: '2024-08-30T11:15:00Z' },
    { id: 'm4', status: 'escalated', risk_score: 91, alert_type: 'Value Inflation Suspected', flags: ['Reported loss 3.2× assessed value', 'Prior claim on same property', 'Contractor conflict of interest'], claims: { claim_number: 'CLM-2024-050009', reported_loss: 2800000, currency: 'USD', island: 'bahamas', coverage_type: 'hospitality', fraud_risk: 'confirmed_fraud' }, clients: { first_name: 'Cayman Crest', last_name: 'Holdings Ltd', email: 'admin@ccresort.bs', is_vip: false, segment: 'boutique_resort' }, created_at: '2024-10-02T16:30:00Z' },
  ]

  const displayAlerts = filtered.length > 0 ? filtered : MOCK_ALERTS.filter(a => !filterStatus || a.status === filterStatus)
  const displayClaims = claims.length > 0 ? claims : [
    { id: 'c1', claim_number: 'CLM-2024-050003', fraud_risk: 'flagged', reported_loss: 580000, currency: 'USD', island: 'barbados', coverage_type: 'commercial', clients: { first_name: 'Marcus', last_name: 'Reynolds', company_name: 'Bayview Group' } },
    { id: 'c2', claim_number: 'CLM-2024-050009', fraud_risk: 'confirmed_fraud', reported_loss: 2800000, currency: 'USD', island: 'bahamas', coverage_type: 'hospitality', clients: { first_name: 'Cayman Crest', last_name: 'Holdings', company_name: 'Cayman Crest Holdings Ltd' } },
    { id: 'c3', claim_number: 'CLM-2024-050007', fraud_risk: 'suspicious', reported_loss: 1250000, currency: 'USD', island: 'jamaica', coverage_type: 'residential', clients: { first_name: 'Yvonne', last_name: 'Clarke-Whitfield', company_name: null } },
  ]

  const riskBadge = (risk: string) => {
    const styles: Record<string, { bg: string, color: string, border: string }> = {
      clear: { bg: 'rgba(39,174,96,0.15)', color: '#4ade80', border: 'rgba(39,174,96,0.3)' },
      watch: { bg: 'rgba(241,196,15,0.15)', color: '#fbbf24', border: 'rgba(241,196,15,0.3)' },
      suspicious: { bg: 'rgba(230,126,34,0.15)', color: '#fb923c', border: 'rgba(230,126,34,0.3)' },
      flagged: { bg: 'rgba(192,57,43,0.2)', color: '#fc8181', border: 'rgba(192,57,43,0.4)' },
      confirmed_fraud: { bg: 'rgba(127,29,29,0.4)', color: '#fca5a5', border: 'rgba(192,57,43,0.6)' },
    }
    const s = styles[risk] || styles.clear
    return <span className="badge" style={{ background: s.bg, color: s.color, borderColor: s.border }}>{formatStatus(risk)}</span>
  }

  return (
    <div style={{ padding: '2rem', background: '#0a0f1e', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Intelligence Layer</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: 0 }}>
          Fraud Detection
        </h1>
        <p style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: '#8fa3b8', marginTop: '0.3rem' }}>
          Automated pattern detection · Risk scoring · Alert management · Claims fraud intelligence
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '2rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Open Alerts', value: (openCount || MOCK_ALERTS.filter(a => a.status === 'open').length).toString(), color: '#c0392b', sub: 'Require review' },
          { label: 'Escalated Cases', value: (alerts.filter(a => a.status === 'escalated').length || 1).toString(), color: '#e67e22', sub: 'SIU referral' },
          { label: 'Avg Risk Score', value: (avgRisk || 71).toString(), color: '#f1c40f', sub: 'Open alerts' },
          { label: 'Flagged Exposure', value: formatCurrency(totalExposure || 4630000, 'USD', true), color: '#c0392b', sub: 'Under investigation' },
        ].map((kpi, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8fa3b8', marginBottom: '0.5rem' }}>{kpi.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 900, color: kpi.color, lineHeight: 1, marginBottom: '0.4rem' }}>{kpi.value}</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: '#8fa3b8' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Alert Queue */}
        <div className="crm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(201,147,58,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: '0.2rem' }}>Fraud Alert Queue</div>
              <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: '#8fa3b8' }}>Automated pattern-triggered alerts</div>
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="crm-input"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="escalated">Escalated</option>
              <option value="cleared">Cleared</option>
            </select>
          </div>
          <table className="crm-table">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Client</th>
                <th>Alert Type</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayAlerts.map((alert: any) => (
                <tr key={alert.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(alert)}>
                  <td style={{ fontFamily: 'Barlow Condensed', color: '#c9933a', fontSize: '0.8rem' }}>
                    {alert.claims?.claim_number || '—'}
                  </td>
                  <td style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: '#f5f0e8' }}>
                    {alert.clients?.company_name || `${alert.clients?.first_name} ${alert.clients?.last_name}`}
                  </td>
                  <td style={{ fontFamily: 'Barlow', fontSize: '0.8rem', color: '#8fa3b8', maxWidth: '160px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.alert_type}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 40, height: 5, background: 'rgba(46,64,96,0.5)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${alert.risk_score}%`, background: alert.risk_score >= 80 ? '#c0392b' : alert.risk_score >= 65 ? '#e67e22' : '#f1c40f', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, color: alert.risk_score >= 80 ? '#fc8181' : alert.risk_score >= 65 ? '#fb923c' : '#fbbf24' }}>{alert.risk_score}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: alert.status === 'open' ? 'rgba(192,57,43,0.2)' : alert.status === 'escalated' ? 'rgba(230,126,34,0.2)' : alert.status === 'cleared' ? 'rgba(39,174,96,0.15)' : 'rgba(241,196,15,0.15)',
                      color: alert.status === 'open' ? '#fc8181' : alert.status === 'escalated' ? '#fb923c' : alert.status === 'cleared' ? '#4ade80' : '#fbbf24',
                      borderColor: alert.status === 'open' ? 'rgba(192,57,43,0.4)' : 'rgba(201,147,58,0.2)',
                    }}>
                      {formatStatus(alert.status)}
                    </span>
                  </td>
                  <td>
                    {alert.status === 'open' && (
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button onClick={(e) => { e.stopPropagation(); updateAlertStatus(alert.id, 'under_review') }} style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.1em', padding: '0.25rem 0.5rem', background: 'rgba(201,147,58,0.1)', border: '1px solid rgba(201,147,58,0.3)', color: '#c9933a', cursor: 'pointer', textTransform: 'uppercase' }}>
                          Review
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); updateAlertStatus(alert.id, 'escalated') }} style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.1em', padding: '0.25rem 0.5rem', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#fc8181', cursor: 'pointer', textTransform: 'uppercase' }}>
                          Escalate
                        </button>
                      </div>
                    )}
                    {alert.status === 'under_review' && (
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button onClick={(e) => { e.stopPropagation(); updateAlertStatus(alert.id, 'cleared') }} style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.1em', padding: '0.25rem 0.5rem', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', color: '#4ade80', cursor: 'pointer', textTransform: 'uppercase' }}>
                          Clear
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); updateAlertStatus(alert.id, 'escalated') }} style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.1em', padding: '0.25rem 0.5rem', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#fc8181', cursor: 'pointer', textTransform: 'uppercase' }}>
                          Escalate
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pattern Engine + Risk Claims */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="crm-card">
            <div className="section-eyebrow" style={{ marginBottom: '0.8rem' }}>Detection Pattern Weights</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {FRAUD_PATTERNS.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ flex: 1, fontSize: '0.72rem', fontFamily: 'Barlow', color: '#8fa3b8', lineHeight: 1.3 }}>{p.pattern}</div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: '0.75rem', color: p.weight >= 35 ? '#fc8181' : '#fbbf24' }}>+{p.weight}</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', color: '#4a6080' }}>{p.triggered} triggered</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="crm-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid rgba(201,147,58,0.1)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.2rem' }}>Claims · Fraud Risk Status</div>
            </div>
            <table className="crm-table">
              <thead><tr><th>Claim</th><th>Risk</th><th>Loss</th></tr></thead>
              <tbody>
                {displayClaims.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: '#c9933a' }}>{c.claim_number}</div>
                      <div style={{ fontFamily: 'Barlow', fontSize: '0.72rem', color: '#8fa3b8' }}>{c.clients?.company_name || `${c.clients?.first_name} ${c.clients?.last_name}`}</div>
                    </td>
                    <td>{riskBadge(c.fraud_risk)}</td>
                    <td style={{ fontFamily: 'Barlow Condensed', color: '#f5f0e8' }}>{formatCurrency(c.reported_loss, c.currency, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alert Detail Panel */}
      {selected && (
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px', background: '#111827', borderLeft: '1px solid rgba(201,147,58,0.2)', zIndex: 100, overflowY: 'auto', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Fraud Alert Detail</div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', color: '#fff', margin: 0 }}>{selected.alert_type}</h3>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#8fa3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)' }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fc8181', marginBottom: '0.4rem' }}>Fraud Risk Score</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', fontWeight: 900, color: '#c0392b' }}>{selected.risk_score}</div>
              <div style={{ height: 6, background: 'rgba(46,64,96,0.5)', borderRadius: 3, marginTop: '0.5rem' }}>
                <div style={{ height: '100%', width: `${selected.risk_score}%`, background: '#c0392b', borderRadius: 3 }} />
              </div>
            </div>

            <div className="crm-card" style={{ padding: '1rem' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.6rem' }}>Claim</div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.9rem', color: '#c9933a' }}>{selected.claims?.claim_number}</div>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.8rem', color: '#8fa3b8', marginTop: '0.2rem' }}>
                {formatCurrency(selected.claims?.reported_loss || 0, selected.claims?.currency || 'USD', true)} · {selected.claims?.coverage_type}
              </div>
            </div>

            <div className="crm-card" style={{ padding: '1rem' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.6rem' }}>Client</div>
              <div style={{ fontFamily: 'Barlow', fontSize: '0.88rem', color: '#f5f0e8' }}>
                {selected.clients?.company_name || `${selected.clients?.first_name} ${selected.clients?.last_name}`}
              </div>
              <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: '#8fa3b8', marginTop: '0.2rem' }}>{selected.clients?.email}</div>
            </div>

            <div className="crm-card" style={{ padding: '1rem' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.6rem' }}>Triggered Flags</div>
              {(selected.flags || selected.fraud_flags || []).map((flag: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#c0392b', fontSize: '0.7rem', marginTop: '0.15rem', flexShrink: 0 }}>⚠</span>
                  <span style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: '#fc8181', lineHeight: 1.4 }}>{flag}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selected.status !== 'escalated' && (
                <button onClick={() => updateAlertStatus(selected.id, 'escalated')} style={{ fontFamily: 'Barlow Condensed', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.8rem', background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.4)', color: '#fc8181', cursor: 'pointer', fontSize: '0.78rem' }}>
                  Escalate to SIU
                </button>
              )}
              {selected.status !== 'cleared' && (
                <button onClick={() => updateAlertStatus(selected.id, 'cleared')} style={{ fontFamily: 'Barlow Condensed', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.8rem', background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', color: '#4ade80', cursor: 'pointer', fontSize: '0.78rem' }}>
                  Mark as Cleared
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
