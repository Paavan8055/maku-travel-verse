import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Settings, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface GPTBot {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  priority: number;
  capabilities: string[];
  healthScore: number;
  lastActive: string;
  resultsCount: number;
  successRate: number;
  averageResponseTime: number;
}

const GPT_BOTS: GPTBot[] = [
  {
    id: 'analytics-reporting-manager',
    name: 'Analytics & Reporting Manager',
    description: 'Advanced data aggregation and performance reporting',
    category: 'Analytics',
    status: 'active',
    priority: 1,
    capabilities: ['data_aggregation', 'performance_reporting', 'predictive_analytics'],
    healthScore: 98,
    lastActive: '2 minutes ago',
    resultsCount: 1247,
    successRate: 97.8,
    averageResponseTime: 1.2
  },
  {
    id: 'customer-relationship-manager',
    name: 'Customer Relationship Manager',
    description: 'Customer segmentation and loyalty management',
    category: 'Customer Service',
    status: 'active',
    priority: 1,
    capabilities: ['customer_segmentation', 'loyalty_management', 'personalization_engine'],
    healthScore: 95,
    lastActive: '5 minutes ago',
    resultsCount: 892,
    successRate: 94.2,
    averageResponseTime: 1.8
  },
  {
    id: 'financial-transaction-manager',
    name: 'Financial Transaction Manager',
    description: 'Payment orchestration and financial reporting',
    category: 'Finance',
    status: 'active',
    priority: 1,
    capabilities: ['payment_orchestration', 'billing_management', 'financial_reporting'],
    healthScore: 99,
    lastActive: '1 minute ago',
    resultsCount: 2156,
    successRate: 99.1,
    averageResponseTime: 0.9
  },
  {
    id: 'content-management-manager',
    name: 'Content Management Manager',
    description: 'Content lifecycle and marketing coordination',
    category: 'Content',
    status: 'active',
    priority: 2,
    capabilities: ['content_lifecycle', 'marketing_coordination', 'policy_updates'],
    healthScore: 87,
    lastActive: '8 minutes ago',
    resultsCount: 634,
    successRate: 91.5,
    averageResponseTime: 2.1
  },
  {
    id: 'inventory-management-manager',
    name: 'Inventory Management Manager',
    description: 'Dynamic allocation and availability optimization',
    category: 'Operations',
    status: 'maintenance',
    priority: 2,
    capabilities: ['dynamic_allocation', 'availability_optimization', 'supply_chain_coordination'],
    healthScore: 72,
    lastActive: '2 hours ago',
    resultsCount: 445,
    successRate: 88.3,
    averageResponseTime: 3.2
  },
  {
    id: 'marketing-campaign-manager',
    name: 'Marketing Campaign Manager',
    description: 'Campaign orchestration and audience targeting',
    category: 'Marketing',
    status: 'error',
    priority: 2,
    capabilities: ['campaign_orchestration', 'audience_targeting', 'campaign_optimization'],
    healthScore: 45,
    lastActive: '45 minutes ago',
    resultsCount: 123,
    successRate: 67.8,
    averageResponseTime: 5.6
  }
];

export const GPTBotRegistry: React.FC = () => {
  const [bots, setBots] = useState<GPTBot[]>(GPT_BOTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleBotToggle = async (botId: string, enabled: boolean) => {
    setBots(prevBots => 
      prevBots.map(bot => 
        bot.id === botId 
          ? { ...bot, status: enabled ? 'active' : 'inactive' }
          : bot
      )
    );

    // Update bot configuration in database
    const { error } = await supabase
      .from('bot_configurations')
      .upsert({
        bot_id: botId,
        enabled,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating bot configuration:', error);
    }
  };

  const handleBotMaintenance = async (botId: string) => {
    setBots(prevBots => 
      prevBots.map(bot => 
        bot.id === botId 
          ? { ...bot, status: 'maintenance' }
          : bot
      )
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || bot.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || bot.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(bots.map(bot => bot.category))];
  const statuses = [...new Set(bots.map(bot => bot.status))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GPT Bot Registry</h2>
          <p className="text-muted-foreground">
            Manage and monitor all {bots.length} AI bots in the system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <span className="text-sm font-medium">
            {bots.filter(b => b.status === 'active').length} Active
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Input
          placeholder="Search bots..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="lg:w-64"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="lg:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="lg:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBots.map((bot) => (
              <Card key={bot.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(bot.status)}
                      <CardTitle className="text-lg">{bot.name}</CardTitle>
                    </div>
                    <Switch
                      checked={bot.status === 'active'}
                      onCheckedChange={(checked) => handleBotToggle(bot.id, checked)}
                      disabled={bot.status === 'error'}
                    />
                  </div>
                  <CardDescription>{bot.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{bot.category}</Badge>
                    <Badge className={getStatusColor(bot.status)}>
                      {bot.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Health Score</span>
                      <span className="font-medium">{bot.healthScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${bot.healthScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Results</span>
                      <p className="font-medium">{bot.resultsCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Success Rate</span>
                      <p className="font-medium">{bot.successRate}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {bot.capabilities.slice(0, 2).map((capability) => (
                      <Badge key={capability} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {bot.capabilities.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{bot.capabilities.length - 2} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      Configure
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBotMaintenance(bot.id)}
                    >
                      Maintain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="space-y-2">
            {filteredBots.map((bot) => (
              <Card key={bot.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(bot.status)}
                      <div>
                        <h3 className="font-medium">{bot.name}</h3>
                        <p className="text-sm text-gray-500">{bot.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{bot.healthScore}%</p>
                        <p className="text-xs text-gray-500">Health</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{bot.resultsCount}</p>
                        <p className="text-xs text-gray-500">Results</p>
                      </div>
                      <Switch
                        checked={bot.status === 'active'}
                        onCheckedChange={(checked) => handleBotToggle(bot.id, checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div>
                    <p className="text-2xl font-bold">{bots.filter(b => b.status === 'active').length}</p>
                    <p className="text-xs text-muted-foreground">Active Bots</p>
                  </div>
                  <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {(bots.reduce((acc, bot) => acc + bot.healthScore, 0) / bots.length).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Health Score</p>
                  </div>
                  <TrendingUp className="h-4 w-4 ml-auto text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {bots.reduce((acc, bot) => acc + bot.resultsCount, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Results</p>
                  </div>
                  <Bot className="h-4 w-4 ml-auto text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {(bots.reduce((acc, bot) => acc + bot.successRate, 0) / bots.length).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Success Rate</p>
                  </div>
                  <CheckCircle className="h-4 w-4 ml-auto text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};