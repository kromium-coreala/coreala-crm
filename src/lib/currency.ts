export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', rate: 1 },
  BBD: { symbol: 'Bds$', name: 'Barbadian Dollar', rate: 2.0 },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.79 },
  EUR: { symbol: '€', name: 'Euro', rate: 0.92 },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar', rate: 1.36 },
  KYD: { symbol: 'CI$', name: 'Cayman Dollar', rate: 0.82 },
  TTD: { symbol: 'TT$', name: 'Trinidad Dollar', rate: 6.79 },
  JMD: { symbol: 'J$', name: 'Jamaican Dollar', rate: 156.0 },
}

export type CurrencyCode = keyof typeof CURRENCIES

export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  const usd = amount / CURRENCIES[from].rate
  return Math.round(usd * CURRENCIES[to].rate * 100) / 100
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'USD'): string {
  const { symbol } = CURRENCIES[currency]
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
