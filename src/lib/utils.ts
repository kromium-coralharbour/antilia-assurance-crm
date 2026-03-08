import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Currency, Island, RiskLevel, ISLAND_LABELS } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── CURRENCY ───────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$', BBD: 'BDS$', JMD: 'J$', KYD: 'CI$',
  TTD: 'TT$', BSD: 'B$', GBP: '£', EUR: '€',
}

export function formatCurrency(amount: number, currency: Currency = 'USD', compact = false): string {
  if (compact) {
    if (amount >= 1_000_000) return `${CURRENCY_SYMBOLS[currency]}${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `${CURRENCY_SYMBOLS[currency]}${(amount / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/^/, CURRENCY_SYMBOLS[currency])
}

export function convertToUSD(amount: number, fromCurrency: Currency, rates: Record<string, number>): number {
  if (fromCurrency === 'USD') return amount
  const key = `${fromCurrency}_USD`
  const rate = rates[key] || 1
  return amount * rate
}

// ── RISK ───────────────────────────────────────────────────────────

export function getRiskColor(score: number): string {
  if (score >= 80) return '#c0392b'
  if (score >= 65) return '#e67e22'
  if (score >= 45) return '#f1c40f'
  if (score >= 25) return '#27ae60'
  return '#2e4060'
}

export function getRiskLabel(score: number): RiskLevel {
  if (score >= 80) return 'extreme'
  if (score >= 65) return 'high'
  if (score >= 45) return 'moderate'
  if (score >= 25) return 'low'
  return 'minimal'
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  extreme: '#c0392b',
  high: '#e67e22',
  moderate: '#f1c40f',
  low: '#27ae60',
  minimal: '#2e4060',
}

export const RISK_BG: Record<RiskLevel, string> = {
  extreme: 'bg-red-900/30 text-red-400 border-red-800',
  high: 'bg-orange-900/30 text-orange-400 border-orange-800',
  moderate: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  low: 'bg-green-900/30 text-green-400 border-green-800',
  minimal: 'bg-slate-800/50 text-slate-400 border-slate-700',
}

// ── STATUS BADGES ──────────────────────────────────────────────────

export const POLICY_STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-900/30 text-green-400 border-green-800',
  pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  renewal_due: 'bg-orange-900/30 text-orange-400 border-orange-800',
  lapsed: 'bg-red-900/30 text-red-400 border-red-800',
  cancelled: 'bg-slate-800/50 text-slate-500 border-slate-700',
  quoted: 'bg-blue-900/30 text-blue-400 border-blue-800',
}

export const CLAIM_STATUS_STYLES: Record<string, string> = {
  fnol_received: 'bg-blue-900/30 text-blue-400 border-blue-800',
  under_review: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  adjuster_assigned: 'bg-purple-900/30 text-purple-400 border-purple-800',
  inspection_scheduled: 'bg-indigo-900/30 text-indigo-400 border-indigo-800',
  assessment_complete: 'bg-teal-900/30 text-teal-400 border-teal-800',
  approved: 'bg-green-900/30 text-green-400 border-green-800',
  partial_approved: 'bg-lime-900/30 text-lime-400 border-lime-800',
  settled: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
  rejected: 'bg-red-900/30 text-red-400 border-red-800',
  fraud_investigation: 'bg-red-950/50 text-red-300 border-red-700 animate-pulse',
}

export const FRAUD_RISK_STYLES: Record<string, string> = {
  clear: 'bg-green-900/30 text-green-400 border-green-800',
  watch: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  suspicious: 'bg-orange-900/30 text-orange-400 border-orange-800',
  flagged: 'bg-red-900/30 text-red-400 border-red-800',
  confirmed_fraud: 'bg-red-950/60 text-red-300 border-red-700',
}

// ── LABELS ─────────────────────────────────────────────────────────

export function formatStatus(status: string): string {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function getIslandLabel(island: Island): string {
  return ISLAND_LABELS[island] || island
}

export function getIslandFlag(island: Island): string {
  const flags: Record<Island, string> = {
    barbados: '🇧🇧',
    jamaica: '🇯🇲',
    cayman_islands: '🇰🇾',
    trinidad_tobago: '🇹🇹',
    bahamas: '🇧🇸',
  }
  return flags[island] || '🏝️'
}

// ── DATE ───────────────────────────────────────────────────────────

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function isRenewalSoon(renewalDate: string): boolean {
  return daysUntil(renewalDate) <= 60
}

// ── NUMBERS ────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}
