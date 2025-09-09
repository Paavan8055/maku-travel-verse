import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Shield, 
  TrendingUp, 
  Settings,
  Clock,
  Zap,
  Target
} from 'lucide-react';

interface AnalysisConfig {
  type: 'performance' | 'revenue' | 'user_behavior' | 'security' | 'predictive' | 'custom';
  timeframe: '1h' | '24h' | '7d' | '30d' | 'custom';
  parameters?: Record<string, any>;
  complexity: 'basic' | 'detailed' | 'comprehensive';
}

interface AnalysisSelectorProps {
  onAnalysisStart: (query: string, config: AnalysisConfig) => void;
  isProcessing: boolean;
}

const analysisTypes = [
  {
    type: 'performance' as const,
    title: 'Performance Analysis',
    description: 'System performance, booking success rates, loading times',
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    examples: [
      'Analyze booking conversion rates over the last 24 hours',
      'Review system performance bottlenecks',
      'Check dashboard loading times and optimization opportunities'
    ]
  },
  {
    type: 'revenue' as const,
    title: 'Revenue Analysis',
    description: 'Revenue optimization, pricing strategies, partner performance',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    examples: [
      'Optimize pricing strategy for peak season',
      'Analyze partner commission and revenue distribution',
      'Review booking value trends and growth opportunities'
    ]
  },
  {
    type: 'user_behavior' as const,
    title: 'User Behavior',
    description: 'User journey analysis, engagement patterns, drop-off points',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    examples: [
      'Analyze user journey from search to booking',
      'Identify common drop-off points in booking flow',
      'Review feature usage and engagement patterns'
    ]
  },
  {
    type: 'security' as const,
    title: 'Security Analysis',
    description: 'Access patterns, anomaly detection, compliance review',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    examples: [
      'Check for unusual access patterns or security anomalies',
      'Review compliance status and security measures',
      'Analyze authentication and authorization patterns'
    ]
  },
  {
    type: 'predictive' as const,
    title: 'Predictive Analytics',
    description: 'Demand forecasting, trend analysis, market intelligence',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    examples: [
      'Forecast booking demand for next quarter',
      'Predict seasonal trends and capacity planning',
      'Analyze market trends and competitive positioning'
    ]
  },
  {
    type: 'custom' as const,
    title: 'Custom Analysis',
    description: 'Flexible analysis based on specific requirements',
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    examples: [
      'Custom query based on specific business requirements',
      'Ad-hoc analysis of particular metrics or patterns',
      'Specialized investigation of specific issues'
    ]
  }
];

const timeframes = [
  { value: '1h', label: '1 Hour', description: 'Last hour activity' },
  { value: '24h', label: '24 Hours', description: 'Past day analysis' },
  { value: '7d', label: '7 Days', description: 'Weekly trends' },
  { value: '30d', label: '30 Days', description: 'Monthly overview' },
];

const complexityLevels = [
  { 
    value: 'basic', 
    label: 'Basic Analysis', 
    description: 'Quick overview with key metrics',
    icon: Zap,
    estimatedTime: '1-2 minutes'
  },
  { 
    value: 'detailed', 
    label: 'Detailed Analysis', 
    description: 'Comprehensive insights with recommendations',
    icon: Target,
    estimatedTime: '3-5 minutes'
  },
  { 
    value: 'comprehensive', 
    label: 'Comprehensive Analysis', 
    description: 'Deep dive with visualizations and action plans',
    icon: BarChart3,
    estimatedTime: '5-10 minutes'
  }
];

export const AnalysisSelector: React.FC<AnalysisSelectorProps> = ({
  onAnalysisStart,
  isProcessing
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('24h');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('detailed');
  const [customQuery, setCustomQuery] = useState('');
  const [showCustomQuery, setShowCustomQuery] = useState(false);

  const handleQuickAnalysis = (type: string, example: string) => {
    const config: AnalysisConfig = {
      type: type as any,
      timeframe: selectedTimeframe as any,
      complexity: selectedComplexity as any,
      parameters: {}
    };
    
    onAnalysisStart(example, config);
  };

  const handleCustomAnalysis = () => {
    if (!customQuery.trim() || !selectedType) return;
    
    const config: AnalysisConfig = {
      type: selectedType as any,
      timeframe: selectedTimeframe as any,
      complexity: selectedComplexity as any,
      parameters: { custom_query: true }
    };
    
    onAnalysisStart(customQuery, config);
  };

  const selectedComplexityInfo = complexityLevels.find(c => c.value === selectedComplexity);
  const selectedTypeInfo = analysisTypes.find(t => t.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Analysis Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Analysis Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex items-center gap-2">
                        <type.icon className={`h-4 w-4 ${type.color}`} />
                        {type.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Timeframe</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {tf.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Complexity</Label>
              <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {complexityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <level.icon className="h-4 w-4" />
                        {level.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedComplexityInfo && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedComplexityInfo.label}</span>
                <Badge variant="secondary">{selectedComplexityInfo.estimatedTime}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedComplexityInfo.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analysisTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.type;
          
          return (
            <Card 
              key={type.type} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedType(type.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${type.bgColor}`}>
                    <Icon className={`h-5 w-5 ${type.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{type.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Quick Examples:
                  </Label>
                  {type.examples.slice(0, 2).map((example, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-auto p-2 text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAnalysis(type.type, example);
                      }}
                      disabled={isProcessing}
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Query Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Custom Analysis Query</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomQuery(!showCustomQuery)}
            >
              {showCustomQuery ? 'Hide' : 'Show'} Custom Query
            </Button>
          </div>
        </CardHeader>
        {showCustomQuery && (
          <CardContent className="space-y-4">
            <div>
              <Label>Custom Analysis Request</Label>
              <Textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Describe your specific analysis requirements in natural language..."
                className="min-h-[100px] mt-2"
              />
            </div>
            <Button
              onClick={handleCustomAnalysis}
              disabled={!customQuery.trim() || !selectedType || isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Start Custom Analysis'}
            </Button>
          </CardContent>
        )}
      </Card>

      {selectedTypeInfo && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <selectedTypeInfo.icon className={`h-5 w-5 ${selectedTypeInfo.color} mt-0.5`} />
              <div>
                <h4 className="font-medium">{selectedTypeInfo.title} - Ready to Analyze</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTypeInfo.description} | {selectedTimeframe.toUpperCase()} timeframe | {selectedComplexity} complexity
                </p>
                <div className="flex gap-2 mt-3">
                  {selectedTypeInfo.examples.map((example, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="secondary"
                      onClick={() => handleQuickAnalysis(selectedTypeInfo.type, example)}
                      disabled={isProcessing}
                      className="text-xs"
                    >
                      {example.slice(0, 30)}...
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};