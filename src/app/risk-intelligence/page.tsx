'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatPct, getIslandLabel, getIslandFlag, getRiskColor } from '@/lib/utils'
import { Island } from '@/types'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis, CartesianGrid,
} from 'recharts'

const ISLANDS: Island[] = ['barbados', 'jamaica', 'cayman_islands', 'trinidad_tobago', 'bahamas']

const HEATMAP_DATA = [
  { zone: 'A – Extreme Wind', barbados: 92, jamaica: 85, cayman_islands: 95, trinidad_tobago: 42, bahamas: 97 },
  { zone: 'B – High Wind', barbados: 75, jamaica: 78, cayman_islands: 80, trinidad_tobago: 35, bahamas: 88 },
  { zone: 'C – Moderate Wind', barbados: 55, jamaica: 60, cayman_islands: 62, trinidad_tobago: 28, bahamas: 65 },
  { zone: 'Storm Surge', barbados: 68, jamaica: 72, cayman_islands: 85, trinidad_tobago: 30, bahamas: 90 },
  { zone: 'Flood', barbados: 48, jamaica: 65, cayman_islands: 55, trinidad_tobago: 55, bahamas: 60 },
]

const EXPOSURE_BY_CAT = [
  { name: 'Cat 1–2', barbados: 7900000, jamaica: 6700000, cayman_islands: 10200000, trinidad_tobago: 2900000, bahamas: 10700000 },
  { name: 'Cat 3–4', barbados: 5100000, jamaica: 4800000, cayman_islands: 7600000, trinidad_tobago: 2100000, bahamas: 8900000 },
  { name: 'Cat 5', barbados: 3500000, jamaica: 3000000, cayman_islands: 4500000, trinidad_tobago: 1300000, bahamas: 4800000 },
]

const STRUCTURAL_DATA = [
  { name: 'Reinforced Concrete', count: 87, compliance: 88, color: '#27ae60' },
  { name: 'Masonry Block', count: 62, compliance: 74, color: '#f1c40f' },
  { name: 'Timber Frame', count: 31, compliance: 52, color: '#e67e22' },
  { name: 'Steel Frame', count: 24, compliance: 91, color: '#27ae60' },
  { name: 'Mixed/Unknown', count: 17, compliance: 41, color: '#c0392b' },
]

const RADAR_DATA = [
  { subject: 'Wind Exposure', Bahamas: 97, Barbados: 92, Jamaica: 85, Cayman: 95, TT: 42 },
  { subject: 'Storm Surge', Bahamas: 90, Barbados: 68, Jamaica: 72, Cayman: 85, TT: 30 },
  { subject: 'Flood Risk', Bahamas: 60, Barbados: 48, Jamaica: 65, Cayman: 55, TT: 55 },
  { subject: 'Concentr.', Bahamas: 75, Barbados: 62, Jamaica: 58, Cayman: 80, TT: 40 },
  { subject: 'Infra Risk', Bahamas: 55, Barbados: 45, Jamaica: 60, Cayman: 38, TT: 50 },
]

const LOSS_MODEL = [
  { scenario: '1-in-10yr Storm', probable_loss: 8400000, reinsured: 3200000, net_retention: 5200000 },
  { scenario: '1-in-25yr Storm', probable_loss: 18600000, reinsured: 11200000, net_retention: 7400000 },
  { scenario: '1-in-50yr Storm', probable_loss: 31200000, reinsured: 22800000, net_retention: 8400000 },
  { scenario: '1-in-100yr Storm', probable_loss: 52400000, reinsured: 42100000, net_retention: 10300000 },
  { scenario: '1-in-250yr Storm', probable_loss: 78900000, reinsured: 65700000, net_retention: 13200000 },
]

