import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  Plane,
  Luggage,
  Users
} from 'lucide-react';

interface FareRule {
  category: string;
  text: string;
  important?: boolean;
}

interface FareRulesDisplayProps {
  fareRules: {
    refundable: boolean;
    changeable: boolean;
    exchangeable: boolean;
    fareFamily: string;
    validityPeriod: string;
    advancePurchase?: string;
    minimumStay?: string;
    maximumStay?: string;
    restrictions: string[];
    rules: FareRule[];
  };
  bookingClass: string;
  airline: string;
  isSampleData?: boolean;
}

export const FareRulesDisplay: React.FC<FareRulesDisplayProps> = ({
  fareRules,
  bookingClass,
  airline,
  isSampleData = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRulesByCategory = (category: string) => {
    return fareRules.rules.filter(rule => rule.category === category);
  };

  const formatRule = (text: string) => {
    // Replace common abbreviations with full text
    return text
      .replace(/CHG/g, 'Change')
      .replace(/REF/g, 'Refund')
      .replace(/PEN/g, 'Penalty')
      .replace(/APP/g, 'Applies')
      .replace(/NO-SHOW/g, 'No-Show');
  };

  const ruleCategories = [
    { key: 'cancellation', title: 'Cancellation & Refunds', icon: CreditCard },
    { key: 'changes', title: 'Date & Time Changes', icon: Clock },
    { key: 'routing', title: 'Routing & Stopovers', icon: Plane },
    { key: 'baggage', title: 'Baggage Allowance', icon: Luggage },
    { key: 'passenger', title: 'Passenger Requirements', icon: Users }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fare Rules & Conditions
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{bookingClass}</Badge>
            <Badge variant="outline">{fareRules.fareFamily}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSampleData && (
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              These are sample fare rules. Actual terms may vary by airline and booking class.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className={`font-medium ${fareRules.refundable ? 'text-green-600' : 'text-red-600'}`}>
              {fareRules.refundable ? '✓ Refundable' : '✗ Non-refundable'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cancellation</p>
          </div>
          <div className="text-center">
            <div className={`font-medium ${fareRules.changeable ? 'text-green-600' : 'text-red-600'}`}>
              {fareRules.changeable ? '✓ Changeable' : '✗ Non-changeable'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Date Changes</p>
          </div>
          <div className="text-center">
            <div className={`font-medium ${fareRules.exchangeable ? 'text-green-600' : 'text-red-600'}`}>
              {fareRules.exchangeable ? '✓ Exchangeable' : '✗ Non-exchangeable'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Fare Exchange</p>
          </div>
        </div>

        {/* Key Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Validity Period:</span>
            <p className="text-muted-foreground">{fareRules.validityPeriod}</p>
          </div>
          {fareRules.advancePurchase && (
            <div>
              <span className="font-medium">Advance Purchase:</span>
              <p className="text-muted-foreground">{fareRules.advancePurchase}</p>
            </div>
          )}
          {fareRules.minimumStay && (
            <div>
              <span className="font-medium">Minimum Stay:</span>
              <p className="text-muted-foreground">{fareRules.minimumStay}</p>
            </div>
          )}
          {fareRules.maximumStay && (
            <div>
              <span className="font-medium">Maximum Stay:</span>
              <p className="text-muted-foreground">{fareRules.maximumStay}</p>
            </div>
          )}
        </div>

        {/* Important Restrictions */}
        {fareRules.restrictions.length > 0 && (
          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="font-medium text-orange-700 mb-2">Important Restrictions</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {fareRules.restrictions.map((restriction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  {restriction}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Rules */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>View Detailed Fare Rules</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {ruleCategories.map(category => {
              const rules = getRulesByCategory(category.key);
              if (rules.length === 0) return null;

              return (
                <Card key={category.key} className="border-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <category.icon className="h-4 w-4" />
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {rules.map((rule, index) => (
                        <div 
                          key={index} 
                          className={`text-sm p-3 rounded-md ${
                            rule.important 
                              ? 'bg-red-50 border border-red-200 text-red-800' 
                              : 'bg-muted/50'
                          }`}
                        >
                          {rule.important && (
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-700">Important</span>
                            </div>
                          )}
                          <p>{formatRule(rule.text)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Airline-specific footer */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>
            These fare rules are provided by <strong>{airline}</strong> and are subject to change. 
            For complete terms and conditions, please refer to the airline's official website.
          </p>
          <p className="mt-1">
            Always review fare conditions before booking. Some restrictions may apply based on 
            route, season, and availability.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};