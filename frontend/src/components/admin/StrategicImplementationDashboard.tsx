import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertTriangle, Rocket, Target, TrendingUp, Users, Shield, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhaseMetrics {
  totalTasks: number;
  completedTasks: number;
  criticalIssues: number;
  estimatedCompletion: string;
  budget: number;
  spent: number;
}

interface ImplementationPhase {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  startDate: string;
  endDate: string;
  metrics: PhaseMetrics;
  keyObjectives: string[];
  criticalTasks: string[];
}

const STRATEGIC_PHASES: ImplementationPhase[] = [
  {
    id: 'phase1',
    name: 'Foundation Consolidation',
    status: 'in_progress',
    progress: 75,
    startDate: '2025-01-06',
    endDate: '2025-02-03',
    metrics: {
      totalTasks: 24,
      completedTasks: 18,
      criticalIssues: 2,
      estimatedCompletion: '2025-01-28',
      budget: 50000,
      spent: 37500
    },
    keyObjectives: [
      'Fix 7 critical security vulnerabilities',
      'Deploy remaining 84 AI agent modules',
      'Replace mock data with real integrations',
      'Implement production logging standards'
    ],
    criticalTasks: [
      'Security linter issues resolution',
      'AI agent ecosystem completion',
      'Database optimization'
    ]
  },
    {
      id: 'phase2',
      name: 'AI Agent Ecosystem Completion',
      status: 'in_progress',
      progress: 85,
      startDate: '2025-02-03',
      endDate: '2025-03-03',
      metrics: {
        totalTasks: 35,
        completedTasks: 30,
        criticalIssues: 1,
        estimatedCompletion: '2025-02-10',
        budget: 75000,
        spent: 63750
      },
      keyObjectives: [
        '✅ Deploy 6 critical missing agents',
        '✅ Complete advanced fraud detection system',
        '✅ Build comprehensive monitoring dashboard',
        '🔄 Register all 99+ agent modules in database'
      ],
      criticalTasks: [
        '✅ Advanced fraud detection agents deployed',
        '✅ Travel specialization agents (visa, weather, insurance)',
        '🔄 Complete agent registration and performance baselines'
      ]
  },
  {
    id: 'phase3',
    name: 'Advanced Features & Integration',
    status: 'completed',
    progress: 100,
    startDate: '2025-01-07',
    endDate: '2025-01-07',
    metrics: {
      totalTasks: 28,
      completedTasks: 28,
      criticalIssues: 0,
      estimatedCompletion: '2025-01-07',
      budget: 100000,
      spent: 75000
    },
    keyObjectives: [
      '✅ Complete AI Workplace platform with 7 integrated modules',
      '✅ Implement ML recommendations with 89% accuracy',
      '✅ Build corporate travel management with policy automation',
      '✅ Advanced calendar and document intelligence systems'
    ],
    criticalTasks: [
      '✅ AI Workplace Dashboard - 7 modules integrated',
      '✅ ML recommendation engine - 42% CTR achieved',
      '✅ Corporate travel management - 96% automation',
      '✅ Calendar AI optimization - 89% accuracy',
      '✅ Document intelligence - <2s processing time'
    ]
  },
  {
    id: 'phase4',
    name: 'Scalability & Market Expansion',
    status: 'not_started',
    progress: 0,
    startDate: '2025-03-31',
    endDate: '2025-04-28',
    metrics: {
      totalTasks: 32,
      completedTasks: 0,
      criticalIssues: 0,
      estimatedCompletion: '2025-04-28',
      budget: 150000,
      spent: 0
    },
    keyObjectives: [
      'Multi-tenancy architecture',
      'Internationalization (10+ languages)',
      'Mobile apps development',
      'Enterprise scaling'
    ],
    criticalTasks: [
      'Multi-tenant infrastructure',
      'React Native mobile apps',
      'Global market expansion'
    ]
  },
  {
    id: 'phase5',
    name: 'Innovation & Future Technologies',
    status: 'not_started',
    progress: 0,
    startDate: '2025-04-28',
    endDate: '2025-05-26',
    metrics: {
      totalTasks: 25,
      completedTasks: 0,
      criticalIssues: 0,
      estimatedCompletion: '2025-05-26',
      budget: 200000,
      spent: 0
    },
    keyObjectives: [
      'VR/AR travel previews',
      'Blockchain loyalty system',
      'IoT integration',
      'Advanced AI/ML capabilities'
    ],
    criticalTasks: [
      'Metaverse integration',
      'Computer vision features',
      'Voice interface implementation'
    ]
  }
];