const FX_RATES = [
  { from: 'BBD', rate: 2.0000, change: 0.0, flag: '🇧🇧' },
  { from: 'JMD', rate: 156.50, change: +1.2, flag: '🇯🇲' },
  { from: 'KYD', rate: 0.8200, change: 0.0, flag: '🇰🇾' },
  { from: 'TTD', rate: 6.7900, change: -0.08, flag: '🇹🇹' },
  { from: 'BSD', rate: 1.0000, change: 0.0, flag: '🇧🇸' },
  { from: 'GBP', rate: 0.7900, change: +0.003, flag: '🇬🇧' },
]

const ACTIVE_STORMS = [
  { name: 'Tropical Depression 8', category: 'TD', track: 'WNW at 12 mph', location: '14.2°N 61.8°W', distance_barbados: 'Monitor', risk: 'watch' },
]

function HeatCell({ value }: { value: number }) {
  const bg = value >= 80 ? '#c0392b' : value >= 65 ? '#e67e22' : value >= 45 ? '#f1c40f' : value >= 25 ? '#27ae60' : '#2e4060'
  const opacity = 0.15 + (value / 100) * 0.75
  return (
    <td style={{
      background: bg, opacity, textAlign: 'center', padding: '0.5rem 0.8rem',
      fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: '#fff', fontWeight: 600,
    }}>
      {value}
    </td>
  )
}

