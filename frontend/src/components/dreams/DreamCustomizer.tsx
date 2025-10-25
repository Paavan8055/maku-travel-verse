import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Minus, Calendar, Wallet, Users, Gift, Star, Sparkles, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { DreamPackage } from '@/data/dreamLibrary';

interface DreamCustomizerProps {
  dream: DreamPackage;
}

const DreamCustomizer = ({ dream }: DreamCustomizerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<'base' | 'premium' | 'luxury'>('base');
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([]);
  const [travelers, setTravelers] = useState(2);
  const [travelDates, setTravelDates] = useState({ start: '', end: '' });
  const [flexibleDates, setFlexibleDates] = useState(true);

  const baseCost = dream.budget[selectedTier];
  const upgradesCost = selectedUpgrades.reduce((sum, upgradeId) => {
    const upgrade = dream.upgrades.find(u => u.name === upgradeId);
    return sum + (upgrade?.price || 0);
  }, 0);
  const totalCost = (baseCost + upgradesCost) * travelers;

  const handleCreateTravelFund = () => {
    const customizedDream = {
      ...dream,
      tier: selectedTier,
      upgrades: selectedUpgrades,
      travelers,
      dates: travelDates,
      flexible: flexibleDates,
      totalCost
    };

    sessionStorage.setItem('dreamToFund', JSON.stringify(customizedDream));
    toast({ title: 'Dream Customized!', description: `Setting up Travel Fund for $${totalCost.toLocaleString()}` });
    navigate(`/travel-fund?dreamId=${dream.id}&amount=${totalCost}&source=smart-dream`);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start gap-8">
        <div className="flex-1 space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">{dream.title}</h2>
            <p className="text-slate-600 mb-4">{dream.tagline}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {(['base', 'premium', 'luxury'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTier === tier ? 'border-purple-600 bg-purple-50' : 'border-slate-200'
                  }`}
                >
                  <h3 className="font-semibold capitalize mb-1">{tier}</h3>
                  <p className="text-xl font-bold text-purple-600">${dream.budget[tier].toLocaleString()}</p>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Travelers</h3>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setTravelers(Math.max(1, travelers - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold">{travelers}</span>
                <Button variant="outline" size="icon" onClick={() => setTravelers(travelers + 1)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Upgrades</h3>
              <div className="space-y-2">
                {dream.upgrades.map((upgrade) => (
                  <label key={upgrade.name} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedUpgrades.includes(upgrade.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUpgrades([...selectedUpgrades, upgrade.name]);
                        } else {
                          setSelectedUpgrades(selectedUpgrades.filter(u => u !== upgrade.name));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{upgrade.name}</p>
                      <p className="text-sm text-slate-600">{upgrade.description}</p>
                    </div>
                    <span className="font-bold text-purple-600">+${upgrade.price}</span>
                  </label>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="w-80">
          <Card className="p-6 sticky top-24">
            <h3 className="font-semibold mb-4">Budget Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Base ({selectedTier})</span>
                <span>${baseCost.toLocaleString()}</span>
              </div>
              {upgradesCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Upgrades</span>
                  <span>${upgradesCost.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Travelers</span>
                <span>x{travelers}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-purple-600">${totalCost.toLocaleString()}</span>
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-rose-600" onClick={handleCreateTravelFund} size="lg">
              <Wallet className="w-4 h-4 mr-2" />
              Create Travel Fund
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DreamCustomizer;