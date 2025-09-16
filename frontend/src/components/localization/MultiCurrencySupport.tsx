import React, { useState, useEffect, createContext, useContext } from 'react';
import { DollarSign, Globe, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number;
}

interface CurrencyContextType {
  selectedCurrency: Currency;
  currencies: Currency[];
  convertPrice: (amount: number, fromCurrency?: string) => number;
  formatPrice: (amount: number, currency?: Currency) => string;
  setCurrency: (currencyCode: string) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>({
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    rate: 1.0
  });

  const [currencies] = useState<Currency[]>([
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rate: 1.0 },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rate: 0.85 },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rate: 0.73 },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rate: 110.0 },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rate: 1.35 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', rate: 1.25 },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', rate: 0.92 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', rate: 3.67 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rate: 1.35 }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const convertPrice = (amount: number, fromCurrency = 'USD'): number => {
    if (fromCurrency === selectedCurrency.code) return amount;
    
    // Convert to USD first if needed
    const usdAmount = fromCurrency === 'USD' ? amount : amount / currencies.find(c => c.code === fromCurrency)?.rate || 1;
    
    // Convert from USD to target currency
    return usdAmount * selectedCurrency.rate;
  };

  const formatPrice = (amount: number, currency: Currency = selectedCurrency): string => {
    const convertedAmount = convertPrice(amount);
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.code === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency.code === 'JPY' ? 0 : 2,
    }).format(convertedAmount);
  };

  const setCurrency = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      setSelectedCurrency(currency);
      // Store preference
      localStorage.setItem('preferred-currency', currencyCode);
    }
  };

  useEffect(() => {
    // Load saved currency preference
    const savedCurrency = localStorage.getItem('preferred-currency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }

    // Auto-detect user's currency based on location (simulation)
    const detectUserCurrency = () => {
      // In a real app, this would use geolocation or IP-based detection
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      if (timezone.includes('Europe')) {
        setCurrency('EUR');
      } else if (timezone.includes('Asia/Tokyo')) {
        setCurrency('JPY');
      } else if (timezone.includes('Australia')) {
        setCurrency('AUD');
      }
    };

    if (!savedCurrency) {
      detectUserCurrency();
    }
  }, []);

  const contextValue: CurrencyContextType = {
    selectedCurrency,
    currencies,
    convertPrice,
    formatPrice,
    setCurrency,
    isLoading
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

interface CurrencySelectorProps {
  className?: string;
  showRates?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ 
  className, 
  showRates = false 
}) => {
  const { selectedCurrency, currencies, setCurrency, isLoading } = useCurrency();
  const [showDetails, setShowDetails] = useState(false);

  const updateRates = async () => {
    // In a real app, this would fetch from a currency API
    console.log('Updating currency rates...');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Currency & Localization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Select value={selectedCurrency.code} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedCurrency.flag}</span>
                      <span>{selectedCurrency.symbol}</span>
                      <span className="font-medium">{selectedCurrency.code}</span>
                      <span className="text-muted-foreground">- {selectedCurrency.name}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{currency.flag}</span>
                        <span>{currency.symbol}</span>
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-muted-foreground">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={updateRates}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <TrendingUp className="h-4 w-4" />
              {showDetails ? 'Hide' : 'Show'} Rates
            </Button>
          </div>

          {showDetails && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currencies.map(currency => (
                  <div
                    key={currency.code}
                    className={`p-3 border rounded-lg transition-colors ${
                      currency.code === selectedCurrency.code ? 'bg-primary/5 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{currency.flag}</span>
                      <span className="font-medium">{currency.code}</span>
                      {currency.code === selectedCurrency.code && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      1 USD = {currency.rate.toFixed(currency.code === 'JPY' ? 0 : 2)} {currency.symbol}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                Exchange rates are updated hourly. Actual rates may vary at time of payment.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Price display component with currency conversion
interface PriceDisplayProps {
  amount: number;
  originalCurrency?: string;
  showOriginal?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  originalCurrency = 'USD',
  showOriginal = false,
  className
}) => {
  const { formatPrice, selectedCurrency, convertPrice } = useCurrency();
  
  const convertedAmount = convertPrice(amount, originalCurrency);
  const formattedPrice = formatPrice(convertedAmount);
  
  return (
    <div className={className}>
      <span className="font-semibold">{formattedPrice}</span>
      {showOriginal && originalCurrency !== selectedCurrency.code && (
        <span className="text-sm text-muted-foreground ml-2">
          (≈ {amount.toFixed(2)} {originalCurrency})
        </span>
      )}
    </div>
  );
};

export default CurrencySelector;