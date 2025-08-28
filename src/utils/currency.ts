// Currency utilities for consistent formatting across the application

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
};

export const DEFAULT_CURRENCY = 'USD';

export const formatCurrency = (
  amount: number | string,
  currencyCode: string = DEFAULT_CURRENCY,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    locale?: string;
  } = {}
): string => {
  const {
    showSymbol = true,
    showCode = false,
    locale = 'en-US'
  } = options;

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return showSymbol ? `${CURRENCY_CONFIGS[currencyCode]?.symbol || ''}0.00` : '0.00';
  }

  const config = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS[DEFAULT_CURRENCY];
  
  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(numericAmount);

    if (!showSymbol && showCode) {
      return `${numericAmount.toFixed(config.decimals)} ${config.code}`;
    } else if (!showSymbol && !showCode) {
      return numericAmount.toFixed(config.decimals);
    } else if (showSymbol && showCode) {
      return `${formatted} ${config.code}`;
    }
    
    return formatted;
  } catch (error) {
    // Fallback formatting
    const symbol = showSymbol ? config.symbol : '';
    const code = showCode ? ` ${config.code}` : '';
    return `${symbol}${numericAmount.toFixed(config.decimals)}${code}`;
  }
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_CONFIGS[currencyCode]?.symbol || CURRENCY_CONFIGS[DEFAULT_CURRENCY].symbol;
};

export const isSupportedCurrency = (currencyCode: string): boolean => {
  return currencyCode in CURRENCY_CONFIGS;
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  // This would integrate with a real currency conversion API
  // For now, return the amount as-is for same currency or USD rates
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Mock conversion rates - in production, use real API
  const mockRates: Record<string, number> = {
    'EUR_USD': 1.1,
    'USD_EUR': 0.91,
    'GBP_USD': 1.27,
    'USD_GBP': 0.79,
    'JPY_USD': 0.0067,
    'USD_JPY': 149.5,
  };
  
  const rateKey = `${fromCurrency}_${toCurrency}`;
  const rate = mockRates[rateKey] || 1;
  
  return amount * rate;
};

export const validateCurrencyAmount = (amount: string | number): boolean => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numericAmount) && numericAmount >= 0;
};