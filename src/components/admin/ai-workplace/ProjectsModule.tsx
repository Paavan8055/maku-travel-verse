import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, 
  Calendar,
  Clock, 
  Users, 
  Target, 
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  BarChart3
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string;
  status: string;
  priority: string;
  project_manager_id?: string;
  team_members: any;
  ai_agents: any;
  project_goals: any;
  milestones: any;
  resources: any;
  budget_allocated?: number;
  budget_used: number;
  start_date?: string;
  end_date?: string;
  estimated_completion?: string;
  actual_completion?: string;
  progress_percentage: number;
  risk_assessment: any;
  tags: any;
  created_at: string;
  updated_at: string;
}

interface Agent {
  agent_id: string;
  display_name: string;
  status: string;
}

export function ProjectsModule() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    project_type: 'standard',
    priority: 'medium',
    start_date: '',
    end_date: '',
    budget_allocated: '',
    selected_agents: [] as string[],
    goals: [''],
    milestones: [{ title: '', description: '', due_date: '', completed: false }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, agentsRes] = await Promise.all([
        supabase.from('ai_workplace_projects').select('*').order('created_at', { ascending: false }),
        supabase.from('agent_management').select('agent_id, display_name, status').eq('status', 'active')
      ]);

      if (projectsRes.data) setProjects(projectsRes.data as Project[]);
      if (agentsRes.data) setAgents(agentsRes.data as Agent[]);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_workplace_projects')
        .insert({
          name: newProjectForm.name,
          description: newProjectForm.description,
          project_type: newProjectForm.project_type,
          priority: newProjectForm.priority,
          start_date: newProjectForm.start_date || null,
          end_date: newProjectForm.end_date || null,
          budget_allocated: parseFloat(newProjectForm.budget_allocated) || null,
          ai_agents: newProjectForm.selected_agents,
          project_goals: newProjectForm.goals.filter(g => g.trim()),
          milestones: newProjectForm.milestones.filter(m => m.title.trim()),
          status: 'planning'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Project created successfully');
      setProjects([data as Project, ...projects]);
      setIsCreating(false);
      resetForm();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const resetForm = () => {
    setNewProjectForm({
      name: '',
      description: '',
      project_type: 'standard',
      priority: 'medium',
      start_date: '',
      end_date: '',
      budget_allocated: '',
      selected_agents: [],
      goals: [''],
      milestones: [{ title: '', description: '', due_date: '', completed: false }]
    });
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ai_workplace_projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.map(project => 
        project.id === projectId ? { ...project, status: newStatus } : project
      ));
      toast.success('Project status updated');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const addGoal = () => {
    setNewProjectForm(prev => ({
      ...prev,
      goals: [...prev.goals, '']
    }));
  };

  const updateGoal = (index: number, value: string) => {
    setNewProjectForm(prev => ({
      ...prev,
      goals: prev.goals.map((goal, i) => i === index ? value : goal)
    }));
  };

  const addMilestone = () => {
    setNewProjectForm(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: '', description: '', due_date: '', completed: false }]
    }));
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    setNewProjectForm(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'template': return <Target className="h-4 w-4" />;
      case 'recurring': return <Clock className="h-4 w-4" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
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
          <h2 className="text-3xl font-bold tracking-tight">AI Projects</h2>
          <p className="text-muted-foreground">
            Project planning with AI assistance and resource allocation
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.filter(p => p.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {projects.length > 0 
                ? Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100)
                : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${projects.reduce((acc, p) => acc + (p.budget_allocated || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${projects.reduce((acc, p) => acc + p.budget_used, 0).toLocaleString()} used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.length > 0 
                ? Math.round(projects.reduce((acc, p) => acc + p.progress_percentage, 0) / projects.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getProjectTypeIcon(project.project_type)}
                    {project.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Priority and Type */}
                <div className="flex items-center justify-between">
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                  <span className="text-sm text-muted-foreground capitalize">
                    {project.project_type.replace('_', ' ')}
                  </span>
                </div>

                {/* Progress */}
                {project.progress_percentage > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{project.progress_percentage}%</span>
                    </div>
                    <Progress value={project.progress_percentage} />
                  </div>
                )}

                {/* Timeline */}
                {(project.start_date || project.end_date) && (
                  <div className="space-y-1">
                    {project.start_date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Start: {new Date(project.start_date).toLocaleDateString()}
                      </div>
                    )}
                    {project.end_date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        End: {new Date(project.end_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Budget */}
                {project.budget_allocated && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Budget
                    </span>
                    <span>
                      ${project.budget_used.toLocaleString()} / ${project.budget_allocated.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Agents */}
                {project.ai_agents && Array.isArray(project.ai_agents) && project.ai_agents.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {project.ai_agents.length} agents assigned
                  </div>
                )}

                {/* Goals */}
                {project.project_goals && Array.isArray(project.project_goals) && project.project_goals.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Target className="h-3 w-3" />
                    {project.project_goals.length} goals defined
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {project.status === 'planning' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => updateProjectStatus(project.id, 'active')}
                      className="flex-1"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                  {project.status === 'active' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => updateProjectStatus(project.id, 'completed')}
                        className="flex-1"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => updateProjectStatus(project.id, 'on_hold')}
                      >
                        <Pause className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {project.status === 'on_hold' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => updateProjectStatus(project.id, 'active')}
                      className="flex-1"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Project Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Plan and manage projects with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input
                    value={newProjectForm.name}
                    onChange={(e) => setNewProjectForm(prev => ({...prev, name: e.target.value}))}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <Select
                    value={newProjectForm.project_type}
                    onValueChange={(value) => setNewProjectForm(prev => ({...prev, project_type: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Describe the project objectives and scope"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newProjectForm.priority}
                    onValueChange={(value) => setNewProjectForm(prev => ({...prev, priority: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newProjectForm.start_date}
                    onChange={(e) => setNewProjectForm(prev => ({...prev, start_date: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newProjectForm.end_date}
                    onChange={(e) => setNewProjectForm(prev => ({...prev, end_date: e.target.value}))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Budget Allocated</Label>
                <Input
                  type="number"
                  value={newProjectForm.budget_allocated}
                  onChange={(e) => setNewProjectForm(prev => ({...prev, budget_allocated: e.target.value}))}
                  placeholder="Enter budget amount"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Project Goals</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addGoal}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Goal
                  </Button>
                </div>
                {newProjectForm.goals.map((goal, index) => (
                  <Input
                    key={index}
                    placeholder="Enter project goal"
                    value={goal}
                    onChange={(e) => updateGoal(index, e.target.value)}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Milestones</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Milestone
                  </Button>
                </div>
                {newProjectForm.milestones.map((milestone, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <Input
                      placeholder="Milestone title"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                    />
                    <Textarea
                      placeholder="Milestone description"
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      rows={2}
                    />
                    <Input
                      type="date"
                      placeholder="Due date"
                      value={milestone.due_date}
                      onChange={(e) => updateMilestone(index, 'due_date', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject}>
                  Create Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}