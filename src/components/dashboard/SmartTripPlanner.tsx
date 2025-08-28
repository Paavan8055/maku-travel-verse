import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Cloud, 
  Clock,
  Thermometer,
  TrendingUp,
  Globe,
  Compass,
  Plus,
  Search,
  Star,
  Users
} from 'lucide-react';

interface WeatherData {
  destination: string;
  temperature: number;
  condition: string;
  humidity: number;
  forecast: {
    day: string;
    high: number;
    low: number;
    condition: string;
  }[];
}

interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  change: string;
}

interface Destination {
  name: string;
  country: string;
  rating: number;
  bestTime: string;
  averageCost: number;
  image: string;
  timezone: string;
}

export const SmartTripPlanner: React.FC<{ className?: string }> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<string>('Tokyo, Japan');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [trendingDestinations, setTrendingDestinations] = useState<Destination[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockWeather: WeatherData = {
      destination: 'Tokyo, Japan',
      temperature: 18,
      condition: 'Partly Cloudy',
      humidity: 65,
      forecast: [
        { day: 'Today', high: 20, low: 15, condition: 'Sunny' },
        { day: 'Tomorrow', high: 22, low: 16, condition: 'Cloudy' },
        { day: 'Wed', high: 19, low: 14, condition: 'Rain' },
        { day: 'Thu', high: 21, low: 17, condition: 'Sunny' }
      ]
    };

    const mockCurrencyRates: CurrencyRate[] = [
      { from: 'AUD', to: 'JPY', rate: 97.45, change: '+0.5%' },
      { from: 'AUD', to: 'USD', rate: 0.67, change: '-0.2%' },
      { from: 'AUD', to: 'EUR', rate: 0.61, change: '+0.3%' },
      { from: 'AUD', to: 'GBP', rate: 0.53, change: '+0.1%' }
    ];

    const mockDestinations: Destination[] = [
      {
        name: 'Bali',
        country: 'Indonesia',
        rating: 4.8,
        bestTime: 'Apr-Sep',
        averageCost: 2200,
        image: '/placeholder.svg',
        timezone: 'GMT+8'
      },
      {
        name: 'Paris',
        country: 'France',
        rating: 4.7,
        bestTime: 'May-Sep',
        averageCost: 3500,
        image: '/placeholder.svg',
        timezone: 'GMT+1'
      },
      {
        name: 'Dubai',
        country: 'UAE',
        rating: 4.6,
        bestTime: 'Nov-Mar',
        averageCost: 2800,
        image: '/placeholder.svg',
        timezone: 'GMT+4'
      }
    ];

    setWeatherData(mockWeather);
    setCurrencyRates(mockCurrencyRates);
    setTrendingDestinations(mockDestinations);
  }, []);

  const timeZones = [
    { city: 'Sydney', time: '10:30 AM', offset: '+11' },
    { city: 'Tokyo', time: '8:30 AM', offset: '+9' },
    { city: 'Dubai', time: '5:30 AM', offset: '+4' },
    { city: 'London', time: '12:30 AM', offset: '+0' },
    { city: 'New York', time: '7:30 PM', offset: '-5' }
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            Smart Trip Planner
          </h2>
          <p className="text-muted-foreground">AI-powered travel planning and insights</p>
        </div>
        <Badge className="bg-gradient-to-r from-travel-gold to-travel-sunset text-white">
          AI Powered
        </Badge>
      </div>

      <Tabs defaultValue="planner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planner">Planner</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="timezone">Time Zones</TabsTrigger>
        </TabsList>

        {/* Trip Planner */}
        <TabsContent value="planner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-travel-ocean" />
                Destination Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Where do you want to go?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trendingDestinations.map((dest, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{dest.name}</h4>
                          <p className="text-sm text-muted-foreground">{dest.country}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-travel-gold text-travel-gold" />
                          <span className="text-sm font-medium">{dest.rating}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Best Time:</span>
                          <span>{dest.bestTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Cost:</span>
                          <span className="font-medium">${dest.averageCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time Zone:</span>
                          <span>{dest.timezone}</span>
                        </div>
                      </div>
                      
                      <Button className="w-full mt-4" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Trip
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather */}
        <TabsContent value="weather" className="space-y-6">
          {weatherData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-travel-sky" />
                  Weather Forecast - {weatherData.destination}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-6 bg-gradient-to-br from-travel-sky/10 to-travel-ocean/10 rounded-lg">
                    <Thermometer className="h-8 w-8 text-travel-sky mx-auto mb-2" />
                    <p className="text-3xl font-bold">{weatherData.temperature}°C</p>
                    <p className="text-muted-foreground">{weatherData.condition}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Humidity</span>
                      <span className="font-medium">{weatherData.humidity}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Condition</span>
                      <span className="font-medium">{weatherData.condition}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {weatherData.forecast.map((day, index) => (
                    <div key={index} className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">{day.day}</p>
                      <p className="text-xs text-muted-foreground">{day.condition}</p>
                      <div className="mt-2">
                        <span className="text-lg font-bold">{day.high}°</span>
                        <span className="text-sm text-muted-foreground">/{day.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Currency */}
        <TabsContent value="currency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-travel-forest" />
                Currency Exchange Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currencyRates.map((rate, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{rate.from}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold">{rate.to}</span>
                      </div>
                      <Badge className={rate.change.startsWith('+') ? 
                        'bg-green-100 text-green-800 border-green-200' : 
                        'bg-red-100 text-red-800 border-red-200'
                      }>
                        {rate.change}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-travel-forest">{rate.rate}</p>
                    <p className="text-sm text-muted-foreground">Rate per 1 {rate.from}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-travel-gold/10 rounded-lg">
                <h4 className="font-semibold mb-2 text-travel-gold">Currency Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check rates before making large purchases</li>
                  <li>• Consider using travel cards to avoid fees</li>
                  <li>• Monitor rates for 30 days before travel</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Zones */}
        <TabsContent value="timezone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-travel-coral" />
                World Clock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeZones.map((tz, index) => (
                  <div key={index} className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow">
                    <Globe className="h-6 w-6 text-travel-coral mx-auto mb-2" />
                    <h4 className="font-semibold">{tz.city}</h4>
                    <p className="text-2xl font-bold text-travel-coral">{tz.time}</p>
                    <p className="text-sm text-muted-foreground">UTC {tz.offset}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-travel-coral/10 rounded-lg">
                <h4 className="font-semibold mb-2 text-travel-coral">Time Zone Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Set multiple alarms for important meetings</li>
                  <li>• Gradually adjust sleep schedule before travel</li>
                  <li>• Use world clock apps for coordination</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};