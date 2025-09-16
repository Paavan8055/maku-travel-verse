import { useCallback } from 'react';

interface CurrencyFormatter {
  formatPrice: (amount: number, currency: string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

export const useCurrency = (): CurrencyFormatter => {
  const formatPrice = useCallback((amount: number, currency: string = 'AUD'): string => {
    try {
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback for invalid currency codes
      return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
    }
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string = 'AUD'): string => {
    return formatPrice(amount, currency);
  }, [formatPrice]);

  return {
    formatPrice,
    formatCurrency,
  };
};