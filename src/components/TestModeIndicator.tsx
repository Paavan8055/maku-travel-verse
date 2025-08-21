import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TestTube, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import logger from "@/utils/logger";

interface TestCard {
  type: string;
  number: string;
  description: string;
  scenario: 'success' | 'decline' | 'error';
}

const testCards: TestCard[] = [
  { type: 'Visa', number: '4242 4242 4242 4242', description: 'Successful payment', scenario: 'success' },
  { type: 'Visa (debit)', number: '4000 0566 5566 5556', description: 'Successful debit payment', scenario: 'success' },
  { type: 'Mastercard', number: '5555 5555 5555 4444', description: 'Successful payment', scenario: 'success' },
  { type: 'American Express', number: '3782 822463 10005', description: 'Successful payment', scenario: 'success' },
  { type: 'Declined', number: '4000 0000 0000 0002', description: 'Card declined', scenario: 'decline' },
  { type: 'Insufficient funds', number: '4000 0000 0000 9995', description: 'Insufficient funds', scenario: 'decline' },
  { type: 'Processing error', number: '4000 0000 0000 0119', description: 'Processing error', scenario: 'error' },
];

interface TestModeIndicatorProps {
  isVisible?: boolean;
  className?: string;
}

const TestModeIndicator: React.FC<TestModeIndicatorProps> = ({ 
  isVisible = true, 
  className = "" 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);

  if (!isVisible) return null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCard(text);
      setTimeout(() => setCopiedCard(null), 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  };

  const getScenarioIcon = (scenario: string) => {
    switch (scenario) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'decline':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <TestTube className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Test Mode</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100"
          >
            {expanded ? 'Hide' : 'Show'} test cards
          </Button>
        </div>

        <p className="text-sm text-yellow-700 mb-3">
          You're in test mode. No real payments will be processed. Use the test card numbers below to simulate different payment scenarios.
        </p>

        {expanded && (
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-800 mb-2">Test Card Numbers:</h4>
            <div className="grid gap-2">
              {testCards.map((card, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border border-yellow-200 hover:bg-yellow-25 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getScenarioIcon(card.scenario)}
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {card.type}
                      </div>
                      <div className="text-xs text-gray-600">{card.description}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(card.number.replace(/\s/g, ''))}
                    className="font-mono text-sm hover:bg-yellow-100"
                  >
                    {copiedCard === card.number.replace(/\s/g, '') ? (
                      <span className="text-green-600">Copied!</span>
                    ) : (
                      <span className="text-gray-700">{card.number}</span>
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-white rounded border border-yellow-200">
              <h5 className="font-medium text-sm text-gray-900 mb-1">Additional Info:</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Use any future date for expiry (e.g., 12/25)</li>
                <li>• Use any 3-digit CVC for Visa/Mastercard, any 4-digit for Amex</li>
                <li>• Use any valid billing address</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestModeIndicator;