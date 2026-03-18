'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Toast, useToast } from '@/components/Toast'
import { formatCurrency, formatDate, formatPct, getIslandLabel, getIslandFlag } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, PieChart, Pie,
} from 'recharts'

const SOLVENCY_DATA = [
  { quarter: 'Q1 23', ratio: 228, min: 150 }, { quarter: 'Q2 23', ratio: 234, min: 150 },
  { quarter: 'Q3 23', ratio: 219, min: 150 }, { quarter: 'Q4 23', ratio: 241, min: 150 },
  { quarter: 'Q1 24', ratio: 252, min: 150 }, { quarter: 'Q2 24', ratio: 245, min: 150 },
  { quarter: 'Q3 24', ratio: 238, min: 150 }, { quarter: 'Q4 24', ratio: 256, min: 150 },
]

const LOSS_RATIO_TREND = [
  { month: 'Jan', loss: 23.1, expense: 25.8 }, { month: 'Feb', loss: 18.1, expense: 24.9 },
  { month: 'Mar', loss: 31.3, expense: 26.1 }, { month: 'Apr', loss: 12.4, expense: 25.4 },
  { month: 'May', loss: 23.9, expense: 26.8 }, { month: 'Jun', loss: 34.4, expense: 26.2 },
  { month: 'Jul', loss: 96.7, expense: 27.1 }, { month: 'Aug', loss: 35.4, expense: 26.5 },
  { month: 'Sep', loss: 48.5, expense: 27.0 }, { month: 'Oct', loss: 26.9, expense: 25.8 },
  { month: 'Nov', loss: 14.4, expense: 24.5 }, { month: 'Dec', loss: 10.1, expense: 24.2 },
]

const PREMIUM_BY_ISLAND = [
  { island: '🇧🇸 Bahamas', gwp: 9800000, claims: 3200000, color: '#c9933a' },
  { island: '🇰🇾 Cayman', gwp: 8400000, claims: 2100000, color: 'var(--text-amber)' },
  { island: '🇧🇧 Barbados', gwp: 6200000, claims: 2800000, color: '#a87530' },
  { island: '🇯🇲 Jamaica', gwp: 4900000, claims: 1900000, color: '#c9933a' },
  { island: '🇹🇹 T&T', gwp: 2600000, claims: 890000, color: 'var(--text-mist)' },
]

const REGULATORY_ITEMS = [
  { jurisdiction: 'Barbados', regulator: 'Financial Services Commission', filing: 'Q3 2024 Quarterly Return', due: '2024-11-15', status: 'submitted' },
  { jurisdiction: 'Jamaica', regulator: 'Financial Services Commission JA', filing: 'Q3 2024 Solvency Report', due: '2024-11-30', status: 'submitted' },
  { jurisdiction: 'Cayman Islands', regulator: 'CIMA', filing: 'Cat Exposure Report', due: '2024-12-01', status: 'in_progress' },
  { jurisdiction: 'Trinidad & Tobago', regulator: 'Central Bank of T&T', filing: 'Q3 2024 Insurance Return', due: '2024-11-30', status: 'submitted' },
  { jurisdiction: 'Bahamas', regulator: 'Insurance Commission of Bahamas', filing: 'Hurricane Season Report', due: '2024-12-15', status: 'pending' },
  { jurisdiction: 'All Markets', regulator: 'Internal', filing: 'Annual Reinsurance Programme Review', due: '2025-01-31', status: 'pending' },
]

