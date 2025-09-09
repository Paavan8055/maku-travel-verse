import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUp,
  ArrowDown,
  Zap,
  DollarSign,
  Users,
  Award,
  ChevronRight,
  ExternalLink,
  Download
} from 'lucide-react';

interface AIResponse {
  content: string;
  insights: {
    key_findings: string[];
    metrics: Record<string, any>;
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      impact_score: number;
      implementation_effort: 'easy' | 'moderate' | 'complex';
      roi_estimate: string;
    }>;
    visualizations?: Array<{
      type: 'chart' | 'graph' | 'heatmap' | 'comparison';
      data: any;
      title: string;
    }>;
  };
  conversation_context: string;
  suggested_actions: string[];
}

interface EnhancedResultsDisplayProps {
  response: AIResponse;
  isStreaming?: boolean;
  onApplyRecommendation?: (recommendation: any) => void;
  onExportResults?: () => void;
}

const priorityConfig = {
  critical: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
  high: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: TrendingUp },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: Clock },
  low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle }
};

const effortConfig = {
  easy: { color: 'text-green-600', label: 'Easy Implementation' },
  moderate: { color: 'text-yellow-600', label: 'Moderate Effort' },
  complex: { color: 'text-red-600', label: 'Complex Implementation' }
};

export const EnhancedResultsDisplay: React.FC<EnhancedResultsDisplayProps> = ({
  response,
  isStreaming = false,
  onApplyRecommendation,
  onExportResults
}) => {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);

  const renderMetricsGrid = () => {
    const metrics = response.insights.metrics;
    const metricEntries = Object.entries(metrics).slice(0, 8);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricEntries.map(([key, value]) => {
          const isPercentage = key.includes('rate') || key.includes('percent') || String(value).includes('%');
          const isImprovement = key.includes('improvement') || key.includes('increase');
          const isReduction = key.includes('reduction') || key.includes('decrease');
          
          const icon = isImprovement ? ArrowUp : isReduction ? ArrowDown : BarChart3;
          const iconColor = isImprovement ? 'text-green-600' : isReduction ? 'text-red-600' : 'text-blue-600';
          
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {React.createElement(icon, { className: `h-4 w-4 ${iconColor}` })}
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">
                  {typeof value === 'number' ? 
                    (isPercentage ? `${value.toFixed(1)}%` : value.toLocaleString()) : 
                    String(value)
                  }
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderKeyFindings = () => (
    <div className="space-y-3">
      {response.insights.key_findings.map((finding, index) => (
        <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
          </div>
          <p className="text-sm leading-relaxed">{finding}</p>
        </div>
      ))}
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-4">
      {response.insights.recommendations.map((rec, index) => {
        const config = priorityConfig[rec.priority];
        const effort = effortConfig[rec.implementation_effort];
        const Icon = config.icon;
        const isExpanded = expandedRecommendation === `${index}`;

        return (
          <Card 
            key={index} 
            className={`border-l-4 ${config.border} transition-all hover:shadow-md`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{rec.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rec.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedRecommendation(isExpanded ? null : `${index}`)}
                >
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                  />
                </Button>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Impact Score</span>
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      {rec.impact_score.toFixed(0)}/100
                    </div>
                    <Progress value={rec.impact_score} className="mt-2" />
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className={`h-4 w-4 ${effort.color}`} />
                      <span className="text-sm font-medium">Implementation</span>
                    </div>
                    <div className={`text-sm font-medium ${effort.color}`}>
                      {effort.label}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">ROI Estimate</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {rec.roi_estimate}
                    </div>
                  </div>
                </div>
                
                {onApplyRecommendation && (
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => onApplyRecommendation(rec)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Apply Recommendation
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Learn More
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );

  const renderVisualizations = () => {
    if (!response.insights.visualizations?.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No visualizations available for this analysis</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {response.insights.visualizations.map((viz, index) => {
          const icons = {
            chart: PieChart,
            graph: LineChart,
            heatmap: BarChart3,
            comparison: BarChart3
          };
          const Icon = icons[viz.type] || BarChart3;

          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4" />
                  {viz.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Placeholder for actual chart implementation */}
                <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {viz.type.charAt(0).toUpperCase() + viz.type.slice(1)} Visualization
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Data ready for rendering
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderSuggestedActions = () => (
    <div className="space-y-3">
      {response.suggested_actions.map((action, index) => (
        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <ChevronRight className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm">{action}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with export options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Analysis Results</h3>
            <p className="text-sm text-muted-foreground">
              {isStreaming ? 'Generating insights...' : 'Analysis complete'}
            </p>
          </div>
        </div>
        {onExportResults && (
          <Button variant="outline" size="sm" onClick={onExportResults}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        )}
      </div>

      {/* Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderMetricsGrid()}
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="findings" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="visualizations">Charts</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="findings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Findings</CardTitle>
            </CardHeader>
            <CardContent>
              {renderKeyFindings()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Prioritized Recommendations</h4>
              <Badge variant="secondary">
                {response.insights.recommendations.length} recommendations
              </Badge>
            </div>
            {renderRecommendations()}
          </div>
        </TabsContent>
        
        <TabsContent value="visualizations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Visualizations</CardTitle>
            </CardHeader>
            <CardContent>
              {renderVisualizations()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="actions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Suggested Next Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSuggestedActions()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {response.content}
                  </pre>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};