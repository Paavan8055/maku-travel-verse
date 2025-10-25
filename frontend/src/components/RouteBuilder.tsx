/**
 * Multi-Destination Route Builder
 * Combine multiple dreams into one optimized journey
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Route, DollarSign, Calendar, Plane, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface RouteStop {
  country: string;
  duration: number;
  budget: number;
  image: string;
}

const RouteBuilder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [route, setRoute] = useState<RouteStop[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');

  const availableCountries = [
    { name: 'India', budget: 60, image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=200' },
    { name: 'Nepal', budget: 45, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200' },
    { name: 'Thailand', budget: 50, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=200' },
    { name: 'Vietnam', budget: 40, image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=200' }
  ];

  const addToRoute = (country: any) => {
    setRoute([...route, { country: country.name, duration: 7, budget: country.budget * 7, image: country.image }]);
  };

  const totalBudget = route.reduce((sum, stop) => sum + stop.budget, 0);
  const totalDays = route.reduce((sum, stop) => sum + stop.duration, 0);
  const combinedSavings = route.length > 1 ? totalBudget * 0.15 : 0;

  const createRoute = () => {
    sessionStorage.setItem('customRoute', JSON.stringify(route));
    toast({ title: 'Route Created!', description: `${route.length} destinations, ${totalDays} days` });
    navigate('/travel-fund?source=multi-destination-route');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Build Your Multi-Country Route</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4">Your Route</h3>
            {route.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Add destinations to build your route</p>
            ) : (
              <div className="space-y-3">
                {route.map((stop, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                    <img src={stop.image} alt={stop.country} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold">{stop.country}</h4>
                      <p className="text-sm text-slate-600">{stop.duration} days • ${stop.budget}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setRoute(route.filter((_, i) => i !== idx))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Available Destinations</h3>
            <div className="grid grid-cols-2 gap-4">
              {availableCountries.map((country) => (
                <button
                  key={country.name}
                  onClick={() => addToRoute(country)}
                  className="p-4 border-2 rounded-lg hover:border-purple-600 transition-colors"
                >
                  <img src={country.image} alt={country.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                  <h4 className="font-semibold">{country.name}</h4>
                  <p className="text-sm text-slate-600">${country.budget}/day</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6 sticky top-24">
            <h3 className="font-semibold mb-4">Route Summary</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Destinations</span>
                <span className="font-bold">{route.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total Days</span>
                <span className="font-bold">{totalDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Base Budget</span>
                <span className="font-bold">${totalBudget}</span>
              </div>
              {combinedSavings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="text-sm">Combined Savings</span>
                  <span className="font-bold">-${Math.round(combinedSavings)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-purple-600">
                  ${Math.round(totalBudget - combinedSavings)}
                </span>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-rose-600"
              disabled={route.length === 0}
              onClick={createRoute}
            >
              <Route className="w-4 h-4 mr-2" />
              Create Multi-Country Dream
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RouteBuilder;