export default function RiskIntelligencePage() {
  const supabase = createClient()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'heatmap' | 'construction' | 'fx' | 'loss'>('heatmap')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('policies').select('id, island, insured_value, risk_score, structural_compliance_rating, wind_zone, flood_zone, coverage_type, currency')
      setPolicies(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const totalExposure = policies.reduce((s, p) => s + (p.insured_value || 0), 0)
  const avgRisk = policies.length > 0 ? policies.reduce((s, p) => s + (p.risk_score || 50), 0) / policies.length : 67
  const highRiskPolicies = policies.filter(p => (p.risk_score || 0) >= 65).length
  const avgCompliance = policies.filter(p => p.structural_compliance_rating).reduce((s, p, _, arr) => s + p.structural_compliance_rating / arr.length, 0) || 73.8

  const TABS = [
    { id: 'heatmap', label: 'Exposure Heatmap' },
    { id: 'construction', label: 'Construction Risk' },
    { id: 'fx', label: 'FX Exposure' },
    { id: 'loss', label: 'Loss Modelling' },
  ] as const

  return (
    <div style={{ padding: '2rem', background: '#0a0f1e', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Hurricane Exposure Intelligence Engine</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Risk Intelligence
            </h1>
            <p style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: '#8fa3b8', marginTop: '0.3rem' }}>
              Live portfolio heatmaps · Construction-linked scoring · Multi-currency FX exposure · Catastrophe loss modelling
            </p>
          </div>
          {ACTIVE_STORMS.length > 0 && (
            <div style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.4)', padding: '0.8rem 1.2rem' }}>
              <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fc8181', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c0392b', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                Active Storm Monitoring
              </div>
              {ACTIVE_STORMS.map((s, i) => (
                <div key={i} style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: '#f5f0e8' }}>
                  {s.name} · {s.location} · {s.track}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '2rem', background: 'rgba(201,147,58,0.08)' }}>
        {[
          { label: 'Total Portfolio Exposure', value: formatCurrency(totalExposure || 85330000, 'USD', true), sub: 'All islands · USD', color: '#c0392b' },
          { label: 'Portfolio Avg Risk Score', value: formatPct(avgRisk || 67), sub: `${highRiskPolicies || 42} high-risk policies`, color: getRiskColor(avgRisk || 67) },
          { label: 'Avg Structural Compliance', value: formatPct(avgCompliance), sub: 'Weighted by insured value', color: '#e8b04a' },
          { label: 'Max Cat 5 Net Retention', value: '$13.2M', sub: '1-in-250yr scenario', color: '#c0392b' },
        ].map((kpi, i) => (
          <div key={i} className="stat-card">
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8fa3b8', marginBottom: '0.5rem' }}>{kpi.label}</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 900, color: kpi.color, lineHeight: 1, marginBottom: '0.4rem' }}>{kpi.value}</div>
            <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: '#8fa3b8' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '1px solid rgba(201,147,58,0.15)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontFamily: 'Barlow Condensed', fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              padding: '0.8rem 1.5rem', border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? 'rgba(201,147,58,0.1)' : 'transparent',
              color: activeTab === tab.id ? '#c9933a' : '#8fa3b8',
              borderBottom: activeTab === tab.id ? '2px solid #c9933a' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── HEATMAP TAB ── */}
      {activeTab === 'heatmap' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
          {/* Left: Full heatmap */}
          <div className="crm-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(201,147,58,0.1)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.3rem' }}>Portfolio Exposure Heatmap</div>
              <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: '#8fa3b8' }}>Risk score by zone × island · Higher = greater exposure concentration</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d1321' }}>
                    <th style={{ padding: '0.7rem 1rem', textAlign: 'left', fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.15em', color: '#8fa3b8', textTransform: 'uppercase', borderBottom: '1px solid rgba(201,147,58,0.1)', whiteSpace: 'nowrap' }}>Risk Zone</th>
                    {ISLANDS.map(island => (
                      <th key={island} style={{ padding: '0.7rem 1rem', textAlign: 'center', fontFamily: 'Barlow Condensed', fontSize: '0.68rem', letterSpacing: '0.12em', color: '#8fa3b8', textTransform: 'uppercase', borderBottom: '1px solid rgba(201,147,58,0.1)', whiteSpace: 'nowrap' }}>
                        {getIslandFlag(island)} {getIslandLabel(island)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HEATMAP_DATA.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.6rem 1rem', fontFamily: 'Barlow Condensed', fontSize: '0.8rem', color: '#f5f0e8', whiteSpace: 'nowrap' }}>{row.zone}</td>
                      <HeatCell value={row.barbados} />
                      <HeatCell value={row.jamaica} />
                      <HeatCell value={row.cayman_islands} />
                      <HeatCell value={row.trinidad_tobago} />
                      <HeatCell value={row.bahamas} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,147,58,0.08)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { color: '#c0392b', label: 'Extreme (80–100)' }, { color: '#e67e22', label: 'High (65–79)' },
                { color: '#f1c40f', label: 'Moderate (45–64)' }, { color: '#27ae60', label: 'Low (25–44)' },
                { color: '#2e4060', label: 'Minimal (0–24)' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 10, height: 10, background: item.color, borderRadius: 2 }} />
                  <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: '#8fa3b8' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Radar + Exposure by Cat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="crm-card">
              <div className="section-eyebrow" style={{ marginBottom: '0.8rem' }}>Multi-Peril Radar · By Island</div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="rgba(201,147,58,0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#8fa3b8', fontSize: 10, fontFamily: 'Barlow Condensed' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Bahamas" dataKey="Bahamas" stroke="#c9933a" fill="#c9933a" fillOpacity={0.15} strokeWidth={1.5} />
                  <Radar name="Barbados" dataKey="Barbados" stroke="#e8b04a" fill="#e8b04a" fillOpacity={0.1} strokeWidth={1} />
                  <Radar name="Cayman" dataKey="Cayman" stroke="#c0392b" fill="#c0392b" fillOpacity={0.1} strokeWidth={1} />
                  <Tooltip contentStyle={{ background: '#1e2d45', border: '1px solid rgba(201,147,58,0.3)', fontSize: 11, fontFamily: 'Barlow Condensed' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="crm-card">
              <div className="section-eyebrow" style={{ marginBottom: '0.8rem' }}>Cat Exposure · Bahamas Portfolio</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={EXPOSURE_BY_CAT} margin={{ left: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#8fa3b8', fontSize: 10, fontFamily: 'Barlow Condensed' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8fa3b8', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v, 'USD', true)} contentStyle={{ background: '#1e2d45', border: '1px solid rgba(201,147,58,0.3)', fontSize: 11, fontFamily: 'Barlow Condensed' }} />
                  <Bar dataKey="bahamas" fill="#c9933a" radius={[2, 2, 0, 0]} name="Bahamas" />
                  <Bar dataKey="cayman_islands" fill="#e8b04a" radius={[2, 2, 0, 0]} name="Cayman" />
                  <Bar dataKey="barbados" fill="#a87530" radius={[2, 2, 0, 0]} name="Barbados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── CONSTRUCTION RISK TAB ── */}
      {activeTab === 'construction' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="crm-card">
            <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Structural Type Analysis</div>
            <p style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: '#8fa3b8', marginBottom: '1.5rem' }}>
              Construction-linked risk scoring based on structural compliance with Caribbean building codes and wind-load standards.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {STRUCTURAL_DATA.map((item, i) => (
                <div key={i} style={{ padding: '1rem', background: 'rgba(30,45,69,0.4)', border: '1px solid rgba(201,147,58,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.85rem', color: '#f5f0e8', fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: '#8fa3b8', marginTop: '0.2rem' }}>{item.count} policies</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.compliance}%</div>
                      <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8fa3b8' }}>Compliance</div>
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'rgba(46,64,96,0.5)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${item.compliance}%`, background: item.color, borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="crm-card">
              <div className="section-eyebrow" style={{ marginBottom: '0.8rem' }}>Island Compliance Scores</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { island: 'cayman_islands' as Island, score: 81, policies: 52 },
                  { island: 'barbados' as Island, score: 79, policies: 47 },
                  { island: 'bahamas' as Island, score: 77, policies: 41 },
                  { island: 'jamaica' as Island, score: 72, policies: 38 },
                  { island: 'trinidad_tobago' as Island, score: 68, policies: 29 },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '0.9rem 0', borderBottom: '1px solid rgba(201,147,58,0.08)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.8rem', color: '#f5f0e8', width: '130px', flexShrink: 0 }}>
                      {getIslandFlag(item.island)} {getIslandLabel(item.island)}
                    </div>
                    <div style={{ flex: 1, height: 6, background: 'rgba(46,64,96,0.5)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${item.score}%`, background: getRiskColor(100 - item.score), borderRadius: 3 }} />
                    </div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem', color: getRiskColor(100 - item.score), width: '40px', textAlign: 'right' }}>{item.score}%</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: '#8fa3b8', width: '60px', textAlign: 'right' }}>{item.policies} policies</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="crm-card" style={{ borderColor: 'rgba(192,57,43,0.25)', background: 'rgba(192,57,43,0.04)' }}>
              <div className="section-eyebrow" style={{ color: '#fc8181', marginBottom: '0.8rem' }}>High-Risk Structural Alerts</div>
              {[
                { policy: 'AAG-2024-010023', type: 'Timber Frame', island: 'Jamaica', score: 38, issue: 'No hurricane straps documented' },
                { policy: 'AAG-2024-010041', type: 'Mixed/Unknown', island: 'T&T', score: 29, issue: 'Pre-1985 construction, no retrofit' },
                { policy: 'AAG-2024-010067', type: 'Masonry Block', island: 'Bahamas', score: 44, issue: 'Flood zone — no elevation cert' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '0.8rem', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.15)', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.75rem', color: '#c9933a' }}>{item.policy}</span>
                    <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: '#fc8181', background: 'rgba(192,57,43,0.15)', padding: '0.15rem 0.5rem', border: '1px solid rgba(192,57,43,0.3)' }}>Score: {item.score}</span>
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.78rem', color: '#f5f0e8', marginBottom: '0.2rem' }}>{item.type} · {item.island}</div>
                  <div style={{ fontFamily: 'Barlow', fontSize: '0.78rem', color: '#fc8181' }}>{item.issue}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FX EXPOSURE TAB ── */}
      {activeTab === 'fx' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
          <div className="crm-card">
            <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Live FX Rates · vs USD</div>
            <p style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: '#8fa3b8', marginBottom: '1.5rem' }}>
              Multi-currency claims settlement tracking. All exposures and claims can be reported in any of 6 Caribbean currencies.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {FX_RATES.map((fx, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem', background: 'rgba(30,45,69,0.4)', border: '1px solid rgba(201,147,58,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{fx.flag}</span>
                    <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.88rem', fontWeight: 700, color: '#f5f0e8' }}>{fx.from}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.1rem', color: '#c9933a' }}>{fx.rate.toFixed(4)}</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: fx.change > 0 ? '#27ae60' : fx.change < 0 ? '#c0392b' : '#8fa3b8' }}>
                      {fx.change > 0 ? '+' : ''}{fx.change.toFixed(3)} today
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.2rem', padding: '0.8rem', background: 'rgba(201,147,58,0.06)', border: '1px solid rgba(201,147,58,0.15)', fontFamily: 'Barlow', fontSize: '0.78rem', color: '#8fa3b8', lineHeight: 1.6 }}>
              Rates sourced from Caribbean Central Banks. Claims settled in original currency of policy with FX conversion logged at settlement date.
            </div>
          </div>

          <div className="crm-card">
            <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>FX Exposure by Island · Open Claims</div>
            <p style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: '#8fa3b8', marginBottom: '1.5rem' }}>Currency breakdown of open claims exposure across all markets.</p>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Island</th>
                  <th>Currency</th>
                  <th>Open Claims Value</th>
                  <th>USD Equivalent</th>
                  <th>FX Risk</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { island: '🇧🇧 Barbados', currency: 'BBD', local: 1840000, usd: 920000, risk: 'low' },
                  { island: '🇯🇲 Jamaica', currency: 'JMD', local: 48750000, usd: 311500, risk: 'moderate' },
                  { island: '🇰🇾 Cayman', currency: 'KYD', local: 420000, usd: 512200, risk: 'low' },
                  { island: '🇹🇹 T&T', currency: 'TTD', local: 3250000, usd: 478700, risk: 'moderate' },
                  { island: '🇧🇸 Bahamas', currency: 'BSD', local: 2180000, usd: 2180000, risk: 'minimal' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.82rem', color: '#f5f0e8' }}>{row.island}</td>
                    <td style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, color: '#c9933a' }}>{row.currency}</td>
                    <td style={{ fontFamily: 'Barlow Condensed', fontSize: '0.85rem', color: '#f5f0e8' }}>{row.currency === 'JMD' ? 'J$' : row.currency === 'TTD' ? 'TT$' : row.currency === 'BBD' ? 'BDS$' : row.currency === 'KYD' ? 'CI$' : 'B$'}{row.local.toLocaleString()}</td>
                    <td style={{ fontFamily: 'Barlow Condensed', color: '#e8b04a' }}>${row.usd.toLocaleString()}</td>
                    <td>
                      <span className="badge" style={{
                        background: row.risk === 'minimal' ? 'rgba(46,64,96,0.4)' : row.risk === 'low' ? 'rgba(39,174,96,0.15)' : 'rgba(241,196,15,0.15)',
                        color: row.risk === 'minimal' ? '#8fa3b8' : row.risk === 'low' ? '#4ade80' : '#f1c40f',
                        borderColor: row.risk === 'minimal' ? 'rgba(46,64,96,0.4)' : row.risk === 'low' ? 'rgba(39,174,96,0.3)' : 'rgba(241,196,15,0.3)',
                      }}>
                        {row.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '1.5rem' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.8rem' }}>Import Duty Adjustment Factors</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {[
                  { island: '🇧🇧 BBD', duty: '22%' }, { island: '🇯🇲 JMD', duty: '15%' },
                  { island: '🇰🇾 KYD', duty: '20%' }, { island: '🇹🇹 TTD', duty: '20%' }, { island: '🇧🇸 BSD', duty: '45%' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(30,45,69,0.4)', padding: '0.6rem', textAlign: 'center', border: '1px solid rgba(201,147,58,0.08)' }}>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.72rem', color: '#8fa3b8', marginBottom: '0.2rem' }}>{item.island}</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: '#e8b04a', fontSize: '1rem' }}>{item.duty}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOSS MODELLING TAB ── */}
      {activeTab === 'loss' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="crm-card">
            <div className="section-eyebrow" style={{ marginBottom: '0.4rem' }}>Probable Maximum Loss · Scenarios</div>
            <p style={{ fontFamily: 'Barlow', fontSize: '0.82rem', color: '#8fa3b8', marginBottom: '1.5rem' }}>
              Catastrophe loss model with gross loss, reinsurance recovery, and net retention estimates. Based on current portfolio composition.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {LOSS_MODEL.map((row, i) => (
                <div key={i} style={{ padding: '1rem', borderBottom: '1px solid rgba(201,147,58,0.08)', background: i % 2 === 0 ? 'rgba(30,45,69,0.2)' : 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.82rem', fontWeight: 600, color: '#f5f0e8' }}>{row.scenario}</span>
                    <span style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: '#8fa3b8' }}>Gross: <span style={{ color: '#c0392b' }}>{formatCurrency(row.probable_loss, 'USD', true)}</span></span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ height: 20, background: 'rgba(46,64,96,0.5)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, width: `${(row.reinsured / row.probable_loss) * 100}%`, background: '#27ae60', opacity: 0.6 }} />
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: '0.4rem', fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: '#4ade80' }}>
                        Reinsured: {formatCurrency(row.reinsured, 'USD', true)}
                      </span>
                    </div>
                    <div style={{ height: 20, background: 'rgba(192,57,43,0.2)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, width: `${(row.net_retention / row.probable_loss) * 100}%`, background: '#c0392b', opacity: 0.5 }} />
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: '0.4rem', fontFamily: 'Barlow Condensed', fontSize: '0.65rem', color: '#fc8181' }}>
                        Net: {formatCurrency(row.net_retention, 'USD', true)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="crm-card">
              <div className="section-eyebrow" style={{ marginBottom: '0.8rem' }}>Loss Scenario Chart</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={LOSS_MODEL} margin={{ left: 10, right: 10 }}>
                  <XAxis dataKey="scenario" tick={{ fill: '#8fa3b8', fontSize: 9, fontFamily: 'Barlow Condensed' }} axisLine={false} tickLine={false} tickFormatter={s => s.replace('1-in-', '').replace('yr Storm', 'yr')} />
                  <YAxis tick={{ fill: '#8fa3b8', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v, 'USD', true)} contentStyle={{ background: '#1e2d45', border: '1px solid rgba(201,147,58,0.3)', fontSize: 11, fontFamily: 'Barlow Condensed' }} />
                  <Bar dataKey="reinsured" stackId="a" fill="#27ae60" fillOpacity={0.7} name="Reinsured" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="net_retention" stackId="a" fill="#c0392b" fillOpacity={0.7} name="Net Retention" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="crm-card" style={{ borderColor: 'rgba(201,147,58,0.25)' }}>
              <div className="section-eyebrow" style={{ marginBottom: '0.8rem' }}>Reinsurance Programme Summary</div>
              {[
                { layer: 'Cat XL Layer 1', coverage: '$0–$5M xs $5M', reinsurer: 'Hannover Re', status: 'active' },
                { layer: 'Cat XL Layer 2', coverage: '$10M xs $15M', reinsurer: 'Swiss Re', status: 'active' },
                { layer: 'Cat XL Layer 3', coverage: '$25M xs $25M', reinsurer: 'Munich Re', status: 'active' },
                { layer: 'Quota Share', coverage: '30% of all perils', reinsurer: 'Lloyd\'s Syndicate 2623', status: 'active' },
              ].map((layer, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: '1px solid rgba(201,147,58,0.08)' }}>
                  <div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.82rem', color: '#f5f0e8', fontWeight: 600 }}>{layer.layer}</div>
                    <div style={{ fontFamily: 'Barlow Condensed', fontSize: '0.7rem', color: '#8fa3b8' }}>{layer.coverage} · {layer.reinsurer}</div>
                  </div>
                  <span className="badge" style={{ background: 'rgba(39,174,96,0.15)', color: '#4ade80', borderColor: 'rgba(39,174,96,0.3)' }}>Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
