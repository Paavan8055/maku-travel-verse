import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  Brain, 
  Zap, 
  Globe, 
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Star,
  CheckCircle,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'ai' | 'platform' | 'mobile' | 'partners' | 'sustainability';
  quarter: string;
  progress: number;
  status: 'planned' | 'in-progress' | 'completed' | 'beta';
  votes: number;
  impact: 'high' | 'medium' | 'low';
  partnerBenefit: string;
}

const roadmapData: RoadmapItem[] = [
  {
    id: '1',
    title: 'Core Booking Platform',
    description: 'Essential booking functionality for hotels and flights with real-time inventory from Amadeus and Hotelbeds.',
    category: 'platform',
    quarter: 'Q4 2025',
    progress: 65,
    status: 'in-progress',
    votes: 12,
    impact: 'high',
    partnerBenefit: 'Direct booking capability, reduced commission fees'
  },
  {
    id: '2',
    title: 'Partner Onboarding Portal',
    description: 'Self-service portal for hotels and activity providers to join the platform.',
    category: 'platform',
    quarter: 'Q1 2026',
    progress: 20,
    status: 'planned',
    votes: 8,
    impact: 'high',
    partnerBenefit: 'Easy registration, automated contract management'
  },
  {
    id: '3',
    title: 'Traveler Referral Program',
    description: 'Reward system for travelers who share content and refer new users.',
    category: 'partners',
    quarter: 'Q2 2026',
    progress: 10,
    status: 'planned',
    votes: 15,
    impact: 'medium',
    partnerBenefit: 'Organic marketing, increased brand awareness'
  },
  {
    id: '4',
    title: 'Direct Supplier Integration',
    description: 'Connect directly with hotels and activities bypassing traditional OTAs.',
    category: 'platform',
    quarter: 'Q1 2026',
    progress: 30,
    status: 'planned',
    votes: 18,
    impact: 'high',
    partnerBenefit: 'Higher margins, direct customer relationships'
  },
  {
    id: '5',
    title: 'Mobile App Launch',
    description: 'Native mobile application for iOS and Android with core booking features.',
    category: 'mobile',
    quarter: 'Q3 2026',
    progress: 5,
    status: 'planned',
    votes: 22,
    impact: 'high',
    partnerBenefit: 'Increased mobile bookings, better user engagement'
  },
  {
    id: '6',
    title: 'Content Creator Tools',
    description: 'Tools for travel influencers to create and monetize travel content on the platform.',
    category: 'partners',
    quarter: 'Q2 2026',
    progress: 15,
    status: 'planned',
    votes: 11,
    impact: 'medium',
    partnerBenefit: 'User-generated content, authentic marketing'
  }
];

const categoryConfig = {
  platform: { icon: Rocket, color: 'bg-travel-ocean', label: 'Platform' },
  partners: { icon: Users, color: 'bg-travel-forest', label: 'Community' },
  mobile: { icon: Globe, color: 'bg-travel-coral', label: 'Mobile' }
};

const statusConfig = {
  planned: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  'in-progress': { icon: Zap, color: 'text-travel-gold', bg: 'bg-travel-gold/10' }
};

export const InnovationRoadmap: React.FC<{ className?: string }> = ({ className }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({});

  const filteredRoadmap = selectedCategory === 'all' 
    ? roadmapData 
    : roadmapData.filter(item => item.category === selectedCategory);

  const handleVote = (itemId: string, voteType: 'up' | 'down') => {
    setUserVotes(prev => ({
      ...prev,
      [itemId]: prev[itemId] === voteType ? null : voteType
    }));
  };

  const categories = Object.entries(categoryConfig);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6 text-travel-gold" />
            Innovation Roadmap
          </h2>
          <p className="text-muted-foreground">Shape the future of travel technology with us</p>
        </div>
        <Badge className="bg-gradient-to-r from-travel-ocean to-travel-forest text-white">
          Building Together
        </Badge>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="flex items-center gap-2"
        >
          All Features
        </Button>
        {categories.map(([key, config]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(key)}
            className="flex items-center gap-2"
          >
            <config.icon className="h-4 w-4" />
            {config.label}
          </Button>
        ))}
      </div>

      {/* Roadmap Items */}
      <div className="space-y-4">
        {filteredRoadmap.map((item) => {
          const category = categoryConfig[item.category];
          const status = statusConfig[item.status];
          const userVote = userVotes[item.id];

          return (
            <Card key={item.id} className="hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${category.color}/20`}>
                      <category.icon className={`h-5 w-5 text-white`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {item.quarter}
                        </Badge>
                        <Badge className={`text-xs ${status.bg} ${status.color} border-0`}>
                          <status.icon className="h-3 w-3 mr-1" />
                          {item.status.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${
                          item.impact === 'high' ? 'border-green-500 text-green-600' :
                          item.impact === 'medium' ? 'border-yellow-500 text-yellow-600' :
                          'border-gray-500 text-gray-600'
                        }`}>
                          {item.impact} impact
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Voting */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(item.id, 'up')}
                      className={`p-1 h-8 w-8 ${userVote === 'up' ? 'bg-green-100 text-green-600' : ''}`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2">{item.votes}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(item.id, 'down')}
                      className={`p-1 h-8 w-8 ${userVote === 'down' ? 'bg-red-100 text-red-600' : ''}`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Development Progress</span>
                      <span className="font-medium">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                  
                  <div className="p-3 rounded-lg bg-gradient-to-r from-travel-gold/10 to-travel-sunset/10 border border-travel-gold/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-travel-gold" />
                      <span className="text-sm font-medium text-travel-gold">Partner Benefit</span>
                    </div>
                    <p className="text-sm">{item.partnerBenefit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Call to Action */}
      <Card className="mt-6 bg-gradient-to-r from-travel-ocean/5 to-travel-forest/5 border-travel-ocean/20">
        <CardContent className="p-6 text-center">
          <Rocket className="h-12 w-12 text-travel-ocean mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Want to Influence Our Roadmap?</h3>
          <p className="text-muted-foreground mb-4">
            Join our Partner Advisory Board and help prioritize features that matter most to your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="bg-gradient-to-r from-travel-ocean to-travel-forest hover:shadow-floating">
              <Users className="mr-2 h-4 w-4" />
              Join Advisory Board
            </Button>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Request Feature Demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};