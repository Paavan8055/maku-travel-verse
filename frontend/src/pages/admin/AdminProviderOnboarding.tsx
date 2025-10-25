/**
 * Admin Provider Onboarding Dashboard
 * Internal tool for business team to add new provider integrations
 * Configuration-driven - no code changes needed
 */

import { useState, useEffect } from 'react';
import { Plus, Check, X, Activity, Settings, Key, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminProviderOnboarding = () => {
  const { toast } = useToast();
  const [providers, setProviders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    provider_name: '',
    display_name: '',
    provider_type: 'hotel',
    api_base_url: '',
    supports_hotels: false,
    supports_flights: false,
    supports_activities: false,
    priority: 50,
    eco_rating: 50,
    fee_transparency_score: 50,
    supported_regions: [],
    is_test_mode: true
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    const { data } = await supabase
      .from('provider_registry')
      .select('*')
      .order('priority');
    
    if (data) setProviders(data);
  };

  const handleAddProvider = async () => {
    const { data, error } = await supabase
      .from('provider_registry')
      .insert([formData])
      .select();
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success!', description: `${formData.display_name} added to registry` });
      setShowAddForm(false);
      fetchProviders();
    }
  };

  const toggleProviderStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('provider_registry')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    fetchProviders();
    toast({ title: 'Updated', description: 'Provider status changed' });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Provider Registry</h1>
          <p className="text-slate-600">Manage travel provider integrations</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Add Provider Form */}
      {showAddForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Provider</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Provider Name (Internal)</label>
              <Input
                placeholder="sabre"
                value={formData.provider_name}
                onChange={(e) => setFormData({...formData, provider_name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Display Name</label>
              <Input
                placeholder="Sabre GDS"
                value={formData.display_name}
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">API Base URL</label>
              <Input
                placeholder="https://api.sabre.com"
                value={formData.api_base_url}
                onChange={(e) => setFormData({...formData, api_base_url: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Priority (lower = higher)</label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 block">Capabilities</label>
            <div className="flex gap-4">
              {['Hotels', 'Flights', 'Activities'].map((cap) => (
                <label key={cap} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData[`supports_${cap.toLowerCase()}` as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData({...formData, [`supports_${cap.toLowerCase()}`]: e.target.checked})}
                  />
                  {cap}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleAddProvider}>Save Provider</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Provider List */}
      <div className="space-y-4">
        {providers.map((provider: any) => (
          <Card key={provider.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{provider.display_name}</h3>
                  <Badge className={provider.is_active ? 'bg-green-600' : 'bg-red-600'}>
                    {provider.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">Priority: {provider.priority}</Badge>
                  <Badge variant="outline">Eco: {provider.eco_rating}/100</Badge>
                </div>
                <div className="flex gap-2">
                  {provider.supports_hotels && <Badge>Hotels</Badge>}
                  {provider.supports_flights && <Badge>Flights</Badge>}
                  {provider.supports_activities && <Badge>Activities</Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleProviderStatus(provider.id, provider.is_active)}
                >
                  {provider.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminProviderOnboarding;
