import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Bot, Search, Filter, Play, Pause, Settings, BarChart3, AlertTriangle, CheckCircle, Clock, Zap, Users, Shield, Activity, Eye, Database, FileText } from 'lucide-react';
import { useRealTimeAgentMetrics } from '@/hooks/useRealTimeAgentMetrics';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  category: 'customer' | 'administrative' | 'monitoring';
  description: string;
  status: 'active' | 'inactive' | 'error';
  model: string;
  capabilities: string[];
  taskCount: number;
  successRate: number;
  avgResponseTime: number;
  lastActivity: string;
}

const AGENT_DEFINITIONS: Agent[] = [
  // Customer Agents (24)
  { id: 'family-travel-planner', name: 'Family Travel Planner', category: 'customer', description: 'Plans family-friendly trips with kids activities', status: 'active', model: 'gpt-4.1', capabilities: ['trip-planning', 'family-activities', 'budget-optimization'], taskCount: 245, successRate: 94, avgResponseTime: 1200, lastActivity: '2 min ago' },
  { id: 'solo-adventure-planner', name: 'Solo Adventure Planner', category: 'customer', description: 'Specialized in solo travel planning', status: 'active', model: 'gpt-4.1', capabilities: ['solo-planning', 'safety-tips', 'local-culture'], taskCount: 189, successRate: 96, avgResponseTime: 980, lastActivity: '5 min ago' },
  { id: 'pet-travel-specialist', name: 'Pet Travel Specialist', category: 'customer', description: 'Pet-friendly travel arrangements', status: 'active', model: 'gpt-4.1', capabilities: ['pet-friendly', 'travel-requirements', 'accommodations'], taskCount: 76, successRate: 98, avgResponseTime: 1100, lastActivity: '1 min ago' },
  { id: 'spiritual-journey-guide', name: 'Spiritual Journey Guide', category: 'customer', description: 'Spiritual and wellness travel planning', status: 'active', model: 'gpt-4.1', capabilities: ['spiritual-sites', 'wellness', 'meditation'], taskCount: 123, successRate: 95, avgResponseTime: 1350, lastActivity: '8 min ago' },
  { id: 'hotel-search-specialist', name: 'Hotel Search Specialist', category: 'customer', description: 'Advanced hotel search and recommendations', status: 'active', model: 'gpt-4o', capabilities: ['hotel-search', 'price-comparison', 'amenities'], taskCount: 567, successRate: 92, avgResponseTime: 850, lastActivity: '1 min ago' },
  { id: 'flight-optimization-agent', name: 'Flight Optimization Agent', category: 'customer', description: 'Flight search and route optimization', status: 'active', model: 'gpt-4o', capabilities: ['flight-search', 'route-optimization', 'price-alerts'], taskCount: 432, successRate: 89, avgResponseTime: 920, lastActivity: '3 min ago' },
  { id: 'activity-curator', name: 'Activity Curator', category: 'customer', description: 'Local activities and experiences finder', status: 'active', model: 'gpt-4o', capabilities: ['activity-search', 'local-experiences', 'bookings'], taskCount: 298, successRate: 91, avgResponseTime: 1050, lastActivity: '4 min ago' },
  { id: 'budget-optimizer', name: 'Budget Optimizer', category: 'customer', description: 'Travel budget analysis and optimization', status: 'active', model: 'gpt-4.1', capabilities: ['budget-analysis', 'cost-optimization', 'deals'], taskCount: 334, successRate: 93, avgResponseTime: 750, lastActivity: '2 min ago' },
  { id: 'itinerary-builder', name: 'Itinerary Builder', category: 'customer', description: 'Comprehensive itinerary creation', status: 'active', model: 'gpt-4.1', capabilities: ['itinerary-creation', 'scheduling', 'logistics'], taskCount: 289, successRate: 94, avgResponseTime: 1400, lastActivity: '6 min ago' },
  { id: 'travel-concierge', name: 'Travel Concierge', category: 'customer', description: '24/7 travel assistance and support', status: 'active', model: 'gpt-4o', capabilities: ['customer-support', 'real-time-help', 'bookings'], taskCount: 612, successRate: 97, avgResponseTime: 650, lastActivity: '30 sec ago' },
  { id: 'visa-requirements-agent', name: 'Visa Requirements Agent', category: 'customer', description: 'Visa and documentation assistance', status: 'active', model: 'gpt-4.1', capabilities: ['visa-info', 'documentation', 'requirements'], taskCount: 156, successRate: 96, avgResponseTime: 1200, lastActivity: '7 min ago' },
  { id: 'weather-advisor', name: 'Weather Advisor', category: 'customer', description: 'Weather-based travel recommendations', status: 'active', model: 'gpt-4o-mini', capabilities: ['weather-analysis', 'seasonal-advice', 'packing'], taskCount: 445, successRate: 88, avgResponseTime: 450, lastActivity: '2 min ago' },
  { id: 'cultural-guide', name: 'Cultural Guide', category: 'customer', description: 'Local culture and customs advisor', status: 'active', model: 'gpt-4.1', capabilities: ['cultural-info', 'etiquette', 'local-customs'], taskCount: 223, successRate: 95, avgResponseTime: 980, lastActivity: '5 min ago' },
  { id: 'accessibility-specialist', name: 'Accessibility Specialist', category: 'customer', description: 'Accessible travel planning', status: 'active', model: 'gpt-4.1', capabilities: ['accessibility', 'special-needs', 'accommodations'], taskCount: 89, successRate: 97, avgResponseTime: 1150, lastActivity: '4 min ago' },
  { id: 'group-travel-coordinator', name: 'Group Travel Coordinator', category: 'customer', description: 'Large group travel management', status: 'active', model: 'gpt-4.1', capabilities: ['group-planning', 'coordination', 'logistics'], taskCount: 134, successRate: 92, avgResponseTime: 1800, lastActivity: '9 min ago' },
  { id: 'business-travel-agent', name: 'Business Travel Agent', category: 'customer', description: 'Corporate travel arrangements', status: 'active', model: 'gpt-4.1', capabilities: ['business-travel', 'expense-management', 'corporate-rates'], taskCount: 267, successRate: 94, avgResponseTime: 890, lastActivity: '3 min ago' },
  { id: 'luxury-travel-specialist', name: 'Luxury Travel Specialist', category: 'customer', description: 'High-end luxury travel experiences', status: 'active', model: 'gpt-4.1', capabilities: ['luxury-travel', 'premium-services', 'exclusive-access'], taskCount: 78, successRate: 98, avgResponseTime: 1650, lastActivity: '6 min ago' },
  { id: 'adventure-sports-guide', name: 'Adventure Sports Guide', category: 'customer', description: 'Adventure and extreme sports travel', status: 'active', model: 'gpt-4.1', capabilities: ['adventure-sports', 'safety-protocols', 'equipment'], taskCount: 145, successRate: 90, avgResponseTime: 1250, lastActivity: '7 min ago' },
  { id: 'food-tourism-expert', name: 'Food Tourism Expert', category: 'customer', description: 'Culinary travel experiences', status: 'active', model: 'gpt-4.1', capabilities: ['food-tourism', 'restaurants', 'cooking-classes'], taskCount: 198, successRate: 93, avgResponseTime: 1100, lastActivity: '4 min ago' },
  { id: 'eco-travel-advocate', name: 'Eco Travel Advocate', category: 'customer', description: 'Sustainable and eco-friendly travel', status: 'active', model: 'gpt-4.1', capabilities: ['eco-travel', 'sustainability', 'carbon-offset'], taskCount: 167, successRate: 95, avgResponseTime: 1050, lastActivity: '8 min ago' },
  { id: 'honeymoon-planner', name: 'Honeymoon Planner', category: 'customer', description: 'Romantic honeymoon experiences', status: 'active', model: 'gpt-4.1', capabilities: ['romantic-travel', 'special-occasions', 'luxury'], taskCount: 112, successRate: 96, avgResponseTime: 1300, lastActivity: '5 min ago' },
  { id: 'senior-travel-specialist', name: 'Senior Travel Specialist', category: 'customer', description: 'Travel planning for seniors', status: 'active', model: 'gpt-4.1', capabilities: ['senior-travel', 'comfort', 'medical-considerations'], taskCount: 89, successRate: 97, avgResponseTime: 1200, lastActivity: '6 min ago' },
  { id: 'last-minute-booker', name: 'Last Minute Booker', category: 'customer', description: 'Urgent and last-minute travel arrangements', status: 'active', model: 'gpt-4o', capabilities: ['urgent-booking', 'availability-check', 'rapid-response'], taskCount: 234, successRate: 85, avgResponseTime: 350, lastActivity: '1 min ago' },
  { id: 'travel-insurance-advisor', name: 'Travel Insurance Advisor', category: 'customer', description: 'Travel insurance recommendations', status: 'active', model: 'gpt-4.1', capabilities: ['insurance-advice', 'coverage-analysis', 'claims'], taskCount: 156, successRate: 94, avgResponseTime: 950, lastActivity: '3 min ago' },

  // Administrative Agents (35)
  { id: 'booking-integrity-manager', name: 'Booking Integrity Manager', category: 'administrative', description: 'Ensures booking data consistency and integrity', status: 'active', model: 'gpt-4.1', capabilities: ['data-validation', 'integrity-checks', 'error-correction'], taskCount: 1234, successRate: 99, avgResponseTime: 450, lastActivity: '30 sec ago' },
  { id: 'payment-processor', name: 'Payment Processor', category: 'administrative', description: 'Handles payment processing and validation', status: 'active', model: 'gpt-4.1', capabilities: ['payment-processing', 'fraud-detection', 'refunds'], taskCount: 789, successRate: 98, avgResponseTime: 320, lastActivity: '45 sec ago' },
  { id: 'provider-sync-manager', name: 'Provider Sync Manager', category: 'administrative', description: 'Synchronizes data with travel providers', status: 'active', model: 'gpt-4o', capabilities: ['api-sync', 'data-mapping', 'error-handling'], taskCount: 2156, successRate: 95, avgResponseTime: 680, lastActivity: '1 min ago' },
  { id: 'email-notification-agent', name: 'Email Notification Agent', category: 'administrative', description: 'Manages automated email communications', status: 'active', model: 'gpt-4o-mini', capabilities: ['email-templates', 'scheduling', 'personalization'], taskCount: 3456, successRate: 97, avgResponseTime: 200, lastActivity: '20 sec ago' },
  { id: 'cache-manager', name: 'Cache Manager', category: 'administrative', description: 'Optimizes data caching and retrieval', status: 'active', model: 'gpt-4o-mini', capabilities: ['cache-optimization', 'ttl-management', 'performance'], taskCount: 5678, successRate: 96, avgResponseTime: 150, lastActivity: '10 sec ago' },
  { id: 'user-profile-manager', name: 'User Profile Manager', category: 'administrative', description: 'Manages user accounts and preferences', status: 'active', model: 'gpt-4.1', capabilities: ['profile-management', 'preferences', 'data-sync'], taskCount: 1567, successRate: 98, avgResponseTime: 380, lastActivity: '2 min ago' },
  { id: 'search-optimizer', name: 'Search Optimizer', category: 'administrative', description: 'Optimizes search queries and results', status: 'active', model: 'gpt-4.1', capabilities: ['query-optimization', 'result-ranking', 'filtering'], taskCount: 2890, successRate: 92, avgResponseTime: 540, lastActivity: '1 min ago' },
  { id: 'pricing-calculator', name: 'Pricing Calculator', category: 'administrative', description: 'Dynamic pricing and commission calculations', status: 'active', model: 'gpt-4.1', capabilities: ['pricing-models', 'commissions', 'discounts'], taskCount: 1789, successRate: 97, avgResponseTime: 420, lastActivity: '3 min ago' },
  { id: 'inventory-tracker', name: 'Inventory Tracker', category: 'administrative', description: 'Tracks availability and inventory levels', status: 'active', model: 'gpt-4o', capabilities: ['inventory-tracking', 'availability', 'real-time-updates'], taskCount: 3245, successRate: 94, avgResponseTime: 380, lastActivity: '2 min ago' },
  { id: 'fraud-detector', name: 'Fraud Detector', category: 'administrative', description: 'Detects and prevents fraudulent activities', status: 'active', model: 'gpt-4.1', capabilities: ['fraud-detection', 'risk-analysis', 'prevention'], taskCount: 456, successRate: 99, avgResponseTime: 290, lastActivity: '4 min ago' },
  { id: 'content-moderator', name: 'Content Moderator', category: 'administrative', description: 'Moderates user-generated content', status: 'active', model: 'gpt-4.1', capabilities: ['content-moderation', 'safety-checks', 'compliance'], taskCount: 678, successRate: 96, avgResponseTime: 510, lastActivity: '5 min ago' },
  { id: 'backup-coordinator', name: 'Backup Coordinator', category: 'administrative', description: 'Manages data backups and recovery', status: 'active', model: 'gpt-4o-mini', capabilities: ['backup-management', 'recovery', 'data-integrity'], taskCount: 234, successRate: 99, avgResponseTime: 120, lastActivity: '15 min ago' },
  { id: 'api-rate-limiter', name: 'API Rate Limiter', category: 'administrative', description: 'Controls API usage and rate limiting', status: 'active', model: 'gpt-4o-mini', capabilities: ['rate-limiting', 'quota-management', 'throttling'], taskCount: 4567, successRate: 98, avgResponseTime: 80, lastActivity: '30 sec ago' },
  { id: 'session-manager', name: 'Session Manager', category: 'administrative', description: 'Manages user sessions and authentication', status: 'active', model: 'gpt-4.1', capabilities: ['session-management', 'auth-tokens', 'security'], taskCount: 2345, successRate: 97, avgResponseTime: 180, lastActivity: '1 min ago' },
  { id: 'database-optimizer', name: 'Database Optimizer', category: 'administrative', description: 'Optimizes database queries and performance', status: 'active', model: 'gpt-4.1', capabilities: ['query-optimization', 'indexing', 'performance'], taskCount: 890, successRate: 95, avgResponseTime: 650, lastActivity: '8 min ago' },
  { id: 'load-balancer', name: 'Load Balancer', category: 'administrative', description: 'Distributes traffic across services', status: 'active', model: 'gpt-4o-mini', capabilities: ['load-balancing', 'traffic-distribution', 'scaling'], taskCount: 1234, successRate: 98, avgResponseTime: 95, lastActivity: '45 sec ago' },
  { id: 'webhook-processor', name: 'Webhook Processor', category: 'administrative', description: 'Processes incoming webhooks from providers', status: 'active', model: 'gpt-4o', capabilities: ['webhook-handling', 'event-processing', 'validation'], taskCount: 567, successRate: 96, avgResponseTime: 340, lastActivity: '2 min ago' },
  { id: 'currency-converter', name: 'Currency Converter', category: 'administrative', description: 'Real-time currency conversion and rates', status: 'active', model: 'gpt-4o-mini', capabilities: ['currency-conversion', 'rate-updates', 'multi-currency'], taskCount: 2345, successRate: 99, avgResponseTime: 120, lastActivity: '1 min ago' },
  { id: 'geo-location-resolver', name: 'Geo Location Resolver', category: 'administrative', description: 'Resolves and validates geographic locations', status: 'active', model: 'gpt-4o', capabilities: ['geocoding', 'location-validation', 'mapping'], taskCount: 1678, successRate: 94, avgResponseTime: 480, lastActivity: '3 min ago' },
  { id: 'time-zone-coordinator', name: 'Time Zone Coordinator', category: 'administrative', description: 'Manages time zone calculations and conversions', status: 'active', model: 'gpt-4o-mini', capabilities: ['timezone-conversion', 'scheduling', 'localization'], taskCount: 3456, successRate: 98, avgResponseTime: 140, lastActivity: '2 min ago' },
  { id: 'translation-service', name: 'Translation Service', category: 'administrative', description: 'Multi-language translation and localization', status: 'active', model: 'gpt-4.1', capabilities: ['translation', 'localization', 'language-detection'], taskCount: 789, successRate: 93, avgResponseTime: 750, lastActivity: '4 min ago' },
  { id: 'compliance-checker', name: 'Compliance Checker', category: 'administrative', description: 'Ensures regulatory compliance', status: 'active', model: 'gpt-4.1', capabilities: ['compliance-checks', 'regulations', 'auditing'], taskCount: 345, successRate: 97, avgResponseTime: 890, lastActivity: '6 min ago' },
  { id: 'data-anonymizer', name: 'Data Anonymizer', category: 'administrative', description: 'Anonymizes sensitive data for analytics', status: 'active', model: 'gpt-4.1', capabilities: ['data-anonymization', 'privacy', 'gdpr-compliance'], taskCount: 234, successRate: 99, avgResponseTime: 420, lastActivity: '10 min ago' },
  { id: 'audit-trail-manager', name: 'Audit Trail Manager', category: 'administrative', description: 'Maintains comprehensive audit logs', status: 'active', model: 'gpt-4o', capabilities: ['audit-logging', 'trail-management', 'compliance'], taskCount: 1567, successRate: 99, avgResponseTime: 280, lastActivity: '5 min ago' },
  { id: 'configuration-manager', name: 'Configuration Manager', category: 'administrative', description: 'Manages system configurations and settings', status: 'active', model: 'gpt-4.1', capabilities: ['config-management', 'settings', 'deployment'], taskCount: 456, successRate: 96, avgResponseTime: 390, lastActivity: '7 min ago' },
  { id: 'notification-router', name: 'Notification Router', category: 'administrative', description: 'Routes notifications through various channels', status: 'active', model: 'gpt-4o', capabilities: ['notification-routing', 'channel-selection', 'delivery'], taskCount: 2345, successRate: 95, avgResponseTime: 220, lastActivity: '2 min ago' },
  { id: 'task-scheduler', name: 'Task Scheduler', category: 'administrative', description: 'Schedules and manages background tasks', status: 'active', model: 'gpt-4o-mini', capabilities: ['task-scheduling', 'cron-jobs', 'automation'], taskCount: 1234, successRate: 97, avgResponseTime: 160, lastActivity: '3 min ago' },
  { id: 'error-reporter', name: 'Error Reporter', category: 'administrative', description: 'Collects and reports system errors', status: 'active', model: 'gpt-4o', capabilities: ['error-reporting', 'diagnostics', 'alerting'], taskCount: 789, successRate: 98, avgResponseTime: 250, lastActivity: '4 min ago' },
  { id: 'performance-analyzer', name: 'Performance Analyzer', category: 'administrative', description: 'Analyzes system performance metrics', status: 'active', model: 'gpt-4.1', capabilities: ['performance-analysis', 'metrics', 'optimization'], taskCount: 567, successRate: 94, avgResponseTime: 650, lastActivity: '6 min ago' },
  { id: 'resource-allocator', name: 'Resource Allocator', category: 'administrative', description: 'Manages resource allocation and scaling', status: 'active', model: 'gpt-4.1', capabilities: ['resource-allocation', 'auto-scaling', 'optimization'], taskCount: 345, successRate: 96, avgResponseTime: 520, lastActivity: '8 min ago' },
  { id: 'integration-coordinator', name: 'Integration Coordinator', category: 'administrative', description: 'Coordinates third-party integrations', status: 'active', model: 'gpt-4.1', capabilities: ['integration-management', 'api-coordination', 'sync'], taskCount: 234, successRate: 93, avgResponseTime: 780, lastActivity: '9 min ago' },
  { id: 'feature-flag-manager', name: 'Feature Flag Manager', category: 'administrative', description: 'Manages feature flags and rollouts', status: 'active', model: 'gpt-4o-mini', capabilities: ['feature-flags', 'rollouts', 'a-b-testing'], taskCount: 456, successRate: 98, avgResponseTime: 180, lastActivity: '5 min ago' },
  { id: 'cleanup-agent', name: 'Cleanup Agent', category: 'administrative', description: 'Performs system cleanup and maintenance', status: 'active', model: 'gpt-4o-mini', capabilities: ['cleanup', 'maintenance', 'optimization'], taskCount: 123, successRate: 99, avgResponseTime: 350, lastActivity: '20 min ago' },
  { id: 'deployment-manager', name: 'Deployment Manager', category: 'administrative', description: 'Manages application deployments', status: 'active', model: 'gpt-4.1', capabilities: ['deployment', 'versioning', 'rollback'], taskCount: 89, successRate: 97, avgResponseTime: 1200, lastActivity: '25 min ago' },
  { id: 'secret-manager', name: 'Secret Manager', category: 'administrative', description: 'Manages API keys and secrets securely', status: 'active', model: 'gpt-4.1', capabilities: ['secret-management', 'key-rotation', 'security'], taskCount: 67, successRate: 99, avgResponseTime: 290, lastActivity: '30 min ago' },

  // Monitoring Agents (15)
  { id: 'system-health-monitor', name: 'System Health Monitor', category: 'monitoring', description: 'Monitors overall system health and performance', status: 'active', model: 'gpt-4.1', capabilities: ['health-monitoring', 'alerts', 'diagnostics'], taskCount: 2345, successRate: 97, avgResponseTime: 180, lastActivity: '30 sec ago' },
  { id: 'api-performance-monitor', name: 'API Performance Monitor', category: 'monitoring', description: 'Tracks API response times and availability', status: 'active', model: 'gpt-4o', capabilities: ['api-monitoring', 'performance-tracking', 'sla-monitoring'], taskCount: 4567, successRate: 95, avgResponseTime: 120, lastActivity: '45 sec ago' },
  { id: 'database-monitor', name: 'Database Monitor', category: 'monitoring', description: 'Monitors database performance and queries', status: 'active', model: 'gpt-4.1', capabilities: ['db-monitoring', 'query-analysis', 'performance'], taskCount: 1234, successRate: 96, avgResponseTime: 340, lastActivity: '1 min ago' },
  { id: 'security-scanner', name: 'Security Scanner', category: 'monitoring', description: 'Scans for security vulnerabilities and threats', status: 'active', model: 'gpt-4.1', capabilities: ['security-scanning', 'vulnerability-detection', 'threat-analysis'], taskCount: 567, successRate: 98, avgResponseTime: 650, lastActivity: '2 min ago' },
  { id: 'traffic-analyzer', name: 'Traffic Analyzer', category: 'monitoring', description: 'Analyzes user traffic patterns and behavior', status: 'active', model: 'gpt-4.1', capabilities: ['traffic-analysis', 'user-behavior', 'patterns'], taskCount: 890, successRate: 94, avgResponseTime: 480, lastActivity: '3 min ago' },
  { id: 'error-tracker', name: 'Error Tracker', category: 'monitoring', description: 'Tracks and categorizes system errors', status: 'active', model: 'gpt-4o', capabilities: ['error-tracking', 'categorization', 'trending'], taskCount: 1567, successRate: 96, avgResponseTime: 220, lastActivity: '1 min ago' },
  { id: 'uptime-monitor', name: 'Uptime Monitor', category: 'monitoring', description: 'Monitors service availability and uptime', status: 'active', model: 'gpt-4o-mini', capabilities: ['uptime-monitoring', 'availability', 'downtime-alerts'], taskCount: 3456, successRate: 99, avgResponseTime: 90, lastActivity: '20 sec ago' },
  { id: 'resource-monitor', name: 'Resource Monitor', category: 'monitoring', description: 'Monitors CPU, memory, and disk usage', status: 'active', model: 'gpt-4o', capabilities: ['resource-monitoring', 'usage-tracking', 'capacity-planning'], taskCount: 2345, successRate: 97, avgResponseTime: 150, lastActivity: '40 sec ago' },
  { id: 'log-analyzer', name: 'Log Analyzer', category: 'monitoring', description: 'Analyzes system logs for patterns and issues', status: 'active', model: 'gpt-4.1', capabilities: ['log-analysis', 'pattern-detection', 'anomaly-detection'], taskCount: 1789, successRate: 93, avgResponseTime: 520, lastActivity: '2 min ago' },
  { id: 'alert-manager', name: 'Alert Manager', category: 'monitoring', description: 'Manages alerts and escalation procedures', status: 'active', model: 'gpt-4.1', capabilities: ['alert-management', 'escalation', 'notification'], taskCount: 678, successRate: 98, avgResponseTime: 180, lastActivity: '1 min ago' },
  { id: 'compliance-monitor', name: 'Compliance Monitor', category: 'monitoring', description: 'Monitors regulatory compliance status', status: 'active', model: 'gpt-4.1', capabilities: ['compliance-monitoring', 'regulatory-checks', 'reporting'], taskCount: 234, successRate: 97, avgResponseTime: 750, lastActivity: '5 min ago' },
  { id: 'cost-analyzer', name: 'Cost Analyzer', category: 'monitoring', description: 'Analyzes operational costs and optimization opportunities', status: 'active', model: 'gpt-4.1', capabilities: ['cost-analysis', 'optimization', 'budgeting'], taskCount: 345, successRate: 95, avgResponseTime: 890, lastActivity: '7 min ago' },
  { id: 'user-experience-monitor', name: 'User Experience Monitor', category: 'monitoring', description: 'Monitors user experience metrics and satisfaction', status: 'active', model: 'gpt-4.1', capabilities: ['ux-monitoring', 'satisfaction-tracking', 'journey-analysis'], taskCount: 456, successRate: 92, avgResponseTime: 620, lastActivity: '4 min ago' },
  { id: 'data-quality-monitor', name: 'Data Quality Monitor', category: 'monitoring', description: 'Monitors data quality and integrity', status: 'active', model: 'gpt-4.1', capabilities: ['data-quality', 'integrity-checks', 'validation'], taskCount: 567, successRate: 96, avgResponseTime: 430, lastActivity: '3 min ago' },
  { id: 'network-monitor', name: 'Network Monitor', category: 'monitoring', description: 'Monitors network connectivity and performance', status: 'active', model: 'gpt-4o', capabilities: ['network-monitoring', 'connectivity', 'latency-tracking'], taskCount: 789, successRate: 98, avgResponseTime: 110, lastActivity: '30 sec ago' }
];

