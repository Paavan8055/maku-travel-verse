import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, ArrowLeft, User, Brain, Settings, Sparkles, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Skill {
  id: string;
  skill_name: string;
  skill_description: string;
  skill_category: string;
  skill_difficulty: string;
}

interface Template {
  id: string;
  template_name: string;
  template_description: string;
  job_role: string;
  department: string;
  required_skills: any;
  default_configuration: any;
}

interface Employee {
  id: string;
  employee_name: string;
  job_title: string;
  department: string;
  status: string;
  performance_score: number;
}

interface EmployeeCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeCreated?: (employee: Employee) => void;
}

export function EmployeeCreationWizard({ isOpen, onClose, onEmployeeCreated }: EmployeeCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [formData, setFormData] = useState({
    // Step 1: Job Description
    jobDescription: '',
    jobTitle: '',
    department: '',
    
    // Step 2: Template Selection
    selectedTemplate: '',
    
    // Step 3: Skills
    selectedSkills: [] as string[],
    
    // Step 4: Personality
    employeeName: '',
    personalityTraits: {
      communication_style: 'professional',
      formality_level: 'balanced',
      creativity_level: 'moderate',
      problem_solving_approach: 'methodical'
    },
    
    // Step 5: Configuration
    configuration: {
      response_time: 'immediate',
      availability: '24/7',
      escalation_threshold: 'complex_issues',
      approval_required: false
    }
  });

  const totalSteps = 5;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const communicationStyles = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' }
  ];

  const departments = [
    'Customer Service', 'Marketing', 'Sales', 'Engineering', 
    'Analytics', 'HR', 'Finance', 'Operations'
  ];

  useEffect(() => {
    if (isOpen) {
      loadSkills();
      loadTemplates();
    }
  }, [isOpen]);

  const loadSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_employee_skills')
        .select('id, skill_name, skill_description, skill_category, skill_difficulty')
        .eq('is_active', true)
        .order('skill_category', { ascending: true });

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error loading skills:', error);
      toast.error('Failed to load skills');
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_employee_templates')
        .select('*')
        .order('template_name', { ascending: true });

      if (error) throw error;
      
      const formattedTemplates = (data || []).map(template => ({
        ...template,
        required_skills: Array.isArray(template.required_skills) ? template.required_skills : []
      }));
      
      setTemplates(formattedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const analyzeJobDescription = async () => {
    if (!formData.jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    try {
      setLoading(true);
      
      // Simple analysis - in a real implementation, this would use AI
      const description = formData.jobDescription.toLowerCase();
      
      // Extract job title
      let suggestedTitle = '';
      if (description.includes('customer service') || description.includes('support')) {
        suggestedTitle = 'Customer Support Specialist';
      } else if (description.includes('marketing') || description.includes('content')) {
        suggestedTitle = 'Marketing Specialist';
      } else if (description.includes('data') || description.includes('analytics')) {
        suggestedTitle = 'Data Analyst';
      } else if (description.includes('sales')) {
        suggestedTitle = 'Sales Associate';
      } else {
        suggestedTitle = 'AI Assistant';
      }

      // Extract department
      let suggestedDepartment = '';
      if (description.includes('customer') || description.includes('support')) {
        suggestedDepartment = 'Customer Service';
      } else if (description.includes('marketing')) {
        suggestedDepartment = 'Marketing';
      } else if (description.includes('sales')) {
        suggestedDepartment = 'Sales';
      } else if (description.includes('data') || description.includes('analytics')) {
        suggestedDepartment = 'Analytics';
      } else {
        suggestedDepartment = 'Operations';
      }

      setFormData(prev => ({
        ...prev,
        jobTitle: suggestedTitle,
        department: suggestedDepartment
      }));

      // Find matching template
      const matchingTemplate = templates.find(template => 
        template.job_role.toLowerCase().includes(suggestedTitle.toLowerCase()) ||
        template.department?.toLowerCase() === suggestedDepartment.toLowerCase()
      );

      if (matchingTemplate) {
        setFormData(prev => ({
          ...prev,
          selectedTemplate: matchingTemplate.id
        }));
      }

      toast.success('Job description analyzed! Suggested role and template selected.');
      setCurrentStep(2);
    } catch (error) {
      console.error('Error analyzing job description:', error);
      toast.error('Failed to analyze job description');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        selectedTemplate: templateId,
        selectedSkills: template.required_skills || [],
        configuration: { ...prev.configuration, ...template.default_configuration }
      }));
    }
  };

  const toggleSkill = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skillId)
        ? prev.selectedSkills.filter(id => id !== skillId)
        : [...prev.selectedSkills, skillId]
    }));
  };

  const createEmployee = async () => {
    try {
      if (!formData.employeeName || !formData.jobTitle) {
        toast.error('Employee name and job title are required');
        return;
      }

      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      
      const employeeData = {
        employee_name: formData.employeeName,
        employee_description: `AI employee created from: ${formData.jobDescription}`,
        job_title: formData.jobTitle,
        department: formData.department,
        template_id: formData.selectedTemplate || null,
        assigned_skills: formData.selectedSkills,
        custom_configuration: formData.configuration,
        personality_profile: formData.personalityTraits,
        status: 'training',
        onboarding_completed: false,
        performance_score: 0,
        created_by: userData.user?.id || ''
      };

      const { data, error } = await supabase
        .from('ai_employees')
        .insert(employeeData)
        .select()
        .single();

      if (error) throw error;

      // Create training records for assigned skills
      if (formData.selectedSkills.length > 0) {
        const trainingRecords = formData.selectedSkills.map(skillId => ({
          employee_id: data.id,
          skill_id: skillId,
          training_status: 'pending',
          proficiency_level: 0
        }));

        const { error: trainingError } = await supabase
          .from('ai_employee_training')
          .insert(trainingRecords);

        if (trainingError) {
          console.error('Error creating training records:', trainingError);
        }
      }

      toast.success('AI Employee created successfully!');
      
      if (onEmployeeCreated) {
        onEmployeeCreated(data);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Failed to create AI employee');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      jobDescription: '',
      jobTitle: '',
      department: '',
      selectedTemplate: '',
      selectedSkills: [],
      employeeName: '',
      personalityTraits: {
        communication_style: 'professional',
        formality_level: 'balanced',
        creativity_level: 'moderate',
        problem_solving_approach: 'methodical'
      },
      configuration: {
        response_time: 'immediate',
        availability: '24/7',
        escalation_threshold: 'complex_issues',
        approval_required: false
      }
    });
    onClose();
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.jobDescription.trim() && formData.jobTitle.trim();
      case 2:
        return true; // Template is optional
      case 3:
        return formData.selectedSkills.length > 0;
      case 4:
        return formData.employeeName.trim();
      case 5:
        return true;
      default:
        return true;
    }
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.skill_category]) {
      acc[skill.skill_category] = [];
    }
    acc[skill.skill_category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Create AI Employee</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Describe the Role</span>
                </CardTitle>
                <CardDescription>
                  Describe what you want this AI employee to do, just like you would when posting a job
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jobDescription">Job Description</Label>
                  <Textarea
                    id="jobDescription"
                    value={formData.jobDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                    placeholder="I need an AI employee who can handle customer support tickets, respond to emails with empathy, and escalate complex technical issues..."
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    Be specific about the tasks, tone, and skills needed. Our AI will analyze this and suggest the best setup.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      placeholder="e.g., Customer Support Specialist"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button onClick={analyzeJobDescription} disabled={loading || !formData.jobDescription.trim()}>
                    {loading ? 'Analyzing...' : 'Analyze & Continue'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose a Template (Optional)</CardTitle>
                <CardDescription>
                  Start with a pre-built template or create from scratch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      !formData.selectedTemplate ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, selectedTemplate: '' }))}
                  >
                    <h4 className="font-medium">Start from Scratch</h4>
                    <p className="text-sm text-muted-foreground">Build a completely custom AI employee</p>
                  </div>
                  
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{template.template_name}</h4>
                          <p className="text-sm text-muted-foreground">{template.template_description}</p>
                          <div className="flex space-x-2 mt-2">
                            <Badge variant="outline">{template.job_role}</Badge>
                            {template.department && <Badge variant="outline">{template.department}</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={nextStep}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Skills</CardTitle>
                <CardDescription>
                  Choose the skills your AI employee needs to perform their job
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                    <div key={category}>
                      <h4 className="font-medium mb-3 capitalize">
                        {category.replace('_', ' ')} Skills
                      </h4>
                      <div className="grid gap-3">
                        {categorySkills.map(skill => (
                          <div
                            key={skill.id}
                            className="flex items-center space-x-3 p-3 border rounded-lg"
                          >
                            <Checkbox
                              checked={formData.selectedSkills.includes(skill.id)}
                              onCheckedChange={() => toggleSkill(skill.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h5 className="font-medium">{skill.skill_name}</h5>
                                <Badge variant="outline">{skill.skill_difficulty}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{skill.skill_description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={nextStep} disabled={!canProceed()}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personality & Identity</span>
                </CardTitle>
                <CardDescription>
                  Define your AI employee's name and personality traits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Employee Name</Label>
                  <Input
                    id="employeeName"
                    value={formData.employeeName}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                    placeholder="e.g., Alex, Sarah, or Customer Support Bot"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Communication Style</Label>
                    <Select
                      value={formData.personalityTraits.communication_style}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        personalityTraits: { ...prev.personalityTraits, communication_style: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {communicationStyles.map(style => (
                          <SelectItem key={style.value} value={style.value}>
                            {style.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Formality Level</Label>
                    <Select
                      value={formData.personalityTraits.formality_level}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        personalityTraits: { ...prev.personalityTraits, formality_level: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very_formal">Very Formal</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="very_casual">Very Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Creativity Level</Label>
                    <Select
                      value={formData.personalityTraits.creativity_level}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        personalityTraits: { ...prev.personalityTraits, creativity_level: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="very_creative">Very Creative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Problem Solving</Label>
                    <Select
                      value={formData.personalityTraits.problem_solving_approach}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        personalityTraits: { ...prev.personalityTraits, problem_solving_approach: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="methodical">Methodical</SelectItem>
                        <SelectItem value="analytical">Analytical</SelectItem>
                        <SelectItem value="intuitive">Intuitive</SelectItem>
                        <SelectItem value="collaborative">Collaborative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={nextStep} disabled={!canProceed()}>
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Final Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure operational settings for your AI employee
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Response Time</Label>
                    <Select
                      value={formData.configuration.response_time}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        configuration: { ...prev.configuration, response_time: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="within_minutes">Within Minutes</SelectItem>
                        <SelectItem value="within_hour">Within Hour</SelectItem>
                        <SelectItem value="next_business_day">Next Business Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Availability</Label>
                    <Select
                      value={formData.configuration.availability}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        configuration: { ...prev.configuration, availability: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24/7">24/7</SelectItem>
                        <SelectItem value="business_hours">Business Hours</SelectItem>
                        <SelectItem value="custom_schedule">Custom Schedule</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Escalation Threshold</Label>
                    <Select
                      value={formData.configuration.escalation_threshold}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        configuration: { ...prev.configuration, escalation_threshold: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never Escalate</SelectItem>
                        <SelectItem value="complex_issues">Complex Issues</SelectItem>
                        <SelectItem value="uncertain">When Uncertain</SelectItem>
                        <SelectItem value="always">Always Ask</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.configuration.approval_required}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          configuration: { ...prev.configuration, approval_required: !!checked }
                        }))}
                      />
                      <span>Require Human Approval</span>
                    </Label>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {formData.employeeName}</p>
                    <p><strong>Role:</strong> {formData.jobTitle}</p>
                    <p><strong>Department:</strong> {formData.department}</p>
                    <p><strong>Skills:</strong> {formData.selectedSkills.length} selected</p>
                    <p><strong>Communication:</strong> {formData.personalityTraits.communication_style}</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={createEmployee} disabled={loading || !canProceed()}>
                    {loading ? 'Creating...' : 'Create AI Employee'}
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}