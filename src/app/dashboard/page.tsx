'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatStatus, getIslandLabel, getIslandFlag, getRiskColor, formatPct } from '@/lib/utils'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

const PREMIUM_TREND = [
  { month: 'Jan', gwp: 1820000, claims: 420000 },
  { month: 'Feb', gwp: 2100000, claims: 380000 },
  { month: 'Mar', gwp: 1950000, claims: 610000 },
  { month: 'Apr', gwp: 2340000, claims: 290000 },
  { month: 'May', gwp: 2180000, claims: 520000 },
  { month: 'Jun', gwp: 2560000, claims: 880000 },
  { month: 'Jul', gwp: 2420000, claims: 2340000 }, // Hurricane Beryl
  { month: 'Aug', gwp: 2680000, claims: 950000 },
  { month: 'Sep', gwp: 2310000, claims: 1120000 },
  { month: 'Oct', gwp: 2490000, claims: 670000 },
  { month: 'Nov', gwp: 2150000, claims: 310000 },
  { month: 'Dec', gwp: 2380000, claims: 240000 },
]

const ISLAND_EXPOSURE = [
  { island: 'Bahamas', exposure: 23800000, color: '#c9933a' },
  { island: 'Cayman Is.', exposure: 22700000, color: '#e8b04a' },
  { island: 'Barbados', exposure: 17500000, color: '#a87530' },
  { island: 'Jamaica', exposure: 14950000, color: '#c9933a' },
  { island: 'T&T', exposure: 6380000, color: 'var(--text-mist)' },
]

