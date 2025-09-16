import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PriceComponent {
  label: string;
  amount: number;
  currency: string;
  description?: string;
  required?: boolean;
  type?: 'base' | 'tax' | 'fee' | 'surcharge' | 'discount';
}

interface PriceBreakdownProps {
  components: PriceComponent[];
  totalAmount: number;
  currency: string;
  bookingType: 'flight' | 'hotel' | 'activity';
  supplierInfo?: {
    name: string;
    contact?: string;
    terms?: string;
  };
  fareRules?: {
    refundable: boolean;
    changeable: boolean;
    restrictions: string[];
  };
  isSampleData?: boolean;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  components,
  totalAmount,
  currency,
  bookingType,
  supplierInfo,
  fareRules,
  isSampleData = false
}) => {
  const formatAmount = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr
    }).format(amount);
  };

  const getTypeColor = (type: PriceComponent['type']) => {
    switch (type) {
      case 'discount': return 'text-green-600';
      case 'tax': return 'text-orange-600';
      case 'fee': return 'text-blue-600';
      case 'surcharge': return 'text-red-600';
      default: return 'text-foreground';
    }
  };

  const getTypeIcon = (type: PriceComponent['type']) => {
    switch (type) {
      case 'tax': return '📋';
      case 'fee': return '💼';
      case 'surcharge': return '⚡';
      case 'discount': return '🎉';
      default: return '📊';
    }
  };

  const baseComponents = components.filter(c => c.type === 'base' || !c.type);
  const taxComponents = components.filter(c => c.type === 'tax');
  const feeComponents = components.filter(c => c.type === 'fee' || c.type === 'surcharge');
  const discountComponents = components.filter(c => c.type === 'discount');

  return (
    <div className="space-y-4">
      {isSampleData && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            This is sample pricing data for demonstration purposes only. Actual prices may vary.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Price Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Base Price */}
          {baseComponents.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                Base Price
              </h4>
              {baseComponents.map((component, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getTypeIcon(component.type)}</span>
                    <div>
                      <span className="text-foreground">{component.label}</span>
                      {component.description && (
                        <p className="text-xs text-muted-foreground">{component.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`font-medium ${getTypeColor(component.type)}`}>
                    {formatAmount(component.amount, component.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Taxes */}
          {taxComponents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                  Taxes & Government Fees
                </h4>
                {taxComponents.map((component, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getTypeIcon(component.type)}</span>
                      <div>
                        <span className="text-foreground">{component.label}</span>
                        {component.required && (
                          <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                        )}
                        {component.description && (
                          <p className="text-xs text-muted-foreground">{component.description}</p>
                        )}
                      </div>
                    </div>
                    <span className={`font-medium ${getTypeColor(component.type)}`}>
                      {formatAmount(component.amount, component.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Service Fees */}
          {feeComponents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                  Service Fees
                </h4>
                {feeComponents.map((component, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getTypeIcon(component.type)}</span>
                      <div>
                        <span className="text-foreground">{component.label}</span>
                        {component.description && (
                          <p className="text-xs text-muted-foreground">{component.description}</p>
                        )}
                      </div>
                    </div>
                    <span className={`font-medium ${getTypeColor(component.type)}`}>
                      {formatAmount(component.amount, component.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Discounts */}
          {discountComponents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                  Discounts & Savings
                </h4>
                {discountComponents.map((component, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getTypeIcon(component.type)}</span>
                      <div>
                        <span className="text-foreground">{component.label}</span>
                        {component.description && (
                          <p className="text-xs text-muted-foreground">{component.description}</p>
                        )}
                      </div>
                    </div>
                    <span className={`font-medium ${getTypeColor(component.type)}`}>
                      -{formatAmount(Math.abs(component.amount), component.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Total */}
          <Separator className="my-4" />
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Amount</span>
            <span className="text-primary">{formatAmount(totalAmount, currency)}</span>
          </div>

          {/* IATA Compliance Notice */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">IATA Compliance</p>
                <p>All prices include mandatory taxes and fees. Optional services are clearly marked.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fare Rules */}
      {fareRules && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={fareRules.refundable ? "default" : "destructive"}>
                  {fareRules.refundable ? "✓ Refundable" : "✗ Non-refundable"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={fareRules.changeable ? "default" : "destructive"}>
                  {fareRules.changeable ? "✓ Changeable" : "✗ Non-changeable"}
                </Badge>
              </div>
            </div>
            
            {fareRules.restrictions.length > 0 && (
              <div>
                <h5 className="font-medium text-sm mb-2">Restrictions:</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {fareRules.restrictions.map((restriction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      {restriction}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Supplier Information */}
      {supplierInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Supplier: </span>
              <span className="text-muted-foreground">{supplierInfo.name}</span>
            </div>
            {supplierInfo.contact && (
              <div>
                <span className="font-medium">Contact: </span>
                <span className="text-muted-foreground">{supplierInfo.contact}</span>
              </div>
            )}
            {supplierInfo.terms && (
              <div className="text-xs text-muted-foreground">
                <a href={supplierInfo.terms} target="_blank" rel="noopener noreferrer" 
                   className="text-primary hover:underline">
                  View supplier terms and conditions
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};