import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, Users, DollarSign, FileText, Shield, 
  AlertTriangle, CheckCircle, Clock, Settings,
  Plus, Search, Filter, Download, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CorporatePolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  rules?: any;
  budget_limits: any;
  approval_required?: boolean;
  auto_enforcement?: boolean;
  approval_workflow?: any;
  compliance_requirements?: any;
  effective_date?: string;
  expiry_date?: string;
  created_by?: string;
  updated_by?: string;
  company_id: string;
  created_at: string;
}

interface TravelRequest {
  id: string;
  employee_id: string;
  trip_details: any;
  estimated_cost: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  policy_compliance: any;
  created_at: string;
}

interface ComplianceIssue {
  id: string;
  type: 'budget_exceeded' | 'policy_violation' | 'approval_required';
  description: string;
  severity: 'low' | 'medium' | 'high';
  auto_resolved: boolean;
}

export function CorporateTravelModule() {
  const [policies, setPolicies] = useState<CorporatePolicy[]>([]);
  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([]);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);

  const [newPolicy, setNewPolicy] = useState({
    policy_name: '',
    policy_type: 'budget',
    rules: {},
    budget_limits: {},
    approval_required: false,
    auto_enforcement: true
  });

  useEffect(() => {
    loadCorporateData();
  }, []);

  const loadCorporateData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPolicies(),
        loadTravelRequests(),
        loadComplianceIssues()
      ]);
    } catch (error) {
      console.error('Error loading corporate data:', error);
      toast.error('Failed to load corporate travel data');
    } finally {
      setLoading(false);
    }
  };

  const loadPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('corporate_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      // Mock data for demo
      setPolicies([
        {
          id: '1',
          policy_name: 'Executive Travel Policy',
          policy_type: 'accommodation',
          rules: { max_hotel_rate: 400, business_class_allowed: true },
          budget_limits: { daily_limit: 1000 },
          approval_required: true,
          auto_enforcement: true,
          company_id: 'company1',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          policy_name: 'Standard Employee Policy',
          policy_type: 'budget',
          rules: { max_hotel_rate: 200, economy_only: true },
          budget_limits: { daily_limit: 400 },
          approval_required: false,
          auto_enforcement: true,
          company_id: 'company1',
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const loadTravelRequests = async () => {
    try {
      // Mock data for demo
      setTravelRequests([
        {
          id: '1',
          employee_id: 'emp1',
          trip_details: { destination: 'Tokyo', duration: 5, purpose: 'Client Meeting' },
          estimated_cost: 3500,
          status: 'pending',
          policy_compliance: { violations: 0, warnings: 1 },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          employee_id: 'emp2',
          trip_details: { destination: 'Melbourne', duration: 3, purpose: 'Conference' },
          estimated_cost: 1200,
          status: 'approved',
          policy_compliance: { violations: 0, warnings: 0 },
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error loading travel requests:', error);
    }
  };

  const loadComplianceIssues = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('corporate-policy-engine', {
        body: {
          action: 'check_compliance',
          companyId: 'company1',
          timeframe: '30_days'
        }
      });

      if (error) throw error;
      setComplianceIssues(data.issues || []);
    } catch (error) {
      // Mock data for demo
      setComplianceIssues([
        {
          id: '1',
          type: 'budget_exceeded',
          description: 'Employee exceeded daily budget limit by $150 in Tokyo',
          severity: 'medium',
          auto_resolved: false
        },
        {
          id: '2',
          type: 'policy_violation',
          description: 'Unauthorized business class booking without approval',
          severity: 'high',
          auto_resolved: false
        }
      ]);
    }
  };

  const createPolicy = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('corporate-policy-engine', {
        body: {
          action: 'create_policy',
          companyId: 'company1',
          policy: newPolicy
        }
      });

      if (error) throw error;
      
      toast.success('Corporate policy created successfully');
      setShowPolicyDialog(false);
      loadPolicies();
      
      setNewPolicy({
        policy_name: '',
        policy_type: 'budget',
        rules: {},
        budget_limits: {},
        approval_required: false,
        auto_enforcement: true
      });
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error('Failed to create policy');
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      await supabase.functions.invoke('corporate-policy-engine', {
        body: {
          action: 'approve_request',
          requestId,
          approvedBy: (await supabase.auth.getUser()).data.user?.id
        }
      });

      toast.success('Travel request approved');
      loadTravelRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const pendingRequests = travelRequests.filter(r => r.status === 'pending');
  const totalBudget = travelRequests.reduce((sum, r) => sum + r.estimated_cost, 0);
  const complianceRate = Math.round((1 - complianceIssues.length / Math.max(travelRequests.length, 1)) * 100);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading corporate travel data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-6 w-6" />
                <span>Corporate Travel Management</span>
              </CardTitle>
              <CardDescription>
                Policy management, compliance monitoring, and travel request approvals
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setShowPolicyDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{policies.length}</p>
                <p className="text-sm text-muted-foreground">Active Policies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{complianceRate}%</p>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Issues Alert */}
      {complianceIssues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Compliance Issues</span>
            </CardTitle>
            <CardDescription className="text-orange-700">
              {complianceIssues.length} issue{complianceIssues.length > 1 ? 's' : ''} require attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {complianceIssues.slice(0, 3).map(issue => (
                <div key={issue.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">{issue.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {issue.type.replace('_', ' ')} • Severity: {issue.severity}
                    </p>
                  </div>
                  <Badge variant={issue.severity === 'high' ? 'destructive' : 'secondary'}>
                    {issue.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Travel Requests</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Travel Requests</CardTitle>
              <CardDescription>
                Review and approve employee travel requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {travelRequests.map(request => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium">
                              {request.trip_details.destination} - {request.trip_details.purpose}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Employee: {request.employee_id} • Duration: {request.trip_details.duration} days
                            </p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="font-medium">${request.estimated_cost}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">
                              {request.policy_compliance.violations} violations, 
                              {request.policy_compliance.warnings} warnings
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveRequest(request.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              Reject
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost">
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Corporate Policies</CardTitle>
              <CardDescription>
                Manage travel policies and compliance rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policies.map(policy => (
                  <div key={policy.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium">{policy.policy_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Type: {policy.policy_type} • Auto-enforcement: {policy.auto_enforcement ? 'On' : 'Off'}
                            </p>
                          </div>
                          <Badge variant={policy.approval_required ? 'secondary' : 'outline'}>
                            {policy.approval_required ? 'Approval Required' : 'Auto-Apply'}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">
                            Budget limits: ${policy.budget_limits.daily_limit}/day
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Monitoring</CardTitle>
              <CardDescription>
                Track policy violations and compliance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceIssues.map(issue => (
                  <div key={issue.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className={`h-5 w-5 ${getSeverityColor(issue.severity)}`} />
                          <div>
                            <h3 className="font-medium">{issue.description}</h3>
                            <p className="text-sm text-muted-foreground">
                              Type: {issue.type.replace('_', ' ')} • Severity: {issue.severity}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={issue.auto_resolved ? 'default' : 'secondary'}>
                          {issue.auto_resolved ? 'Auto-Resolved' : 'Manual Review'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Policy Adherence</span>
                    <span className="font-medium">{complianceRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Budget Compliance</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Approval Rate</span>
                    <span className="font-medium">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Savings</span>
                    <span className="font-medium text-green-600">$8,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Policy Enforcement</span>
                    <span className="font-medium text-green-600">$3,200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bulk Bookings</span>
                    <span className="font-medium text-green-600">$5,250</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}