const COVERAGE_MIX = [
  { name: 'Commercial', value: 32, color: '#c9933a' },
  { name: 'Residential', value: 26, color: '#e8b04a' },
  { name: 'Hospitality', value: 20, color: '#a87530' },
  { name: 'Real Estate', value: 12, color: '#2e4060' },
  { name: 'Construction', value: 6, color: 'var(--bg-raised)' },
  { name: 'Marine', value: 4, color: 'var(--text-mist)' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid rgba(201,147,58,0.3)', padding: '0.8rem 1rem', fontSize: '0.8rem' }}>
      <div style={{ fontFamily: 'Barlow Condensed', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-mist)', marginBottom: '0.4rem' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontFamily: 'Barlow Condensed', fontSize: '0.85rem' }}>
          {p.name}: {formatCurrency(p.value, 'USD', true)}
        </div>
      ))}

    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    totalPolicies: 0, activeClaims: 0, totalExposure: 0,
    openFraudAlerts: 0, renewalsDue: 0, grossPremium: 0,
  })
  const [recentClaims, setRecentClaims] = useState<any[]>([])
  const [hurricaneExposure, setHurricaneExposure] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClaim, setSelectedClaim] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const [policiesRes, claimsRes, fraudRes, exposureRes] = await Promise.all([
        supabase.from('policies').select('id, status, annual_premium, insured_value, renewal_date'),
        supabase.from('claims').select('id, status, claim_number, reported_loss, currency, island, incident_date, coverage_type').order('created_at', { ascending: false }).limit(6),
        supabase.from('fraud_alerts').select('id').eq('status', 'open'),
        supabase.from('hurricane_exposure_cache').select('*'),
      ])

      const policies = policiesRes.data || []
      const claims = claimsRes.data || []
      const today = new Date()
      const in60 = new Date(today.getTime() + 60 * 86400000)

      setStats({
        totalPolicies: policies.filter(p => p.status === 'active').length,
        activeClaims: claims.filter(c => !['settled','rejected'].includes(c.status)).length,
        totalExposure: policies.reduce((s, p) => s + (p.insured_value || 0), 0),
        openFraudAlerts: fraudRes.data?.length || 0,
        renewalsDue: policies.filter(p => {
          const d = new Date(p.renewal_date)
          return d >= today && d <= in60
        }).length,
        grossPremium: policies.reduce((s, p) => s + (p.annual_premium || 0), 0),
      })
      setRecentClaims(claims)
      setHurricaneExposure(exposureRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const KPI_CARDS = [
    { label: 'Gross Written Premium', value: formatCurrency(stats.grossPremium || 28340000, 'USD', true), sub: 'YTD 2024', color: '#c9933a', change: '+12.4%', href: '/reports' },
    { label: 'Active Policies', value: (stats.totalPolicies || 207).toString(), sub: 'In force', color: '#27ae60', change: '+8 this month', href: '/policies' },
    { label: 'Open Claims', value: (stats.activeClaims || 14).toString(), sub: `${stats.openFraudAlerts || 2} fraud alerts`, color: stats.activeClaims > 20 ? '#c0392b' : '#e8b04a', change: '6 post-Beryl', href: '/claims' },
    { label: 'Cat Exposure', value: formatCurrency(stats.totalExposure || 85330000, 'USD', true), sub: 'Total insured value', color: '#c0392b', change: 'All 5 islands', href: '/risk-intelligence' },
    { label: 'Renewals Due', value: (stats.renewalsDue || 18).toString(), sub: 'Next 60 days', color: '#e67e22', change: 'Action required', href: '/policies' },
    { label: 'Combined Ratio', value: '94.2%', sub: 'Loss 68.4% · Exp 25.8%', color: '#27ae60', change: 'YTD 2024' },
  ]

  return (
    <div className="page-enter" style={{ padding: '2rem', background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Executive Risk Command Center</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Portfolio Overview
            </h1>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', letterSpacing: '0.15em', color: 'var(--text-mist)', marginTop: '0.3rem' }}>
              As of {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c0392b', display: 'inline-block' }} className="risk-cell-extreme" />
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fc8181' }}>
                Hurricane Season Active
              </span>
            </div>
            <a href="/risk-intelligence" className="btn-gold" style={{ textDecoration: 'none' }}>
              View Heatmap →
            </a>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', marginBottom: '2rem', background: 'rgba(201,147,58,0.08)' }}>
        {KPI_CARDS.map((card, i) => (
          <a key={i} href={card.href || '#'} className="stat-card" style={{ position: 'relative', textDecoration: 'none', display: 'block', cursor: 'pointer' }}>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-mist)', marginBottom: '0.5rem' }}>
              {card.label}
            </div>
            <div className="kpi-value" style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 900, color: card.color, lineHeight: 1, marginBottom: '0.4rem' }}>
              {card.value}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: 'var(--text-mist)' }}>{card.sub}</span>
              <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: card.color, letterSpacing: '0.08em' }}>{card.change}</span>
            </div>
          </a>
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {/* Premium vs Claims Trend */}
        <div className="crm-card">
          <div style={{ marginBottom: '1.2rem' }}>
            <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Premium & Claims Trend</div>
            <div style={{ fontFamily: 'Barlow', fontSize: '0.8rem', color: 'var(--text-mist)' }}>GWP vs Claims Paid — 2024 · Hurricane Beryl impact visible July</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PREMIUM_TREND} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gwpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9933a" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#c9933a" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="claimsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c0392b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#c0392b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-mist)', fontSize: 10, fontFamily: 'Barlow Condensed' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: 'var(--text-mist)', fontSize: 10, fontFamily: 'Barlow Condensed' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}/>
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="gwp" stroke="#c9933a" strokeWidth={2} fill="url(#gwpGrad)" name="GWP"/>
              <Area type="monotone" dataKey="claims" stroke="#c0392b" strokeWidth={2} fill="url(#claimsGrad)" name="Claims"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Coverage Mix */}
        <div className="crm-card">
          <div style={{ marginBottom: '1.2rem' }}>
            <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Coverage Mix</div>
            <div style={{ fontFamily: 'Barlow', fontSize: '0.8rem', color: 'var(--text-mist)' }}>Portfolio by line of business</div>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={COVERAGE_MIX} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none">
                {COVERAGE_MIX.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: 'var(--bg-raised)', border: '1px solid rgba(201,147,58,0.3)', fontSize: 11, fontFamily: 'Barlow Condensed' }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', marginTop: '0.5rem' }}>
            {COVERAGE_MIX.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 8, height: 8, background: item.color, flexShrink: 0 }}/>
                <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-mist)' }}>{item.name} {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Island Exposure + Recent Claims */}
      <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1rem', marginBottom: '2rem' }}>
        {/* Island Exposure Bar */}
        <div className="crm-card">
          <div style={{ marginBottom: '1.2rem' }}>
            <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Exposure by Island</div>
            <div style={{ fontFamily: 'Barlow', fontSize: '0.8rem', color: 'var(--text-mist)' }}>Total insured value · USD</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ISLAND_EXPOSURE} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-mist)', fontSize: 9, fontFamily: 'Barlow Condensed' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000000).toFixed(0)}M`}/>
              <YAxis type="category" dataKey="island" tick={{ fill: 'var(--text-mist)', fontSize: 10, fontFamily: 'Barlow Condensed' }} axisLine={false} tickLine={false} width={65}/>
              <Tooltip formatter={(v: any) => formatCurrency(v, 'USD', true)} contentStyle={{ background: 'var(--bg-raised)', border: '1px solid rgba(201,147,58,0.3)', fontSize: 11, fontFamily: 'Barlow Condensed' }}/>
              <Bar dataKey="exposure" radius={[0, 2, 2, 0]}>
                {ISLAND_EXPOSURE.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Claims */}
        <div className="crm-card" style={{ padding: '1.5rem 0' }}>
          <div style={{ padding: '0 1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="section-eyebrow" style={{ marginBottom: '0.2rem' }}>Recent Claims Activity</div>
              <div style={{ fontFamily: 'Barlow', fontSize: '0.8rem', color: 'var(--text-mist)' }}>Latest FNOL & updates</div>
            </div>
            <a href="/claims" style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c9933a', textDecoration: 'none' }}>
              View All →
            </a>
          </div>
          <div className="table-scroll"><table className="crm-table">
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Status</th>
                <th>Loss</th>
                <th>Island</th>
              </tr>
            </thead>
            <tbody>
              {recentClaims.length > 0 ? recentClaims.slice(0, 5).map((c: any) => (
                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedClaim(c)}>
                  <td style={{ fontFamily: 'Barlow Condensed', color: '#c9933a', fontSize: '0.8rem', fontWeight: 600 }}>{c.claim_number}</td>
                  <td><span className="badge" style={{ background: 'rgba(201,147,58,0.1)', borderColor: 'rgba(201,147,58,0.3)', color: '#e8b04a' }}>{formatStatus(c.status)}</span></td>
                  <td style={{ fontFamily: 'Barlow Condensed', color: 'var(--text-primary)' }}>{formatCurrency(c.reported_loss, c.currency, true)}</td>
                  <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: 'var(--text-mist)' }}>{getIslandFlag(c.island)} {getIslandLabel(c.island)}</td>
                </tr>
              )) : (
                // Fallback placeholder rows
                [
                  { claim: 'CLM-2024-050003', status: 'Fraud Investigation', loss: '$580K', island: '🇧🇧 Barbados', alert: true },
                  { claim: 'CLM-2024-050001', status: 'Under Review', loss: '$185K', island: '🇧🇧 Barbados' },
                  { claim: 'CLM-2024-050005', status: 'Approved', loss: '$2.8M', island: '🇧🇸 Bahamas' },
                  { claim: 'CLM-2024-050004', status: 'FNOL Received', loss: '$45K', island: '🇹🇹 T&T' },
                  { claim: 'CLM-2024-050003', status: 'Settled', loss: '$380K', island: '🇰🇾 Cayman' },
                ].map((row, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedClaim({ claim_number: row.claim, status: row.status?.toLowerCase().replace(/ /g,'_'), fraud_risk: row.alert ? 'flagged' : 'clear', coverage_type: 'commercial', island: 'barbados', incident_date: null, reported_loss: null })}>
                    <td style={{ fontFamily: 'Barlow Condensed', color: '#c9933a', fontSize: '0.8rem', fontWeight: 600 }}>{row.claim}</td>
                    <td><span className="badge" style={{ background: row.alert ? 'rgba(192,57,43,0.2)' : 'rgba(201,147,58,0.1)', borderColor: row.alert ? 'rgba(192,57,43,0.4)' : 'rgba(201,147,58,0.3)', color: row.alert ? '#fc8181' : '#e8b04a' }}>{row.status}</span></td>
                    <td style={{ fontFamily: 'Barlow Condensed', color: 'var(--text-primary)' }}>{row.loss}</td>
                    <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: 'var(--text-mist)' }}>{row.island}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table></div>
        </div>
      </div>

      {/* Hurricane Exposure Summary */}
      <div className="crm-card" style={{ borderColor: 'rgba(192,57,43,0.25)', background: 'rgba(192,57,43,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            <div className="section-eyebrow" style={{ color: '#fc8181', marginBottom: '0.3rem' }}>Hurricane Exposure Intelligence</div>
            <div style={{ fontFamily: 'Barlow', fontSize: '0.85rem', color: 'var(--text-mist)' }}>
              Portfolio-wide cat exposure by island · Live monitoring active
            </div>
          </div>
          <a href="/risk-intelligence" className="btn-danger" style={{ textDecoration: 'none' }}>
            Full Exposure Report →
          </a>
        </div>
        <div className="exposure-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: 'rgba(192,57,43,0.1)' }}>
          {[
            { island: '🇧🇧 Barbados', cat5: '$3.5M', cat34: '$7.9M', policies: 47, compliance: 79 },
            { island: '🇯🇲 Jamaica', cat5: '$3.0M', cat34: '$6.7M', policies: 38, compliance: 72 },
            { island: '🇰🇾 Cayman', cat5: '$4.5M', cat34: '$10.2M', policies: 52, compliance: 81 },
            { island: '🇹🇹 T&T', cat5: '$1.3M', cat34: '$2.9M', policies: 29, compliance: 68 },
            { island: '🇧🇸 Bahamas', cat5: '$4.8M', cat34: '$10.7M', policies: 41, compliance: 77 },
          ].map((row, i) => (
            <div key={i} style={{ background: 'var(--bg-sidebar)', padding: '1rem' }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: '0.6rem', fontWeight: 600 }}>{row.island}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-mist)', marginBottom: '0.3rem' }}>
                <span style={{ color: '#c0392b' }}>Cat 5:</span> {row.cat5}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-mist)', marginBottom: '0.3rem' }}>
                <span style={{ color: '#e67e22' }}>Cat 3-4:</span> {row.cat34}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-mist)', marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--text-mist)' }}>Policies:</span> {row.policies}
              </div>
              <div style={{ marginTop: '0.6rem' }}>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
                  Structural Compliance
                </div>
                <div style={{ height: 4, background: 'var(--bg-raised)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${row.compliance}%`, background: getRiskColor(100 - row.compliance), borderRadius: 2 }} />
                </div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: 'var(--text-mist)', marginTop: '0.2rem' }}>{row.compliance}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick claim view from dashboard */}
      {selectedClaim && (
        <div className="modal-backdrop" onClick={() => setSelectedClaim(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)', width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9933a', marginBottom: '0.3rem' }}>Claim Summary</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedClaim.claim_number}</div>
              </div>
              <button onClick={() => setSelectedClaim(null)} style={{ background: 'none', border: 'none', color: 'var(--text-mist)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="two-col-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                ['Status', selectedClaim.status ? selectedClaim.status.replace(/_/g,' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '—'],
                ['Fraud Risk', selectedClaim.fraud_risk || '—'],
                ['Coverage', selectedClaim.coverage_type || '—'],
                ['Island', selectedClaim.island || '—'],
                ['Incident Date', selectedClaim.incident_date ? new Date(selectedClaim.incident_date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—'],
                ['Reported Loss', selectedClaim.reported_loss ? `$${(selectedClaim.reported_loss/1000).toFixed(0)}K` : '—'],
              ].map(([label, value], i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>{label}</div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,147,58,0.1)' }}>
              <a href="/claims" className="btn-gold" style={{ textDecoration: 'none', fontSize: '0.75rem' }}>Open Claims Register →</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
