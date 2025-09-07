import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot, Play, Pause, MessageSquare, Settings, TrendingUp, Users, Zap } from 'lucide-react';
import { useGPTBotIntegration } from '@/hooks/useGPTBotIntegration';

export const GPTBotIntegrationDashboard: React.FC = () => {
  const {
    bots,
    workflows,
    loading,
    error,
    loadBots,
    loadWorkflows,
    activateBot,
    deactivateBot,
    interactWithBot,
    createWorkflow,
  } = useGPTBotIntegration();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testingBot, setTestingBot] = useState<string | null>(null);

  useEffect(() => {
    loadBots();
    loadWorkflows();
  }, [loadBots, loadWorkflows]);

  const filteredBots = bots.filter(bot => {
    const matchesCategory = selectedCategory === 'all' || bot.category === selectedCategory;
    const matchesSearch = bot.bot_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [...new Set(bots.map(bot => bot.category))];
  const activeBots = bots.filter(bot => bot.integration_status === 'active');
  const totalRequests = activeBots.reduce((sum, bot) => sum + (bot.usage_metrics?.totalRequests || 0), 0);

  const handleTestBot = async (botId: string) => {
    if (!testPrompt.trim()) return;
    
    setTestingBot(botId);
    setTestResult(null);
    
    try {
      const result = await interactWithBot(botId, testPrompt);
      setTestResult(result);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTestingBot(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'outline';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading && bots.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading GPT Bot Integration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bots.length}</div>
            <p className="text-xs text-muted-foreground">
              Available GPT bots
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBots.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently integrated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              Across all bots
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflows</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground">
              Automated sequences
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bots" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bots">Bot Registry</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="test">Test Interface</TabsTrigger>
        </TabsList>

        <TabsContent value="bots" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search bots..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bot Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBots.map((bot) => (
              <Card key={bot.id} className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{bot.bot_name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(bot.integration_status)}>
                      {bot.integration_status}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {bot.bot_type} • {bot.category}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bot.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {bot.capabilities.slice(0, 3).map((capability, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {capability.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {bot.capabilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{bot.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {bot.usage_metrics?.totalRequests && (
                    <div className="text-xs text-muted-foreground">
                      {bot.usage_metrics.totalRequests} requests • 
                      Avg {bot.usage_metrics.avgResponseTime}ms
                    </div>
                  )}

                  <div className="flex gap-2">
                    {bot.integration_status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deactivateBot(bot.id)}
                        className="flex-1"
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => activateBot(bot.id)}
                        className="flex-1"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Activate
                      </Button>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{bot.bot_name} Details</DialogTitle>
                          <DialogDescription>
                            Configure and view bot information
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Capabilities</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {bot.capabilities.map((capability, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {capability.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">ChatGPT URL</Label>
                            <Input value={bot.chat_gpt_url} readOnly className="mt-1" />
                          </div>
                          {bot.usage_metrics && Object.keys(bot.usage_metrics).length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Usage Metrics</Label>
                              <pre className="text-xs bg-muted p-2 rounded mt-1">
                                {JSON.stringify(bot.usage_metrics, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Automation Workflows</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Create Workflow</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Workflow</DialogTitle>
                  <DialogDescription>
                    Create automated sequences of bot interactions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workflow-name">Workflow Name</Label>
                    <Input id="workflow-name" placeholder="Marketing Campaign Generator" />
                  </div>
                  <div>
                    <Label htmlFor="workflow-description">Description</Label>
                    <Textarea id="workflow-description" placeholder="Describe what this workflow does..." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="workflow-active" />
                    <Label htmlFor="workflow-active">Activate immediately</Label>
                  </div>
                  <Button onClick={() => createWorkflow({
                    workflow_name: 'Sample Workflow',
                    description: 'A sample workflow for testing',
                    bot_sequence: [],
                    trigger_conditions: {},
                    is_active: true
                  })}>
                    Create Workflow
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{workflow.workflow_name}</CardTitle>
                    <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                      {workflow.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription>{workflow.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {workflow.bot_sequence.length} bot steps configured
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Bot Interactions</CardTitle>
              <CardDescription>
                Test individual bots or workflows with custom prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-prompt">Test Prompt</Label>
                <Textarea
                  id="test-prompt"
                  placeholder="Enter a prompt to test with the bots..."
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {activeBots.slice(0, 6).map((bot) => (
                  <Button
                    key={bot.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestBot(bot.id)}
                    disabled={testingBot === bot.id || !testPrompt.trim()}
                  >
                    {testingBot === bot.id ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Test {bot.bot_name}
                      </>
                    )}
                  </Button>
                ))}
              </div>

              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};