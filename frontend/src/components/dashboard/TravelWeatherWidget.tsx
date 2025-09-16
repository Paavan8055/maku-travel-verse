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
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Weather Updates</h3>
        </div>
        <div className="space-y-4 flex-1">
          {weatherData.slice(0, 2).map((weather, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30">
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
          {weatherData.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center">
              <p className="text-muted-foreground text-sm">No destination weather available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};