const REPORTS_AVAILABLE = [
  { name: 'Portfolio Exposure Summary', description: 'Total insured values, coverage breakdown, island distribution', category: 'Underwriting', period: 'YTD 2024' },
  { name: 'Claims Experience Report', description: 'FNOL, settlements, open reserves, loss ratios by coverage type', category: 'Claims', period: 'YTD 2024' },
  { name: 'Broker Commission Statement', description: 'YTD commission by broker, premium volume, client count', category: 'Distribution', period: 'Q3 2024' },
  { name: 'Reinsurance Cession Report', description: 'Premium ceded, losses recovered, net retention by treaty', category: 'Reinsurance', period: 'YTD 2024' },
  { name: 'Hurricane Season Exposure Report', description: 'Cat 1–5 exposure by island, structural compliance, wind zones', category: 'Risk Intelligence', period: 'Season 2024' },
  { name: 'Solvency & Capital Report', description: 'SCR coverage, capital adequacy, minimum margin compliance', category: 'Regulatory', period: 'Q3 2024' },
  { name: 'Fraud Detection Summary', description: 'Alert volume, risk scores, SIU referrals, confirmed fraud exposure', category: 'Fraud', period: 'YTD 2024' },
  { name: 'Multi-Currency FX Exposure', description: 'Open claims by currency, FX rates, import duty factors', category: 'Finance', period: 'Current' },
]

