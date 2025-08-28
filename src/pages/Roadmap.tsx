import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Zap, Globe, Brain, Shield } from 'lucide-react';

const Roadmap = () => {
  const roadmapItems = [
    {
      quarter: 'Q1 2025',
      status: 'completed',
      items: [
        {
          title: 'Multi-Provider Integration',
          description: 'Amadeus, Sabre, and HotelBeds API integration',
          icon: <Globe className="w-5 h-5" />,
          status: 'completed'
        },
        {
          title: 'Unified Search Platform',
          description: 'Single search interface for hotels, flights, and activities',
          icon: <Zap className="w-5 h-5" />,
          status: 'completed'
        },
        {
          title: 'Admin Dashboard',
          description: 'Comprehensive admin interface with monitoring',
          icon: <Shield className="w-5 h-5" />,
          status: 'completed'
        }
      ]
    },
    {
      quarter: 'Q2 2025',
      status: 'in-progress',
      items: [
        {
          title: 'AI-Powered Recommendations',
          description: 'Personalized travel suggestions using machine learning',
          icon: <Brain className="w-5 h-5" />,
          status: 'in-progress'
        },
        {
          title: 'Loyalty Program',
          description: 'MAKU Members rewards and tier system',
          icon: <Zap className="w-5 h-5" />,
          status: 'in-progress'
        },
        {
          title: 'Mobile App',
          description: 'Native iOS and Android applications',
          icon: <Globe className="w-5 h-5" />,
          status: 'planned'
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'planned':
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'planned':
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              MAKU.Travel Roadmap
            </h1>
            <p className="text-lg text-muted-foreground">
              Our journey to revolutionize travel booking and planning
            </p>
          </div>

          <div className="space-y-8">
            {roadmapItems.map((quarter) => (
              <Card key={quarter.quarter} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{quarter.quarter}</CardTitle>
                    <Badge className={getStatusColor(quarter.status)}>
                      {quarter.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {quarter.items.map((item, index) => (
                      <div key={index} className="flex flex-col space-y-3 p-4 rounded-lg border bg-background/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {item.icon}
                            <h3 className="font-semibold">{item.title}</h3>
                          </div>
                          {getStatusIcon(item.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap;