import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Shield, TrendingUp, HardDrive, Users, Activity } from "lucide-react";
import { useEnhancedAgentSystem } from "@/hooks/useEnhancedAgentSystem";
import { LearningSystem } from "../lib/learning-system";
import { SafetySystem } from "../lib/safety-system";
import { EnhancedMemorySystem } from "../lib/enhanced-memory-system";

const AgenticDashboard: React.FC = () => {
  // Simplified for demo - in production would use actual enhanced system
  const agents = [
    { id: 'trip-planner', name: 'Trip Planner' },
    { id: 'booking-assistant', name: 'Booking Assistant' },
    { id: 'customer-support', name: 'Customer Support' }
  ];
  const isInitializing = false;
  const getSystemMetrics = () => Promise.resolve({});
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [learningInsights, setLearningInsights] = useState<any>(null);
  const [safetyReport, setSafetyReport] = useState<any>(null);
  const [memoryStats, setMemoryStats] = useState<any>(null);

  const learningSystem = new LearningSystem();
  const safetySystem = new SafetySystem();
  const memorySystem = new EnhancedMemorySystem('default-agent', 'demo-user');

  useEffect(() => {
    loadSystemMetrics();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadAgentData(selectedAgent);
    }
  }, [selectedAgent]);

  const loadSystemMetrics = async () => {
    try {
      const systemMetrics = await getSystemMetrics();
      setMetrics(systemMetrics);
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  const loadAgentData = async (agentId: string) => {
    try {
      const [insights, safety, memory] = await Promise.all([
        learningSystem.getLearningInsights(agentId),
        safetySystem.getSafetyReport(agentId),
        Promise.resolve({ totalMemories: 0, memoryTypeBreakdown: {}, averageImportance: 0, recentActivity: 0 })
      ]);

      setLearningInsights(insights);
      setSafetyReport(safety);
      setMemoryStats(memory);
    } catch (error) {
      console.error('Error loading agent data:', error);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Initializing Agentic System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agentic Intelligence Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your AI agent ecosystem</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {agents.length} Active Agents
        </Badge>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <Progress value={98.5} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15.2%</div>
            <p className="text-xs text-muted-foreground">
              Performance improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1GB</div>
            <Progress value={65} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Agent Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Selection</CardTitle>
          <CardDescription>Choose an agent to view detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {agents.map((agent) => (
              <Button
                key={agent.id}
                variant={selectedAgent === agent.id ? "default" : "outline"}
                onClick={() => setSelectedAgent(agent.id)}
                className="justify-start"
              >
                <Brain className="h-4 w-4 mr-2" />
                {agent.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      {selectedAgent && (
        <Tabs defaultValue="learning" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="learning">Learning Analytics</TabsTrigger>
            <TabsTrigger value="safety">Safety Reports</TabsTrigger>
            <TabsTrigger value="memory">Memory Management</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="learning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Insights</CardTitle>
                <CardDescription>AI learning progress and feedback analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {learningInsights ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Average Rating</h4>
                        <div className="text-2xl font-bold text-primary">
                          {learningInsights.insights.averageRating.toFixed(1)}/5.0
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Improvement Trend</h4>
                        <div className={`text-2xl font-bold ${learningInsights.insights.improvementTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {learningInsights.insights.improvementTrend > 0 ? '+' : ''}
                          {learningInsights.insights.improvementTrend.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        {learningInsights.insights.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground">{rec}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Recent Feedback</h4>
                      <div className="space-y-2">
                        {learningInsights.feedback.slice(0, 3).map((feedback: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline">{feedback.feedback_type}</Badge>
                              {feedback.rating && (
                                <span className="text-sm text-muted-foreground">
                                  {feedback.rating}/5 stars
                                </span>
                              )}
                            </div>
                            {feedback.feedback_text && (
                              <p className="text-sm">{feedback.feedback_text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading learning insights...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Safety Report</CardTitle>
                <CardDescription>Security validation and compliance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {safetyReport ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Total Validations</h4>
                        <div className="text-2xl font-bold">{safetyReport.totalValidations}</div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Average Safety Score</h4>
                        <div className="text-2xl font-bold text-green-600">
                          {(safetyReport.averageScore * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Violation Breakdown</h4>
                      <div className="space-y-2">
                        {Object.entries(safetyReport.violationBreakdown).map(([type, count]: [string, any]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Safety Recommendations</h4>
                      <ul className="list-disc pl-6 space-y-1">
                        {safetyReport.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading safety report...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Memory Management</CardTitle>
                <CardDescription>Agent memory usage and optimization</CardDescription>
              </CardHeader>
              <CardContent>
                {memoryStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Total Memories</h4>
                        <div className="text-2xl font-bold">{memoryStats.totalMemories}</div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Recent Activity</h4>
                        <div className="text-2xl font-bold text-blue-600">
                          {memoryStats.recentActivity}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Memory Type Distribution</h4>
                      <div className="space-y-2">
                        {Object.entries(memoryStats.memoryTypeBreakdown).map(([type, count]: [string, any]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{type}</span>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(count / memoryStats.totalMemories) * 100} 
                                className="w-20"
                              />
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Average Importance Score</h4>
                      <Progress value={memoryStats.averageImportance * 100} className="mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {(memoryStats.averageImportance * 100).toFixed(1)}% - 
                        {memoryStats.averageImportance > 0.7 ? ' Excellent' : 
                         memoryStats.averageImportance > 0.5 ? ' Good' : ' Needs Optimization'}
                      </p>
                    </div>

                    <Button 
                      onClick={() => {/* Trigger memory consolidation */}}
                      variant="outline"
                      className="w-full"
                    >
                      <HardDrive className="h-4 w-4 mr-2" />
                      Optimize Memory
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading memory statistics...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Agent execution and efficiency statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">95.2%</div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">1.2s</div>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">847</div>
                      <p className="text-sm text-muted-foreground">Tasks Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">99.1%</div>
                      <p className="text-sm text-muted-foreground">Uptime</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Performance Trends</h4>
                    <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Performance chart visualization would go here</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AgenticDashboard;