import React from 'react';
import { MasterBotControlCenter } from '@/components/admin/MasterBotControlCenter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity, Users, MessageSquare } from 'lucide-react';

export default function MasterBotPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Bot Control</h1>
          <p className="text-muted-foreground">
            Centralized AI system management and orchestration
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Enhanced AI Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Systems
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Active AI systems</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">System health</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2k</div>
            <p className="text-xs text-muted-foreground">Current interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847</div>
            <p className="text-xs text-muted-foreground">Today's conversations</p>
          </CardContent>
        </Card>
      </div>

      <MasterBotControlCenter />
      
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Conversational AI Infrastructure</CardTitle>
          <CardDescription>
            Advanced AI infrastructure with voice capabilities, intelligent routing between OpenAI and Dialogflow CX, and cross-dashboard analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The enhanced infrastructure includes conversational routing, voice interaction capabilities, 
            rich response rendering, and seamless integration between multiple AI systems for optimal user experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}