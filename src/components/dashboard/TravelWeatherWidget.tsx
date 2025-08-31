import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Cloud, CloudRain, MapPin, Thermometer } from 'lucide-react';

interface WeatherData {
  destination: string;
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
  humidity: number;
}

interface TravelWeatherWidgetProps {
  destinations: string[];
}

export const TravelWeatherWidget: React.FC<TravelWeatherWidgetProps> = ({ destinations }) => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);

  useEffect(() => {
    // Mock weather data - in production, this would call a real weather API
    const mockWeatherData: WeatherData[] = destinations.map(dest => ({
      destination: dest,
      temperature: Math.floor(Math.random() * 20) + 15,
      condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)] as any,
      humidity: Math.floor(Math.random() * 40) + 40
    }));
    
    setWeatherData(mockWeatherData);
  }, [destinations]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="h-6 w-6 text-travel-sunset" />;
      case 'cloudy': return <Cloud className="h-6 w-6 text-muted-foreground" />;
      case 'rainy': return <CloudRain className="h-6 w-6 text-travel-ocean" />;
      default: return <Sun className="h-6 w-6 text-travel-sunset" />;
    }
  };

  if (weatherData.length === 0) return null;

  return (
    <Card className="travel-card bg-gradient-to-br from-travel-sky/10 to-travel-ocean/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="h-5 w-5 text-travel-ocean" />
          <h3 className="font-semibold text-foreground">Weather Updates</h3>
        </div>
        <div className="space-y-3">
          {weatherData.slice(0, 2).map((weather, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{weather.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                {getWeatherIcon(weather.condition)}
                <span className="text-sm font-medium">{weather.temperature}°C</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};