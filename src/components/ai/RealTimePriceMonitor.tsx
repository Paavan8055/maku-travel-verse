import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  DollarSign, 
  Clock, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import logger from "@/utils/logger";

interface PriceDataPoint {
  timestamp: string;
  price: number;
  supplier: string;
  availability: number;
  demandLevel: 'low' | 'medium' | 'high';
}

interface PriceAlert {
  id: string;
  itemType: 'hotel' | 'flight' | 'activity';
  itemId: string;
  itemName: string;
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  priceDropPercent?: number;
}

interface MarketTrend {
  direction: 'up' | 'down' | 'stable';
  strength: number; // 0-100
  confidence: number; // 0-100
  prediction: {
    nextHour: number;
    next24Hours: number;
    next7Days: number;
  };
  factors: Array<{
    factor: string;
    impact: number;
    explanation: string;
  }>;
}

interface RealTimePriceMonitorProps {
  itemType: 'hotel' | 'flight' | 'activity';
  itemId: string;
  itemName: string;
  className?: string;
}

export const RealTimePriceMonitor: React.FC<RealTimePriceMonitorProps> = ({
  itemType,
  itemId,
  itemName,
  className = ""
}) => {
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [marketTrend, setMarketTrend] = useState<MarketTrend | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePriceMonitor();
    const interval = setInterval(fetchRealTimePrice, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [itemType, itemId]);

  const initializePriceMonitor = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPriceHistory(),
        loadExistingAlerts(),
        analyzeMarketTrends()
      ]);
      setIsMonitoring(true);
    } catch (error) {
      logger.error('Failed to initialize price monitor:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceHistory = async () => {
    // Simulate loading price history from the last 24 hours
    const now = new Date();
    const history: PriceDataPoint[] = [];
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const basePrice = itemType === 'hotel' ? 250 : itemType === 'flight' ? 800 : 120;
      
      // Add realistic price fluctuations
      const volatility = Math.sin(i * 0.3) * 20 + Math.random() * 30 - 15;
      const demandMultiplier = Math.random() > 0.7 ? 1.1 : Math.random() < 0.3 ? 0.9 : 1;
      const price = Math.round((basePrice + volatility) * demandMultiplier);
      
      history.push({
        timestamp: timestamp.toISOString(),
        price,
        supplier: ['Amadeus', 'Sabre', 'Expedia', 'Booking.com'][Math.floor(Math.random() * 4)],
        availability: Math.floor(Math.random() * 50) + 10,
        demandLevel: price > basePrice + 10 ? 'high' : price < basePrice - 10 ? 'low' : 'medium'
      });
    }
    
    setPriceHistory(history);
    setCurrentPrice(history[history.length - 1]?.price || 0);
  };

  const loadExistingAlerts = async () => {
    // Simulate loading existing price alerts
    const alerts: PriceAlert[] = [
      {
        id: 'alert-1',
        itemType,
        itemId,
        itemName,
        targetPrice: itemType === 'hotel' ? 220 : itemType === 'flight' ? 750 : 100,
        currentPrice: currentPrice,
        isActive: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    setPriceAlerts(alerts);
  };

  const analyzeMarketTrends = async () => {
    if (priceHistory.length < 2) return;
    
    const recent = priceHistory.slice(-6); // Last 6 hours
    const priceChanges = recent.map((point, index) => 
      index > 0 ? point.price - recent[index - 1].price : 0
    ).filter(change => change !== 0);
    
    const avgChange = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    const direction = avgChange > 5 ? 'up' : avgChange < -5 ? 'down' : 'stable';
    const strength = Math.min(100, Math.abs(avgChange) * 5);
    
    const trend: MarketTrend = {
      direction,
      strength,
      confidence: Math.max(60, 100 - Math.abs(avgChange) * 2),
      prediction: {
        nextHour: currentPrice + (avgChange * 0.3),
        next24Hours: currentPrice + (avgChange * 2),
        next7Days: currentPrice + (avgChange * 8)
      },
      factors: [
        {
          factor: 'Demand Pattern',
          impact: direction === 'up' ? 25 : -25,
          explanation: `${direction === 'up' ? 'Increased' : 'Decreased'} booking activity detected`
        },
        {
          factor: 'Seasonal Trends',
          impact: 15,
          explanation: 'Current season shows moderate price pressure'
        },
        {
          factor: 'Competitor Pricing',
          impact: direction === 'down' ? -20 : 10,
          explanation: 'Market competition affecting price levels'
        }
      ]
    };
    
    setMarketTrend(trend);
  };

  const fetchRealTimePrice = async () => {
    if (!isMonitoring) return;
    
    try {
      // Simulate real-time price update
      const lastPrice = priceHistory[priceHistory.length - 1]?.price || currentPrice;
      const volatility = (Math.random() - 0.5) * 20; // ±10 price change
      const newPrice = Math.max(50, Math.round(lastPrice + volatility));
      
      const newDataPoint: PriceDataPoint = {
        timestamp: new Date().toISOString(),
        price: newPrice,
        supplier: ['Amadeus', 'Sabre', 'Booking.com'][Math.floor(Math.random() * 3)],
        availability: Math.floor(Math.random() * 50) + 10,
        demandLevel: newPrice > lastPrice + 10 ? 'high' : newPrice < lastPrice - 10 ? 'low' : 'medium'
      };
      
      setPriceHistory(prev => [...prev.slice(-23), newDataPoint]);
      setCurrentPrice(newPrice);
      
      // Check for price alerts
      checkPriceAlerts(newPrice);
      
    } catch (error) {
      logger.error('Failed to fetch real-time price:', error);
    }
  };

  const checkPriceAlerts = (price: number) => {
    priceAlerts.forEach(alert => {
      if (alert.isActive && price <= alert.targetPrice && !alert.triggeredAt) {
        const dropPercent = Math.round(((alert.currentPrice - price) / alert.currentPrice) * 100);
        
        // Trigger alert
        setPriceAlerts(prev => 
          prev.map(a => 
            a.id === alert.id 
              ? { ...a, triggeredAt: new Date().toISOString(), priceDropPercent: dropPercent }
              : a
          )
        );
        
        // In production, this would send push notification/email
        logger.info(`Price alert triggered for ${itemName}: ${price} (${dropPercent}% drop)`);
      }
    });
  };

  const createPriceAlert = async (targetPrice: number) => {
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      itemType,
      itemId,
      itemName,
      targetPrice,
      currentPrice,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    setPriceAlerts(prev => [...prev, newAlert]);
  };

  const toggleAlert = (alertId: string) => {
    setPriceAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
      )
    );
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-red-600';
      case 'down': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4" />;
      case 'down': return <TrendingDown className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Initializing price monitoring...</span>
          </div>
          <Progress value={60} className="w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  const priceChange = priceHistory.length > 1 
    ? currentPrice - priceHistory[priceHistory.length - 2].price 
    : 0;

  const priceChangePercent = priceHistory.length > 1 
    ? ((priceChange / priceHistory[priceHistory.length - 2].price) * 100).toFixed(1)
    : '0.0';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Real-time Price Display */}
      <Card className="bg-gradient-to-r from-travel-ocean/5 to-travel-forest/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-travel-ocean" />
              Real-time Price Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                <Zap className="h-3 w-3 mr-1" />
                Live
              </Badge>
              <Switch 
                checked={isMonitoring} 
                onCheckedChange={setIsMonitoring}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-travel-ocean mb-1">
                ${currentPrice}
              </div>
              <div className={`flex items-center justify-center gap-1 ${priceChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  ${Math.abs(priceChange)} ({priceChangePercent}%)
                </span>
              </div>
            </div>
            
            {marketTrend && (
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Market Trend</div>
                <div className={`flex items-center justify-center gap-2 ${getTrendColor(marketTrend.direction)}`}>
                  {getTrendIcon(marketTrend.direction)}
                  <span className="font-medium capitalize">{marketTrend.direction}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {marketTrend.confidence}% confidence
                </div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">24h Prediction</div>
              <div className="text-xl font-semibold">
                ${marketTrend?.prediction.next24Hours.toFixed(0) || currentPrice}
              </div>
              <div className="text-xs text-muted-foreground">
                AI-powered forecast
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-travel-gold" />
            24-Hour Price History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`$${value}`, 'Price']}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--travel-ocean))" 
                fill="hsl(var(--travel-ocean))" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Price Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-travel-coral" />
              Price Alerts
            </CardTitle>
            <Switch 
              checked={alertsEnabled} 
              onCheckedChange={setAlertsEnabled}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {priceAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${alert.triggeredAt ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  {alert.triggeredAt ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Target className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium">Alert at ${alert.targetPrice}</div>
                  <div className="text-sm text-muted-foreground">
                    {alert.triggeredAt ? (
                      <span className="text-green-600">
                        Triggered! {alert.priceDropPercent}% price drop
                      </span>
                    ) : (
                      `Current: $${currentPrice} (${((currentPrice - alert.targetPrice) / alert.targetPrice * 100).toFixed(1)}% above target)`
                    )}
                  </div>
                </div>
              </div>
              <Switch 
                checked={alert.isActive} 
                onCheckedChange={() => toggleAlert(alert.id)}
              />
            </div>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              const targetPrice = prompt(`Set price alert for ${itemName} (current: $${currentPrice}):`);
              if (targetPrice && !isNaN(Number(targetPrice))) {
                createPriceAlert(Number(targetPrice));
              }
            }}
          >
            <Bell className="h-4 w-4 mr-2" />
            Create New Alert
          </Button>
        </CardContent>
      </Card>

      {/* Market Analysis */}
      {marketTrend && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-travel-forest" />
              Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Next Hour</div>
                  <div className="text-xl font-semibold">${marketTrend.prediction.nextHour.toFixed(0)}</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Next 24 Hours</div>
                  <div className="text-xl font-semibold">${marketTrend.prediction.next24Hours.toFixed(0)}</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Next 7 Days</div>
                  <div className="text-xl font-semibold">${marketTrend.prediction.next7Days.toFixed(0)}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Key Factors</h4>
                {marketTrend.factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                    <div>
                      <div className="font-medium text-sm">{factor.factor}</div>
                      <div className="text-xs text-muted-foreground">{factor.explanation}</div>
                    </div>
                    <Badge variant={factor.impact > 0 ? "destructive" : "secondary"}>
                      {factor.impact > 0 ? '+' : ''}{factor.impact}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};