export default function ReportsPage() {
  const supabase = createClient()
  const [policies, setPolicies] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [brokers, setBrokers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast, show: showToast, hide: hideToast } = useToast()
  const [activeTab, setActiveTab] = useState<'executive' | 'regulatory' | 'reports'>('executive')
  const [generating, setGenerating] = useState<string | null>(null)
  const [selectedFiling, setSelectedFiling] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const [polRes, claimRes, brokerRes] = await Promise.all([
        supabase.from('policies').select('id, status, annual_premium, insured_value, island, coverage_type, start_date'),
        supabase.from('claims').select('id, status, reported_loss, settlement_amount, currency, island, coverage_type, incident_date'),
        supabase.from('brokers').select('id, name, company, ytd_premium_volume, ytd_commission_earned'),
      ])
      setPolicies(polRes.data || [])
      setClaims(claimRes.data || [])
      setBrokers(brokerRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const totalGWP = policies.reduce((s, p) => s + (p.annual_premium || 0), 0) || 31900000
  const totalExposure = policies.reduce((s, p) => s + (p.insured_value || 0), 0) || 85330000
  const totalClaimsLoss = claims.reduce((s, c) => s + (c.reported_loss || 0), 0) || 12840000
  const lossRatio = totalGWP > 0 ? (totalClaimsLoss / totalGWP) * 100 : 40.2
  const combinedRatio = lossRatio + 25.8

  async function handleGenerate(name: string) {
    setGenerating(name)
    try {
      let rows: string[][] = []
      let filename = ''

      if (name === 'Portfolio Exposure Summary') {
        filename = 'portfolio-exposure.csv'
        rows = [['Policy #', 'Coverage Type', 'Island', 'Status', 'Insured Value', 'Annual Premium', 'Currency']]
        policies.forEach(p => rows.push([p.policy_number || '', p.coverage_type || '', p.island || '', p.status || '', String(p.insured_value || 0), String(p.annual_premium || 0), p.currency || 'USD']))
      } else if (name === 'Claims Experience Report') {
        filename = 'claims-experience.csv'
        rows = [['Claim #', 'Status', 'Island', 'Coverage Type', 'Reported Loss', 'Settlement', 'Currency', 'Incident Date']]
        claims.forEach(c => rows.push([c.claim_number || '', c.status || '', c.island || '', c.coverage_type || '', String(c.reported_loss || 0), String(c.settlement_amount || 0), c.currency || 'USD', c.incident_date || '']))
      } else if (name === 'Broker Commission Statement') {
        filename = 'broker-commissions.csv'
        rows = [['Broker', 'Company', 'YTD Premium Volume', 'Commission Earned', 'Commission Rate %', 'Policy Count']]
        brokers.forEach(b => rows.push([b.name || '', b.company || '', String(b.ytd_premium_volume || 0), String(b.ytd_commission_earned || 0), String(b.commission_rate || 0), String(b.policy_count || 0)]))
      } else if (name === 'Multi-Currency FX Exposure') {
        filename = 'fx-exposure.csv'
        rows = [['Coverage Type', 'Island', 'Status', 'Reported Loss', 'Currency', 'Incident Date']]
        claims.filter(c => c.status !== 'settled').forEach(c => rows.push([c.coverage_type || '', c.island || '', c.status || '', String(c.reported_loss || 0), c.currency || 'USD', c.incident_date || '']))
      } else {
        // Generic export with policy data
        filename = `${name.toLowerCase().replace(/\s+/g,'-')}.csv`
        rows = [['Policy #', 'Island', 'Status', 'Annual Premium', 'Insured Value']]
        policies.forEach(p => rows.push([p.policy_number || '', p.island || '', p.status || '', String(p.annual_premium || 0), String(p.insured_value || 0)]))
      }

      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGenerating(null)
    }
  }

  const TABS = [
    { id: 'executive', label: 'Executive Dashboard' },
    { id: 'regulatory', label: 'Regulatory Filings' },
    { id: 'reports', label: 'Available Reports' },
  ] as const

  return (
    <div className="page-enter" style={{ padding: '2rem', background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Regulatory & Compliance</div>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Reports & Compliance
        </h1>
        <p style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: 'var(--text-mist)', marginTop: '0.3rem' }}>
          Executive reporting · Regulatory filings across 5 jurisdictions · Portfolio analytics
        </p>
      </div>

      {/* KPIs */}
      <div className="five-col-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', marginBottom: '2rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Gross Written Premium', value: formatCurrency(totalGWP, 'USD', true), sub: 'YTD 2024', color: '#c9933a' },
          { label: 'Total Insured Value', value: formatCurrency(totalExposure, 'USD', true), sub: 'Portfolio', color: 'var(--text-amber)' },
          { label: 'Loss Ratio', value: formatPct(lossRatio), sub: 'Incl. Beryl', color: lossRatio > 80 ? '#c0392b' : lossRatio > 60 ? '#e67e22' : '#27ae60' },
          { label: 'Combined Ratio', value: formatPct(combinedRatio), sub: `Exp. 25.8%`, color: combinedRatio < 100 ? '#27ae60' : '#c0392b' },
          { label: 'Solvency Margin', value: '256%', sub: 'Min required: 150%', color: '#27ae60' },
        ].map((kpi, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-mist)', marginBottom: '0.5rem' }}>{kpi.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 900, color: kpi.color, lineHeight: 1, marginBottom: '0.4rem' }}>{kpi.value}</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: 'var(--text-mist)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.15)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            fontFamily: 'Barlow Condensed', fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase',
            padding: '0.8rem 1.5rem', border: 'none', cursor: 'pointer',
            background: activeTab === tab.id ? 'rgba(201,147,58,0.1)' : 'transparent',
            color: activeTab === tab.id ? '#c9933a' : 'var(--text-mist)',
            borderBottom: activeTab === tab.id ? '2px solid #c9933a' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── EXECUTIVE TAB ── */}
      {activeTab === 'executive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            {/* Solvency Trend */}
            <div className="crm-card">
              <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Solvency Capital Ratio · Quarterly</div>
              <p style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: 'var(--text-mist)', marginBottom: '1rem' }}>SCR vs minimum 150% regulatory requirement</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={SOLVENCY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,147,58,0.08)" />
                  <XAxis dataKey="quarter" tick={{ fill: 'var(--text-mist)', fontSize: 10, fontFamily: 'Barlow Condensed' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[100, 300]} tick={{ fill: 'var(--text-mist)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: 'var(--bg-raised)', border: '1px solid rgba(201,147,58,0.3)', fontSize: 11, fontFamily: 'Barlow Condensed' }} />
                  <Line type="monotone" dataKey="ratio" stroke="#c9933a" strokeWidth={2.5} dot={{ fill: '#c9933a', r: 3 }} name="SCR %" />
                  <Line type="monotone" dataKey="min" stroke="#c0392b" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Min 150%" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Loss Ratio by Month */}
            <div className="crm-card">
              <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Monthly Loss & Expense Ratio · 2024</div>
              <p style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: 'var(--text-mist)', marginBottom: '1rem' }}>Hurricane Beryl spike visible in July</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={LOSS_RATIO_TREND}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-mist)', fontSize: 10, fontFamily: 'Barlow Condensed' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-mist)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: 'var(--bg-raised)', border: '1px solid rgba(201,147,58,0.3)', fontSize: 11, fontFamily: 'Barlow Condensed' }} />
                  <Bar dataKey="loss" stackId="a" fill="#c0392b" fillOpacity={0.7} name="Loss Ratio" radius={[0,0,0,0]} />
                  <Bar dataKey="expense" stackId="a" fill="#2e4060" fillOpacity={0.8} name="Expense Ratio" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Premium vs Claims by Island */}
          <div className="crm-card">
            <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>GWP vs Claims by Island · YTD 2024</div>
            <p style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: 'var(--text-mist)', marginBottom: '1rem' }}>Gross written premium versus total claims incurred per market</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={PREMIUM_BY_ISLAND} margin={{ left: 20 }}>
                <XAxis dataKey="island" tick={{ fill: 'var(--text-mist)', fontSize: 10, fontFamily: 'Barlow Condensed' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-mist)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: any) => formatCurrency(v, 'USD', true)} contentStyle={{ background: 'var(--bg-raised)', border: '1px solid rgba(201,147,58,0.3)', fontSize: 11, fontFamily: 'Barlow Condensed' }} />
                <Bar dataKey="gwp" fill="#c9933a" fillOpacity={0.8} name="GWP" radius={[2, 2, 0, 0]} />
                <Bar dataKey="claims" fill="#c0392b" fillOpacity={0.6} name="Claims" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── REGULATORY TAB ── */}
      {activeTab === 'regulatory' && (
        <div>
          <div className="crm-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(201,147,58,0.1)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.2rem' }}>Regulatory Filing Calendar · 5 Jurisdictions</div>
              <p style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: 'var(--text-mist)', margin: 0 }}>Compliance obligations across all operating markets</p>
            </div>
            <div className="table-scroll"><table className="crm-table">
              <thead>
                <tr>
                  <th>Jurisdiction</th>
                  <th>Regulator</th>
                  <th>Filing</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {REGULATORY_ITEMS.map((item, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedFiling(item)}>
                    <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{item.jurisdiction}</td>
                    <td style={{ fontFamily: 'Barlow', fontSize: '0.8rem', color: 'var(--text-mist)' }}>{item.regulator}</td>
                    <td style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: 'var(--text-primary)' }}>{item.filing}</td>
                    <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.82rem', color: '#c9933a' }}>{formatDate(item.due)}</td>
                    <td>
                      <span className="badge" style={{
                        background: item.status === 'submitted' ? 'rgba(39,174,96,0.15)' : item.status === 'in_progress' ? 'rgba(241,196,15,0.15)' : 'rgba(201,147,58,0.1)',
                        color: item.status === 'submitted' ? '#4ade80' : item.status === 'in_progress' ? '#fbbf24' : '#c9933a',
                        borderColor: item.status === 'submitted' ? 'rgba(39,174,96,0.3)' : item.status === 'in_progress' ? 'rgba(241,196,15,0.3)' : 'rgba(201,147,58,0.3)',
                      }}>
                        {item.status === 'submitted' ? 'Submitted' : item.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>

          {/* Compliance summary */}
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { island: 'barbados' as const, regulator: 'FSC Barbados', status: 'Compliant', lastFiled: '2024-10-15', color: '#27ae60' },
              { island: 'jamaica' as const, regulator: 'FSC Jamaica', status: 'Compliant', lastFiled: '2024-10-22', color: '#27ae60' },
              { island: 'cayman_islands' as const, regulator: 'CIMA', status: 'In Progress', lastFiled: '2024-07-30', color: '#f1c40f' },
              { island: 'trinidad_tobago' as const, regulator: 'CBTT', status: 'Compliant', lastFiled: '2024-10-31', color: '#27ae60' },
              { island: 'bahamas' as const, regulator: 'ICB', status: 'Pending', lastFiled: '2024-07-15', color: '#e67e22' },
            ].map((item, i) => (
              <div key={i} className="crm-card" style={{ padding: '1.2rem', borderLeft: `3px solid ${item.color}` }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {getIslandFlag(item.island)} {getIslandLabel(item.island)}
                </div>
                <div style={{ fontFamily: 'Barlow', fontSize: '0.75rem', color: 'var(--text-mist)', marginBottom: '0.6rem' }}>{item.regulator}</div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: item.color }}>{item.status}</div>
                <div style={{ fontFamily: 'Barlow', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Last filed: {formatDate(item.lastFiled)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {activeTab === 'reports' && (
        <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {REPORTS_AVAILABLE.map((report, i) => (
            <div key={i} className="crm-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span className="badge" style={{ background: 'rgba(201,147,58,0.1)', color: '#c9933a', borderColor: 'rgba(201,147,58,0.2)' }}>{report.category}</span>
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>{report.period}</span>
                </div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{report.name}</div>
                <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: 'var(--text-mist)', lineHeight: 1.5 }}>{report.description}</div>
              </div>
              <button
                onClick={() => handleGenerate(report.name)}
                disabled={generating === report.name}
                style={{
                  flexShrink: 0,
                  fontFamily: 'Barlow Condensed', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '0.5rem 1rem', background: generating === report.name ? 'rgba(201,147,58,0.05)' : 'rgba(201,147,58,0.1)',
                  border: '1px solid rgba(201,147,58,0.3)', color: generating === report.name ? 'var(--text-mist)' : '#c9933a',
                  cursor: generating === report.name ? 'default' : 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {generating === report.name ? 'Generating…' : 'Export PDF'}
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Filing detail modal */}
      {selectedFiling && (
        <div className="modal-backdrop" onClick={() => setSelectedFiling(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 500, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '0.3rem' }}>Regulatory Filing</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedFiling.filing}</div>
              </div>
              <button onClick={() => setSelectedFiling(null)} style={{ background: 'none', border: 'none', color: 'var(--text-mist)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="two-col-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                ['Jurisdiction', selectedFiling.jurisdiction],
                ['Regulator', selectedFiling.regulator],
                ['Due Date', new Date(selectedFiling.due).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })],
                ['Status', selectedFiling.status.replace(/_/g,' ').replace(/\b\w/g, (c: string) => c.toUpperCase())],
              ].map(([l, v], i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>{l}</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{v}</div>
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.6rem' }}>Required Documents</div>
                {['Signed actuarial certification', 'Trial balance / financial statements', 'Claims run-off schedule', 'Reinsurance treaty schedule', 'Board resolution (if applicable)'].map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: selectedFiling.status === 'submitted' ? '#4ade80' : 'var(--text-dim)', fontSize: '0.75rem' }}>{selectedFiling.status === 'submitted' ? '✓' : '○'}</span>
                    <span style={{ fontFamily: 'Barlow', fontSize: '0.8rem', color: selectedFiling.status === 'submitted' ? 'var(--text-mist)' : 'var(--text-primary)' }}>{doc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,147,58,0.1)', display: 'flex', gap: '0.8rem' }}>
              <button onClick={() => { handleGenerate('Portfolio Exposure Summary'); setSelectedFiling(null) }} className="btn-gold" style={{ fontSize: '0.72rem' }}>Export Supporting Data →</button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={hideToast} />}
    </div>
  )
}
