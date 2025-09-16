import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Rocket, CheckCircle, Clock, Brain, Smartphone } from 'lucide-react';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  quarter: string;
  progress: number;
  priority: 'high' | 'medium' | 'low';
}

const InnovationRoadmap: React.FC = () => {
  const roadmapItems: RoadmapItem[] = [
    {
      id: '1',
      title: 'AI Travel Assistant',
      description: 'Advanced chatbot for personalized recommendations',
      status: 'in-progress',
      quarter: 'Q1 2024',
      progress: 65,
      priority: 'high'
    },
    {
      id: '2', 
      title: 'Mobile Apps',
      description: 'Native iOS and Android applications',
      status: 'planned',
      quarter: 'Q2 2024',
      progress: 15,
      priority: 'high'
    },
    {
      id: '3',
      title: 'AR Previews',
      description: 'Augmented reality destination previews',
      status: 'planned', 
      quarter: 'Q3 2024',
      progress: 5,
      priority: 'medium'
    },
    {
      id: '4',
      title: 'Multi-language Support',
      description: 'Support for 20+ languages',
      status: 'completed',
      quarter: 'Q4 2023', 
      progress: 100,
      priority: 'medium'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Rocket className="h-4 w-4 text-blue-600" />;
      case 'planned': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Rocket className="h-8 w-8" />
          <span>Innovation Roadmap</span>
        </h1>
        <p className="text-muted-foreground">Future features and initiatives</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roadmapItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(item.status)}
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground">{item.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <Badge variant={item.priority === 'high' ? 'default' : 'outline'}>
                  {item.priority} priority
                </Badge>
                <span className="text-muted-foreground">{item.quarter}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InnovationRoadmap;