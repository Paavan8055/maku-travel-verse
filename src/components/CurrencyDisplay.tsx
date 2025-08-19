import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, Globe, ChevronDown } from "lucide-react";
import { useCurrency } from "@/features/currency/CurrencyProvider";

const CURRENCY_OPTIONS = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", flag: "🇳🇿" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
];

interface CurrencyDisplayProps {
  variant?: "compact" | "full";
  showSelector?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ 
  variant = "compact", 
  showSelector = true 
}) => {
  const { selectedCurrency, setSelectedCurrency, formatCurrency } = useCurrency();
  const [open, setOpen] = React.useState(false);

  const currentCurrency = CURRENCY_OPTIONS.find(c => c.code === selectedCurrency) || CURRENCY_OPTIONS[0];

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-background/50 text-foreground border-border/50">
          <Globe className="h-3 w-3 mr-1" />
          Prices in {selectedCurrency}
        </Badge>
        
        {showSelector && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                {currentCurrency.flag} {currentCurrency.symbol}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="space-y-1">
                <p className="text-sm font-medium px-2 py-1">Select Currency</p>
                {CURRENCY_OPTIONS.map((currency) => (
                  <Button
                    key={currency.code}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => {
                      setSelectedCurrency(currency.code);
                      setOpen(false);
                    }}
                  >
                    <span className="mr-2">{currency.flag}</span>
                    <span className="mr-2">{currency.symbol}</span>
                    <span className="flex-1 text-left">{currency.name}</span>
                    {currency.code === selectedCurrency && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  return (
    <Card className="border-border/50 bg-background/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span className="font-medium">Currency</span>
          </div>
          <Badge variant="secondary">{selectedCurrency}</Badge>
        </div>
        
        <div className="text-sm text-muted-foreground mb-3">
          All prices are displayed in {currentCurrency.name} ({currentCurrency.symbol}) 
          and converted from the original booking currency using live exchange rates.
        </div>

        {showSelector && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                {currentCurrency.flag} {currentCurrency.name} ({currentCurrency.symbol})
                <ChevronDown className="h-4 w-4 ml-auto" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-1">
                <p className="text-sm font-medium px-2 py-1">Select Currency</p>
                {CURRENCY_OPTIONS.map((currency) => (
                  <Button
                    key={currency.code}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => {
                      setSelectedCurrency(currency.code);
                      setOpen(false);
                    }}
                  >
                    <span className="mr-2">{currency.flag}</span>
                    <span className="mr-2">{currency.symbol}</span>
                    <span className="flex-1 text-left">{currency.name}</span>
                    {currency.code === selectedCurrency && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          Example: {formatCurrency(1000)} • {formatCurrency(99)} • {formatCurrency(15)}
        </div>
      </CardContent>
    </Card>
  );
};