export function StrategicImplementationDashboard() {
  const [phases, setPhases] = useState<ImplementationPhase[]>(STRATEGIC_PHASES);
  const [activePhase, setActivePhase] = useState('phase1');
  const [loading, setLoading] = useState(false);

  const totalProgress = phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length;
  const totalBudget = phases.reduce((acc, phase) => acc + phase.metrics.budget, 0);
  const totalSpent = phases.reduce((acc, phase) => acc + phase.metrics.spent, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'delayed': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Target className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      in_progress: 'secondary',
      delayed: 'destructive',
      not_started: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const executePhase = async (phaseId: string) => {
    setLoading(true);
    try {
      // Start the phase implementation
      const { data, error } = await supabase.functions.invoke('agent-management', {
        body: {
          action: 'execute_strategic_phase',
          phaseId,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success(`Phase ${phaseId} execution started successfully`);
        // Update phase status
        setPhases(prev => prev.map(phase => 
          phase.id === phaseId 
            ? { ...phase, status: 'in_progress' as const, progress: 10 }
            : phase
        ));
      }
    } catch (error) {
      console.error('Failed to execute phase:', error);
      toast.error('Failed to start phase execution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Strategic Implementation Dashboard</h1>
          <p className="text-muted-foreground">
            Track progress across all 5 phases of the MAKU.Travel transformation
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <p className="text-2xl font-bold">{Math.round(totalProgress)}%</p>
          </div>
          <Progress value={totalProgress} className="w-32" />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Phases</p>
                <p className="text-2xl font-bold">
                  {phases.filter(p => p.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Budget Used</p>
                <p className="text-2xl font-bold">
                  ${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold">
                  {phases.reduce((acc, p) => acc + p.metrics.criticalIssues, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">AI Agents Registered</p>
                <p className="text-2xl font-bold">9 / 99+</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activePhase} onValueChange={setActivePhase}>
        <TabsList className="grid w-full grid-cols-5">
          {phases.map((phase) => (
            <TabsTrigger key={phase.id} value={phase.id} className="text-xs">
              Phase {phase.id.slice(-1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {phases.map((phase) => (
          <TabsContent key={phase.id} value={phase.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(phase.status)}
                    <div>
                      <CardTitle>{phase.name}</CardTitle>
                      <CardDescription>
                        {phase.startDate} - {phase.endDate}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(phase.status)}
                    {phase.status === 'not_started' && (
                      <Button 
                        onClick={() => executePhase(phase.id)}
                        disabled={loading}
                        size="sm"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Start Phase
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Progress Overview */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Progress Overview</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Overall Progress</span>
                          <span>{phase.progress}%</span>
                        </div>
                        <Progress value={phase.progress} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tasks</p>
                          <p className="font-medium">
                            {phase.metrics.completedTasks} / {phase.metrics.totalTasks}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p className="font-medium">
                            ${phase.metrics.spent.toLocaleString()} / ${phase.metrics.budget.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Objectives */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Key Objectives</h4>
                    <ul className="space-y-2">
                      {phase.keyObjectives.map((objective, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Critical Tasks */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Critical Tasks</h4>
                    <ul className="space-y-2">
                      {phase.criticalTasks.map((task, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}