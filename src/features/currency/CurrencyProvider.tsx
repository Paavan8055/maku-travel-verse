import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Rates = Record<string, number>;

interface CurrencyContextValue {
  selectedCurrency: string;
  setSelectedCurrency: (c: string) => void;
  rates: Rates;
  convert: (amount: number, fromCurrency?: string, toCurrencyOverride?: string) => number;
  formatCurrency: (amount: number, currencyOverride?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const REGION_TO_CURRENCY: Record<string, string> = {
  US: "USD",
  AU: "AUD",
  GB: "GBP",
  IE: "EUR",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  PT: "EUR",
  AT: "EUR",
  BE: "EUR",
  FI: "EUR",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  CA: "CAD",
  NZ: "NZD",
  SG: "SGD",
  IN: "INR",
  JP: "JPY",
  AE: "AED",
};

function detectCurrency(): string {
  try {
    const locale = navigator.language || (Intl.DateTimeFormat().resolvedOptions().locale ?? "en-US");
    const region = (locale.split("-")[1] || "US").toUpperCase();
    return REGION_TO_CURRENCY[region] || "USD";
  } catch {
    return "USD";
  }
}

export const CurrencyProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(detectCurrency());
  const [rates, setRates] = useState<Rates>({ USD: 1 });

  useEffect(() => {
    let mounted = true;
    // Public free rates API (no key). Base USD for simpler conversion logic
    fetch("https://api.exchangerate.host/latest?base=USD")
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        if (j && j.rates) {
          setRates({ USD: 1, ...j.rates });
        }
      })
      .catch(() => {/* ignore and keep defaults */});
    return () => { mounted = false; };
  }, []);

  const convert = useMemo(() => {
    return (amount: number, fromCurrency: string = "USD", toCurrencyOverride?: string) => {
      if (!amount || !isFinite(amount)) return 0;
      const toCurrency = toCurrencyOverride || selectedCurrency;
      const from = fromCurrency.toUpperCase();
      const to = (toCurrency || "USD").toUpperCase();
      const fromRate = rates[from] ?? 1; // USD base
      const toRate = rates[to] ?? 1;
      // Convert to USD, then to target
      const amountInUSD = from === "USD" ? amount : amount / (fromRate || 1);
      const converted = to === "USD" ? amountInUSD : amountInUSD * (toRate || 1);
      // Round to 0 decimals for consistent display (can be refined per currency)
      return Math.round(converted);
    };
  }, [rates, selectedCurrency]);

  const formatCurrency = useMemo(() => {
    return (amount: number, currencyOverride?: string) => {
      const ccy = (currencyOverride || selectedCurrency || "USD").toUpperCase();
      try {
        return new Intl.NumberFormat(undefined, { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(amount);
      } catch {
        // Fallback
        return `${ccy} ${amount.toLocaleString()}`;
      }
    };
  }, [selectedCurrency]);

  const value: CurrencyContextValue = {
    selectedCurrency,
    setSelectedCurrency,
    rates,
    convert,
    formatCurrency,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};