export const AgentManagementDashboard: React.FC = () => {
  const [agents] = useState<Agent[]>(AGENT_DEFINITIONS);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testParams, setTestParams] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const { toast } = useToast();
  const { metrics } = useRealTimeAgentMetrics();

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || agent.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customer': return <Users className="h-4 w-4" />;
      case 'administrative': return <Settings className="h-4 w-4" />;
      case 'monitoring': return <Eye className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const executeAgentTest = async (agentId: string, params: string) => {
    setTestLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agents', {
        body: {
          agent_id: agentId,
          intent: 'test',
          params: JSON.parse(params || '{}')
        }
      });

      if (error) throw error;
      
      setTestResult(data);
      toast({
        title: "Test Completed",
        description: "Agent test executed successfully",
      });
    } catch (error) {
      console.error('Agent test error:', error);
      toast({
        title: "Test Failed",
        description: "Failed to execute agent test",
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
    }
  };

  const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedAgent(agent)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(agent.category)}
            <CardTitle className="text-lg">{agent.name}</CardTitle>
          </div>
          {getStatusBadge(agent.status)}
        </div>
        <p className="text-sm text-muted-foreground">{agent.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Tasks</span>
            <span className="text-sm">{agent.taskCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Success Rate</span>
            <span className="text-sm font-bold text-green-600">{agent.successRate}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Avg Response</span>
            <span className="text-sm">{agent.avgResponseTime}ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Last Activity</span>
            <span className="text-xs text-muted-foreground">{agent.lastActivity}</span>
          </div>
          <Progress value={agent.successRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );

  const categoryStats = {
    customer: agents.filter(a => a.category === 'customer').length,
    administrative: agents.filter(a => a.category === 'administrative').length,
    monitoring: agents.filter(a => a.category === 'monitoring').length,
    total: agents.length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Management Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage all {agents.length} AI agents across your platform</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.total}</div>
            <p className="text-xs text-muted-foreground">All AI agents active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.customer}</div>
            <p className="text-xs text-muted-foreground">User-facing agents</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Agents</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.administrative}</div>
            <p className="text-xs text-muted-foreground">Backend processing</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitor Agents</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.monitoring}</div>
            <p className="text-xs text-muted-foreground">System monitoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="administrative">Administrative</SelectItem>
            <SelectItem value="monitoring">Monitoring</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No agents found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Agent Detail Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAgent && getCategoryIcon(selectedAgent.category)}
              {selectedAgent?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAgent && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 p-1">
                {/* Agent Status and Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedAgent.status)}
                        {getStatusBadge(selectedAgent.status)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Tasks Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedAgent.taskCount.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{selectedAgent.successRate}%</div>
                      <Progress value={selectedAgent.successRate} className="mt-2" />
                    </CardContent>
                  </Card>
                </div>

                {/* Agent Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedAgent.description}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Model</label>
                      <p className="text-sm mt-1">{selectedAgent.model}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <div className="flex items-center gap-2 mt-1">
                        {getCategoryIcon(selectedAgent.category)}
                        <span className="text-sm capitalize">{selectedAgent.category}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Capabilities</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedAgent.capabilities.map((cap) => (
                          <Badge key={cap} variant="outline">{cap}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Average Response Time</label>
                        <p className="text-lg font-bold">{selectedAgent.avgResponseTime}ms</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Activity</label>
                        <p className="text-lg">{selectedAgent.lastActivity}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Testing */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Testing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Test Parameters (JSON)</label>
                      <Input
                        value={testParams}
                        onChange={(e) => setTestParams(e.target.value)}
                        placeholder='{"message": "test query"}'
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => executeAgentTest(selectedAgent.id, testParams)}
                        disabled={testLoading}
                        className="flex-1"
                      >
                        {testLoading ? <LoadingSpinner size="sm" /> : <Play className="h-4 w-4 mr-2" />}
                        Execute Test
                      </Button>
                      <Button variant="outline" onClick={() => setShowTestDialog(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Advanced
                      </Button>
                    </div>
                    {testResult && (
                      <div className="mt-4">
                        <label className="text-sm font-medium">Test Result</label>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(testResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};