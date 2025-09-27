import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Crown,
  Trophy, 
  Star, 
  Award,
  Plus,
  Settings,
  Users,
  Coins,
  Zap,
  Calendar,
  Edit,
  Trash2,
  Gift,
  Sparkles
} from 'lucide-react';

interface NFTTemplate {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    booking_value?: number;
    provider?: string;
    experience_type?: string;
  };
  rewards: {
    platform_credits: number;
    discount_percentage: number;
    priority_access: boolean;
  };
  image_template: string;
  active: boolean;
}

interface AirdropConfig {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_allocation: number;
  tier_multipliers: {
    wanderer: number;
    explorer: number;
    adventurer: number;
    legend: number;
  };
  quest_points_multiplier: number;
  provider_bonuses: {
    expedia: number;
    amadeus: number;
    viator: number;
    duffle: number;
    ratehawk: number;
    sabre: number;
  };
  active: boolean;
}

const NFTAdminDashboard: React.FC = () => {
  const [nftTemplates, setNftTemplates] = useState<NFTTemplate[]>([]);
  const [airdropConfigs, setAirdropConfigs] = useState<AirdropConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('nft-management');

  // NFT Creation Form State
  const [newNFT, setNewNFT] = useState({
    name: '',
    rarity: 'common',
    booking_value: 0,
    provider: '',
    platform_credits: 0,
    discount_percentage: 0,
    priority_access: false,
    image_template: ''
  });

  // Airdrop Config Form State
  const [newAirdrop, setNewAirdrop] = useState({
    name: '',
    start_date: '',
    end_date: '',
    total_allocation: 0,
    quest_multiplier: 1.0,
    tier_multipliers: {
      wanderer: 1.0,
      explorer: 1.5,
      adventurer: 2.0,
      legend: 2.5
    },
    provider_bonuses: {
      expedia: 15,
      amadeus: 10,
      viator: 12,
      duffle: 10,
      ratehawk: 10,
      sabre: 10
    }
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Mock data for now - in production would fetch from backend
      setNftTemplates([
        {
          id: 'nft_template_001',
          name: 'Expedia Group Master Explorer',
          rarity: 'epic',
          requirements: {
            booking_value: 2000,
            provider: 'expedia',
            experience_type: 'luxury'
          },
          rewards: {
            platform_credits: 300,
            discount_percentage: 15,
            priority_access: true
          },
          image_template: '/api/nft/templates/expedia_master.png',
          active: true
        },
        {
          id: 'nft_template_002',
          name: 'Multi-Provider Champion',
          rarity: 'rare',
          requirements: {
            booking_value: 1000,
            provider: 'multi'
          },
          rewards: {
            platform_credits: 200,
            discount_percentage: 10,
            priority_access: true
          },
          image_template: '/api/nft/templates/multi_provider.png',
          active: true
        }
      ]);

      setAirdropConfigs([
        {
          id: 'summer_2024_airdrop',
          name: 'Summer 2024 Travel Rewards',
          start_date: '2024-07-01',
          end_date: '2024-07-31',
          total_allocation: 1000000,
          tier_multipliers: {
            wanderer: 1.0,
            explorer: 1.5,
            adventurer: 2.0,
            legend: 2.5
          },
          quest_points_multiplier: 2.5,
          provider_bonuses: {
            expedia: 15,
            amadeus: 10,
            viator: 12,
            duffle: 10,
            ratehawk: 10,
            sabre: 10
          },
          active: true
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
    }
  };

  const createNFTTemplate = async () => {
    try {
      const template: NFTTemplate = {
        id: `nft_template_${Date.now()}`,
        name: newNFT.name,
        rarity: newNFT.rarity as any,
        requirements: {
          booking_value: newNFT.booking_value,
          provider: newNFT.provider || undefined,
        },
        rewards: {
          platform_credits: newNFT.platform_credits,
          discount_percentage: newNFT.discount_percentage,
          priority_access: newNFT.priority_access
        },
        image_template: newNFT.image_template,
        active: true
      };

      setNftTemplates([...nftTemplates, template]);
      
      // Reset form
      setNewNFT({
        name: '',
        rarity: 'common',
        booking_value: 0,
        provider: '',
        platform_credits: 0,
        discount_percentage: 0,
        priority_access: false,
        image_template: ''
      });

      alert('NFT template created successfully!');
    } catch (error) {
      console.error('Error creating NFT template:', error);
      alert('Failed to create NFT template');
    }
  };

  const createAirdropConfig = async () => {
    try {
      const config: AirdropConfig = {
        id: `airdrop_${Date.now()}`,
        name: newAirdrop.name,
        start_date: newAirdrop.start_date,
        end_date: newAirdrop.end_date,
        total_allocation: newAirdrop.total_allocation,
        tier_multipliers: newAirdrop.tier_multipliers,
        quest_points_multiplier: newAirdrop.quest_multiplier,
        provider_bonuses: newAirdrop.provider_bonuses,
        active: true
      };

      setAirdropConfigs([...airdropConfigs, config]);
      
      alert('Airdrop configuration created successfully!');
    } catch (error) {
      console.error('Error creating airdrop config:', error);
      alert('Failed to create airdrop configuration');
    }
  };

  const toggleNFTTemplate = (id: string) => {
    setNftTemplates(templates => 
      templates.map(template => 
        template.id === id ? { ...template, active: !template.active } : template
      )
    );
  };

  const toggleAirdropConfig = (id: string) => {
    setAirdropConfigs(configs => 
      configs.map(config => 
        config.id === id ? { ...config, active: !config.active } : config
      )
    );
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return Crown;
      case 'epic': return Trophy;
      case 'rare': return Star;
      default: return Award;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading NFT admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">NFT & Airdrop Management</h1>
          <p className="text-gray-600">Control NFT generation, airdrop distribution, and tokenomics</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <Settings className="w-4 h-4 mr-1" />
          Admin Access
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nft-management">NFT Management</TabsTrigger>
          <TabsTrigger value="airdrop-control">Airdrop Control</TabsTrigger>
          <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* NFT Management Tab */}
        <TabsContent value="nft-management">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create NFT Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Create NFT Template</span>
                </CardTitle>
                <CardDescription>Generate new NFT types for travel experiences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">NFT Name</label>
                  <Input
                    value={newNFT.name}
                    onChange={(e) => setNewNFT({...newNFT, name: e.target.value})}
                    placeholder="e.g., Santorini Master Explorer"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Rarity Level</label>
                  <Select value={newNFT.rarity} onValueChange={(value) => setNewNFT({...newNFT, rarity: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rarity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Min Booking Value ($)</label>
                    <Input
                      type="number"
                      value={newNFT.booking_value}
                      onChange={(e) => setNewNFT({...newNFT, booking_value: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Platform Credits</label>
                    <Input
                      type="number"
                      value={newNFT.platform_credits}
                      onChange={(e) => setNewNFT({...newNFT, platform_credits: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Target Provider</label>
                  <Select value={newNFT.provider} onValueChange={(value) => setNewNFT({...newNFT, provider: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Providers</SelectItem>
                      <SelectItem value="expedia">Expedia Group</SelectItem>
                      <SelectItem value="amadeus">Amadeus</SelectItem>
                      <SelectItem value="viator">Viator</SelectItem>
                      <SelectItem value="duffle">Duffle</SelectItem>
                      <SelectItem value="ratehawk">RateHawk</SelectItem>
                      <SelectItem value="sabre">Sabre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="priority_access"
                    checked={newNFT.priority_access}
                    onChange={(e) => setNewNFT({...newNFT, priority_access: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="priority_access" className="text-sm text-gray-700">
                    Grant Priority Access
                  </label>
                </div>

                <Button onClick={createNFTTemplate} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create NFT Template
                </Button>
              </CardContent>
            </Card>

            {/* Active NFT Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Active NFT Templates</span>
                </CardTitle>
                <CardDescription>Manage existing NFT templates and their rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nftTemplates.map((template) => {
                    const RarityIcon = getRarityIcon(template.rarity);
                    const rarityColor = getRarityColor(template.rarity);
                    
                    return (
                      <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${rarityColor} rounded-lg flex items-center justify-center`}>
                              <RarityIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{template.name}</h4>
                              <p className="text-sm text-gray-600">
                                {template.rarity} • ${template.requirements.booking_value}+ bookings
                              </p>
                              <p className="text-xs text-gray-500">
                                Rewards: {template.rewards.platform_credits} credits, {template.rewards.discount_percentage}% discount
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={template.active ? "default" : "secondary"}>
                              {template.active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleNFTTemplate(template.id)}
                            >
                              {template.active ? "Disable" : "Enable"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Airdrop Control Tab */}
        <TabsContent value="airdrop-control">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Create Airdrop Config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Create Airdrop Event</span>
                </CardTitle>
                <CardDescription>Configure new airdrop distribution events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Event Name</label>
                  <Input
                    value={newAirdrop.name}
                    onChange={(e) => setNewAirdrop({...newAirdrop, name: e.target.value})}
                    placeholder="e.g., Winter 2024 Travel Rewards"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Start Date</label>
                    <Input
                      type="date"
                      value={newAirdrop.start_date}
                      onChange={(e) => setNewAirdrop({...newAirdrop, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">End Date</label>
                    <Input
                      type="date"
                      value={newAirdrop.end_date}
                      onChange={(e) => setNewAirdrop({...newAirdrop, end_date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Total Token Allocation</label>
                  <Input
                    type="number"
                    value={newAirdrop.total_allocation}
                    onChange={(e) => setNewAirdrop({...newAirdrop, total_allocation: parseInt(e.target.value) || 0})}
                    placeholder="1000000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Quest Points Multiplier</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newAirdrop.quest_multiplier}
                    onChange={(e) => setNewAirdrop({...newAirdrop, quest_multiplier: parseFloat(e.target.value) || 1.0})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tier Multipliers</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(newAirdrop.tier_multipliers).map(([tier, multiplier]) => (
                      <div key={tier} className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 capitalize w-20">{tier}:</span>
                        <Input
                          type="number"
                          step="0.1"
                          value={multiplier}
                          onChange={(e) => setNewAirdrop({
                            ...newAirdrop,
                            tier_multipliers: {
                              ...newAirdrop.tier_multipliers,
                              [tier]: parseFloat(e.target.value) || 1.0
                            }
                          })}
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={createAirdropConfig} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Airdrop Event
                </Button>
              </CardContent>
            </Card>

            {/* Active Airdrop Configs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="w-5 h-5" />
                  <span>Active Airdrop Events</span>
                </CardTitle>
                <CardDescription>Manage airdrop configurations and distributions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {airdropConfigs.map((config) => (
                    <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{config.name}</h4>
                          <p className="text-sm text-gray-600">
                            {config.start_date} - {config.end_date}
                          </p>
                          <p className="text-xs text-gray-500">
                            Total Allocation: {config.total_allocation.toLocaleString()} tokens
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={config.active ? "default" : "secondary"}>
                            {config.active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleAirdropConfig(config.id)}
                          >
                            {config.active ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Quest Multiplier:</span> {config.quest_points_multiplier}x
                        </div>
                        <div>
                          <span className="font-medium">Max Tier Bonus:</span> {Math.max(...Object.values(config.tier_multipliers))}x
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tokenomics Tab */}
        <TabsContent value="tokenomics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Coins className="w-5 h-5" />
                <span>Tokenomics Configuration</span>
              </CardTitle>
              <CardDescription>Configure token economics and distribution mechanisms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Token Distribution */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Token Distribution</h3>
                  
                  <div className="space-y-4">
                    {[
                      { category: 'Airdrop Allocation', percentage: 40, amount: 4000000, editable: true },
                      { category: 'NFT Holder Rewards', percentage: 25, amount: 2500000, editable: true },
                      { category: 'Provider Partnerships', percentage: 15, amount: 1500000, editable: true },
                      { category: 'Team & Development', percentage: 10, amount: 1000000, editable: true },
                      { category: 'Community Treasury', percentage: 10, amount: 1000000, editable: true }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{item.category}</span>
                          <p className="text-sm text-gray-600">{item.amount.toLocaleString()} tokens</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-blue-600">{item.percentage}%</span>
                          {item.editable && (
                            <Button size="sm" variant="outline">
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Provider Bonus Configuration */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Provider Bonus Rates</h3>
                  
                  <div className="space-y-3">
                    {Object.entries(newAirdrop.provider_bonuses).map(([provider, bonus]) => (
                      <div key={provider} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900 capitalize">{provider}</span>
                          {provider === 'expedia' && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                              New Integration
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={bonus}
                            onChange={(e) => setNewAirdrop({
                              ...newAirdrop,
                              provider_bonuses: {
                                ...newAirdrop.provider_bonuses,
                                [provider]: parseInt(e.target.value) || 0
                              }
                            })}
                            className="w-20 text-sm"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Update Provider Bonuses
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid md:grid-cols-3 gap-6">
            {/* NFT Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>NFT Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">247</div>
                    <div className="text-sm text-gray-600">Total NFTs Minted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">$156K</div>
                    <div className="text-sm text-gray-600">Total Booking Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-gray-600">User Satisfaction</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Airdrop Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="w-5 h-5" />
                  <span>Airdrop Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">1,847</div>
                    <div className="text-sm text-gray-600">Eligible Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">487K</div>
                    <div className="text-sm text-gray-600">Total Points Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">73%</div>
                    <div className="text-sm text-gray-600">Quest Completion Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Provider Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Provider Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { provider: 'Expedia', nfts: 89, bonus: '15%', color: 'text-blue-600' },
                    { provider: 'Amadeus', nfts: 67, bonus: '10%', color: 'text-green-600' },
                    { provider: 'Viator', nfts: 52, bonus: '12%', color: 'text-purple-600' },
                    { provider: 'Duffle', nfts: 39, bonus: '10%', color: 'text-orange-600' }
                  ].map((provider) => (
                    <div key={provider.provider} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{provider.provider}</span>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${provider.color}`}>{provider.nfts} NFTs</div>
                        <div className="text-xs text-gray-600">{provider.bonus} bonus</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NFTAdminDashboard;