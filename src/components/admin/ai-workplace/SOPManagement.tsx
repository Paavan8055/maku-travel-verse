import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, 
  FileText, 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  Eye,
  Edit,
  Play,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  Activity
} from 'lucide-react';

interface SOPCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface SOPTemplate {
  id: string;
  name: string;
  description: string;
  category_id: string;
  template_structure: any;
  required_fields: any;
  optional_fields: any;
}

interface StandardOperatingProcedure {
  id: string;
  title: string;
  description: string;
  category_id: string;
  template_id?: string;
  procedure_steps: any;
  prerequisites: any;
  expected_outcomes: any;
  quality_checkpoints: any;
  escalation_rules: any;
  estimated_duration_minutes?: number;
  complexity_level: string;
  status: string;
  tags: any;
  created_at: string;
  updated_at: string;
}

interface SOPExecution {
  id: string;
  sop_id: string;
  executor_type: string;
  executor_id: string;
  execution_status: string;
  current_step: number;
  total_steps: number;
  started_at?: string;
  completed_at?: string;
  actual_duration_minutes?: number;
}

export function SOPManagement() {
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [templates, setTemplates] = useState<SOPTemplate[]>([]);
  const [sops, setSOPs] = useState<StandardOperatingProcedure[]>([]);
  const [executions, setExecutions] = useState<SOPExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSOP, setSelectedSOP] = useState<StandardOperatingProcedure | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New SOP Form State
  const [newSOPForm, setNewSOPForm] = useState({
    title: '',
    description: '',
    category_id: '',
    template_id: '',
    complexity_level: 'medium' as 'simple' | 'medium' | 'complex' | 'expert',
    estimated_duration_minutes: '',
    procedure_steps: [{ step: 1, title: '', description: '', estimated_minutes: 0 }],
    prerequisites: [''],
    expected_outcomes: [''],
    quality_checkpoints: [''],
    tags: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [categoriesRes, templatesRes, sopsRes, executionsRes] = await Promise.all([
        supabase.from('sop_categories').select('*').order('name'),
        supabase.from('sop_templates').select('*').order('name'),
        supabase.from('standard_operating_procedures').select('*').order('created_at', { ascending: false }),
        supabase.from('sop_executions').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data as SOPTemplate[]);
      if (sopsRes.data) setSOPs(sopsRes.data as StandardOperatingProcedure[]);
      if (executionsRes.data) setExecutions(executionsRes.data as SOPExecution[]);
    } catch (error) {
      console.error('Error loading SOP data:', error);
      toast.error('Failed to load SOP data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSOP = async () => {
    try {
      const { data, error } = await supabase
        .from('standard_operating_procedures')
        .insert({
          title: newSOPForm.title,
          description: newSOPForm.description,
          category_id: newSOPForm.category_id || null,
          template_id: newSOPForm.template_id || null,
          procedure_steps: newSOPForm.procedure_steps,
          prerequisites: newSOPForm.prerequisites.filter(p => p.trim()),
          expected_outcomes: newSOPForm.expected_outcomes.filter(o => o.trim()),
          quality_checkpoints: newSOPForm.quality_checkpoints.filter(q => q.trim()),
          complexity_level: newSOPForm.complexity_level,
          estimated_duration_minutes: parseInt(newSOPForm.estimated_duration_minutes) || null,
          tags: newSOPForm.tags.split(',').map(t => t.trim()).filter(t => t),
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('SOP created successfully');
      setSOPs([data as StandardOperatingProcedure, ...sops]);
      setIsCreating(false);
      resetForm();
    } catch (error) {
      console.error('Error creating SOP:', error);
      toast.error('Failed to create SOP');
    }
  };

  const resetForm = () => {
    setNewSOPForm({
      title: '',
      description: '',
      category_id: '',
      template_id: '',
      complexity_level: 'medium',
      estimated_duration_minutes: '',
      procedure_steps: [{ step: 1, title: '', description: '', estimated_minutes: 0 }],
      prerequisites: [''],
      expected_outcomes: [''],
      quality_checkpoints: [''],
      tags: ''
    });
  };

  const addProcedureStep = () => {
    setNewSOPForm(prev => ({
      ...prev,
      procedure_steps: [...prev.procedure_steps, {
        step: prev.procedure_steps.length + 1,
        title: '',
        description: '',
        estimated_minutes: 0
      }]
    }));
  };

  const updateProcedureStep = (index: number, field: string, value: any) => {
    setNewSOPForm(prev => ({
      ...prev,
      procedure_steps: prev.procedure_steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const addArrayField = (field: 'prerequisites' | 'expected_outcomes' | 'quality_checkpoints') => {
    setNewSOPForm(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayField = (field: 'prerequisites' | 'expected_outcomes' | 'quality_checkpoints', index: number, value: string) => {
    setNewSOPForm(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const filteredSOPs = sops.filter(sop => {
    const matchesSearch = sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sop.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || sop.category_id === filterCategory;
    const matchesStatus = filterStatus === 'all' || sop.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'deprecated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SOP Management</h2>
          <p className="text-muted-foreground">
            Create, manage, and execute Standard Operating Procedures
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create SOP
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total SOPs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sops.length}</div>
            <p className="text-xs text-muted-foreground">
              {sops.filter(s => s.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executions Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executions.filter(e => 
                new Date(e.started_at || '').toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {executions.filter(e => e.execution_status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executions.length > 0 
                ? Math.round((executions.filter(e => e.execution_status === 'completed').length / executions.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Last 50 executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              {templates.length} templates available
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sops" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sops">SOPs</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="sops" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SOPs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SOPs Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSOPs.map(sop => (
              <Card key={sop.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{sop.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {sop.description}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(sop.status)}>
                      {sop.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {sop.estimated_duration_minutes ? `${sop.estimated_duration_minutes}m` : 'N/A'}
                      </span>
                      <Badge className={getComplexityColor(sop.complexity_level)}>
                        {sop.complexity_level}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {sop.procedure_steps?.length || 0} steps
                    </div>

                    {sop.tags && sop.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {sop.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {sop.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{sop.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedSOP(sop)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Execute
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>
                Latest SOP execution activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map(execution => (
                  <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        SOP Execution #{execution.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Executor: {execution.executor_type} ({execution.executor_id})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Progress: {execution.current_step}/{execution.total_steps} steps
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={
                        execution.execution_status === 'completed' ? 'bg-green-100 text-green-800' :
                        execution.execution_status === 'failed' ? 'bg-red-100 text-red-800' :
                        execution.execution_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {execution.execution_status}
                      </Badge>
                      {execution.actual_duration_minutes && (
                        <p className="text-xs text-muted-foreground">
                          {execution.actual_duration_minutes}m
                        </p>
                      )}
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
                <CardTitle>Execution Trends</CardTitle>
                <CardDescription>SOP execution performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12" />
                  <span className="ml-2">Analytics visualization coming soon</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Success rates by SOP category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map(category => {
                    const categorySOPs = sops.filter(s => s.category_id === category.id);
                    const categoryExecutions = executions.filter(e => 
                      categorySOPs.some(s => s.id === e.sop_id)
                    );
                    const successRate = categoryExecutions.length > 0 
                      ? Math.round((categoryExecutions.filter(e => e.execution_status === 'completed').length / categoryExecutions.length) * 100)
                      : 0;

                    return (
                      <div key={category.id} className="flex items-center justify-between">
                        <span className="text-sm">{category.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">
                            {successRate}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Required fields:</strong> {template.required_fields.length}
                    </p>
                    <p className="text-sm">
                      <strong>Optional fields:</strong> {template.optional_fields.length}
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create SOP Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New SOP</CardTitle>
              <CardDescription>
                Define a new Standard Operating Procedure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newSOPForm.title}
                    onChange={(e) => setNewSOPForm(prev => ({...prev, title: e.target.value}))}
                    placeholder="Enter SOP title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newSOPForm.category_id}
                    onValueChange={(value) => setNewSOPForm(prev => ({...prev, category_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newSOPForm.description}
                  onChange={(e) => setNewSOPForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Describe what this SOP covers"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Complexity Level</Label>
                  <Select
                    value={newSOPForm.complexity_level}
                    onValueChange={(value: any) => setNewSOPForm(prev => ({...prev, complexity_level: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={newSOPForm.estimated_duration_minutes}
                    onChange={(e) => setNewSOPForm(prev => ({...prev, estimated_duration_minutes: e.target.value}))}
                    placeholder="e.g., 60"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Procedure Steps</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addProcedureStep}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Step
                  </Button>
                </div>
                {newSOPForm.procedure_steps.map((step, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Step {step.step}</span>
                    </div>
                    <Input
                      placeholder="Step title"
                      value={step.title}
                      onChange={(e) => updateProcedureStep(index, 'title', e.target.value)}
                    />
                    <Textarea
                      placeholder="Step description"
                      value={step.description}
                      onChange={(e) => updateProcedureStep(index, 'description', e.target.value)}
                      rows={2}
                    />
                    <Input
                      type="number"
                      placeholder="Estimated minutes"
                      value={step.estimated_minutes}
                      onChange={(e) => updateProcedureStep(index, 'estimated_minutes', parseInt(e.target.value) || 0)}
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Prerequisites</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayField('prerequisites')}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {newSOPForm.prerequisites.map((prereq, index) => (
                    <Input
                      key={index}
                      placeholder="Enter prerequisite"
                      value={prereq}
                      onChange={(e) => updateArrayField('prerequisites', index, e.target.value)}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Expected Outcomes</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayField('expected_outcomes')}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {newSOPForm.expected_outcomes.map((outcome, index) => (
                    <Input
                      key={index}
                      placeholder="Enter expected outcome"
                      value={outcome}
                      onChange={(e) => updateArrayField('expected_outcomes', index, e.target.value)}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Quality Checkpoints</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => addArrayField('quality_checkpoints')}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {newSOPForm.quality_checkpoints.map((checkpoint, index) => (
                    <Input
                      key={index}
                      placeholder="Enter quality checkpoint"
                      value={checkpoint}
                      onChange={(e) => updateArrayField('quality_checkpoints', index, e.target.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={newSOPForm.tags}
                  onChange={(e) => setNewSOPForm(prev => ({...prev, tags: e.target.value}))}
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSOP}>
                  Create SOP
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}