export type CurrencyCode = 'USD' | 'BBD' | 'GBP' | 'EUR' | 'CAD' | 'KYD' | 'TTD' | 'JMD' | 'JPY' | 'SEK'

export const CURRENCIES: Record<string, { symbol: string; name: string; rate: number }> = {
  USD: { symbol: '$',  name: 'US Dollar',          rate: 1     },
  BBD: { symbol: 'Bds$', name: 'Barbados Dollar',  rate: 2     },
  GBP: { symbol: '£',  name: 'British Pound',       rate: 0.79  },
  EUR: { symbol: '€',  name: 'Euro',                rate: 0.92  },
  CAD: { symbol: 'C$', name: 'Canadian Dollar',     rate: 1.36  },
  KYD: { symbol: 'KY$', name: 'Cayman Dollar',      rate: 0.83  },
  TTD: { symbol: 'TT$', name: 'Trinidad Dollar',    rate: 6.79  },
  JMD: { symbol: 'J$', name: 'Jamaican Dollar',     rate: 155   },
  JPY: { symbol: '¥',  name: 'Japanese Yen',        rate: 149   },
  SEK: { symbol: 'kr', name: 'Swedish Krona',       rate: 10.4  },
}
export function formatCurrency(amount: number, currency: string = 'USD') {
  const c = CURRENCIES[currency] || CURRENCIES.USD
  return `${c.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
