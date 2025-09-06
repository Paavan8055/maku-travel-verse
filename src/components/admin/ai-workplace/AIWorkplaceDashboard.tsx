import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Brain, Plus, Search, Filter, Zap, UserPlus, 
  TrendingUp, Clock, CheckCircle, AlertCircle, Star,
  Building, Briefcase, GraduationCap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SkillBuilder } from './SkillBuilder';
import { EmployeeCreationWizard } from './EmployeeCreationWizard';
import { SOPManagement } from './SOPManagement';
import { TasksModule } from './TasksModule';
import { ProjectsModule } from './ProjectsModule';

interface Employee {
  id: string;
  employee_name: string;
  job_title: string;
  department: string;
  status: string;
  performance_score: number;
  created_at: string;
  assigned_skills: any;
  onboarding_completed: boolean;
}

interface Skill {
  id: string;
  skill_name: string;
  skill_description: string;
  skill_category: string;
  skill_difficulty: string;
  is_template: boolean;
}

export function AIWorkplaceDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEmployeeWizard, setShowEmployeeWizard] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadEmployees(), loadSkills()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load workplace data');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from('ai_employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const formattedEmployees = (data || []).map(emp => ({
      ...emp,
      assigned_skills: Array.isArray(emp.assigned_skills) ? emp.assigned_skills : []
    }));
    
    setEmployees(formattedEmployees);
  };

  const loadSkills = async () => {
    const { data, error } = await supabase
      .from('ai_employee_skills')
      .select('*')
      .eq('is_active', true)
      .order('skill_name', { ascending: true });

    if (error) throw error;
    setSkills(data || []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'training': return 'secondary';
      case 'paused': return 'outline';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'training': return <GraduationCap className="h-4 w-4" />;
      case 'paused': return <Clock className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
  const statuses = [...new Set(employees.map(e => e.status))];

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const trainingEmployees = employees.filter(e => e.status === 'training').length;
  const avgPerformance = employees.length > 0 
    ? employees.reduce((sum, e) => sum + e.performance_score, 0) / employees.length 
    : 0;

  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.skill_category]) {
      acc[skill.skill_category] = [];
    }
    acc[skill.skill_category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading AI Workplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Building className="h-8 w-8" />
            <span>AI Workplace</span>
          </h1>
          <p className="text-muted-foreground">
            Create and manage your AI employee workforce
          </p>
        </div>
        <Button onClick={() => setShowEmployeeWizard(true)} className="flex items-center space-x-2">
          <UserPlus className="h-4 w-4" />
          <span>Create AI Employee</span>
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalEmployees}</p>
                <p className="text-sm text-muted-foreground">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeEmployees}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{trainingEmployees}</p>
                <p className="text-sm text-muted-foreground">In Training</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(avgPerformance)}%</p>
                <p className="text-sm text-muted-foreground">Avg Performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">AI Employees</TabsTrigger>
          <TabsTrigger value="skills">Skills Builder</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Employee Directory</CardTitle>
              <CardDescription>
                Manage your AI workforce and monitor their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 max-w-sm"
                    />
                  </div>
                </div>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredEmployees.map(employee => (
                  <Card key={employee.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {employee.employee_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">{employee.employee_name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.job_title}</p>
                        </div>
                        <Badge variant={getStatusColor(employee.status)} className="flex items-center space-x-1">
                          {getStatusIcon(employee.status)}
                          <span>{employee.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Department:</span>
                          <Badge variant="outline">{employee.department}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Skills:</span>
                          <span>{(Array.isArray(employee.assigned_skills) ? employee.assigned_skills : []).length} assigned</span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Performance:</span>
                            <span className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{employee.performance_score}%</span>
                            </span>
                          </div>
                          <Progress value={employee.performance_score} className="h-2" />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Onboarding:</span>
                          <Badge variant={employee.onboarding_completed ? "default" : "secondary"}>
                            {employee.onboarding_completed ? "Complete" : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredEmployees.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No AI employees found</h3>
                  <p className="text-muted-foreground">
                    {employees.length === 0 
                      ? "Get started by creating your first AI employee" 
                      : "Try adjusting your search or filters"
                    }
                  </p>
                  {employees.length === 0 && (
                    <Button onClick={() => setShowEmployeeWizard(true)} className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create First AI Employee
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <SkillBuilder onSkillCreated={loadSkills} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skills Overview</CardTitle>
                <CardDescription>
                  Available skills by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                    <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium capitalize">
                          {category.replace('_', ' ')} Skills
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {categorySkills.length} skills available
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <Badge variant="outline">{categorySkills.length}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>
                  AI employees by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map(dept => {
                    const count = employees.filter(e => e.department === dept).length;
                    const percentage = totalEmployees > 0 ? (count / totalEmployees) * 100 : 0;
                    
                    return (
                      <div key={dept} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{dept}</span>
                          <span>{count} employees</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <EmployeeCreationWizard
        isOpen={showEmployeeWizard}
        onClose={() => setShowEmployeeWizard(false)}
        onEmployeeCreated={(employee) => {
          loadEmployees();
          toast.success(`${employee.employee_name} has been created and is starting onboarding!`);
        }}
      />
    </div>
  );
}