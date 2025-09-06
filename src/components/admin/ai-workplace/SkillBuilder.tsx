import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, Copy, Zap, Brain, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Skill {
  id: string;
  skill_name: string;
  skill_description: string;
  skill_category: string;
  natural_language_prompt: string;
  skill_definition: any;
  skill_difficulty: string;
  is_template: boolean;
  is_active: boolean;
  created_by: string;
}

interface SkillBuilderProps {
  onSkillCreated?: (skill: Skill) => void;
}

export function SkillBuilder({ onSkillCreated }: SkillBuilderProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    skill_name: '',
    skill_description: '',
    skill_category: 'general',
    natural_language_prompt: '',
    skill_difficulty: 'beginner',
    example_inputs: [''],
    example_outputs: [''],
    tools: [''],
    parameters: ''
  });

  const categories = [
    'general', 'customer_service', 'marketing', 'analytics', 
    'development', 'sales', 'hr', 'finance', 'operations'
  ];

  const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_employee_skills')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error loading skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      skill_name: '',
      skill_description: '',
      skill_category: 'general',
      natural_language_prompt: '',
      skill_difficulty: 'beginner',
      example_inputs: [''],
      example_outputs: [''],
      tools: [''],
      parameters: ''
    });
    setEditingSkill(null);
    setShowForm(false);
  };

  const handleSaveSkill = async () => {
    try {
      if (!formData.skill_name || !formData.natural_language_prompt) {
        toast.error('Skill name and natural language prompt are required');
        return;
      }

      setLoading(true);
      
      const skillDefinition = {
        tools: formData.tools.filter(tool => tool.trim()),
        example_inputs: formData.example_inputs.filter(input => input.trim()),
        example_outputs: formData.example_outputs.filter(output => output.trim()),
        parameters: formData.parameters ? JSON.parse(formData.parameters) : {}
      };

      const skillData = {
        skill_name: formData.skill_name,
        skill_description: formData.skill_description,
        skill_category: formData.skill_category,
        natural_language_prompt: formData.natural_language_prompt,
        skill_definition: skillDefinition,
        skill_difficulty: formData.skill_difficulty,
        is_template: false,
        is_active: true
      };

      let result;
      if (editingSkill) {
        result = await supabase
          .from('ai_employee_skills')
          .update(skillData)
          .eq('id', editingSkill.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('ai_employee_skills')
          .insert(skillData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success(editingSkill ? 'Skill updated successfully' : 'Skill created successfully');
      await loadSkills();
      resetForm();
      
      if (onSkillCreated && result.data) {
        onSkillCreated(result.data);
      }
    } catch (error) {
      console.error('Error saving skill:', error);
      toast.error('Failed to save skill');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSkill = (skill: Skill) => {
    const definition = skill.skill_definition || {};
    setFormData({
      skill_name: skill.skill_name,
      skill_description: skill.skill_description || '',
      skill_category: skill.skill_category,
      natural_language_prompt: skill.natural_language_prompt,
      skill_difficulty: skill.skill_difficulty,
      example_inputs: definition.example_inputs || [''],
      example_outputs: definition.example_outputs || [''],
      tools: definition.tools || [''],
      parameters: definition.parameters ? JSON.stringify(definition.parameters, null, 2) : ''
    });
    setEditingSkill(skill);
    setShowForm(true);
  };

  const handleDuplicateSkill = (skill: Skill) => {
    const definition = skill.skill_definition || {};
    setFormData({
      skill_name: `${skill.skill_name} (Copy)`,
      skill_description: skill.skill_description || '',
      skill_category: skill.skill_category,
      natural_language_prompt: skill.natural_language_prompt,
      skill_difficulty: skill.skill_difficulty,
      example_inputs: definition.example_inputs || [''],
      example_outputs: definition.example_outputs || [''],
      tools: definition.tools || [''],
      parameters: definition.parameters ? JSON.stringify(definition.parameters, null, 2) : ''
    });
    setEditingSkill(null);
    setShowForm(true);
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      const { error } = await supabase
        .from('ai_employee_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast.success('Skill deleted successfully');
      await loadSkills();
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to delete skill');
    }
  };

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as string[], '']
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span>Natural Language Skill Builder</span>
          </h2>
          <p className="text-muted-foreground">
            Create and manage AI employee skills using natural language descriptions
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create New Skill</span>
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSkill ? 'Edit Skill' : 'Create New Skill'}
            </CardTitle>
            <CardDescription>
              Define a skill using natural language. Describe what the AI should do and how it should behave.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="prompt">Natural Language Prompt</TabsTrigger>
                <TabsTrigger value="examples">Examples & Tools</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill_name">Skill Name</Label>
                    <Input
                      id="skill_name"
                      value={formData.skill_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, skill_name: e.target.value }))}
                      placeholder="e.g., Customer Support Chat"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skill_category">Category</Label>
                    <Select value={formData.skill_category} onValueChange={(value) => setFormData(prev => ({ ...prev, skill_category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skill_description">Description</Label>
                  <Textarea
                    id="skill_description"
                    value={formData.skill_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, skill_description: e.target.value }))}
                    placeholder="Brief description of what this skill does"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skill_difficulty">Difficulty Level</Label>
                  <Select value={formData.skill_difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, skill_difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map(difficulty => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="prompt" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="natural_language_prompt">Natural Language Instruction</Label>
                  <Textarea
                    id="natural_language_prompt"
                    value={formData.natural_language_prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, natural_language_prompt: e.target.value }))}
                    placeholder="Describe exactly how the AI should behave when using this skill. Be specific about tone, approach, and expected outcomes."
                    rows={8}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Write this as if you're instructing a human employee. Be clear about the task, tone, and expected results.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Example Inputs</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Provide sample inputs that this skill might receive
                    </p>
                    {formData.example_inputs.map((input, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <Input
                          value={input}
                          onChange={(e) => updateArrayItem('example_inputs', index, e.target.value)}
                          placeholder="Example input..."
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('example_inputs', index)}
                          disabled={formData.example_inputs.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => addArrayItem('example_inputs')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Example Input
                    </Button>
                  </div>

                  <div>
                    <Label>Example Outputs</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Show what the expected output should look like
                    </p>
                    {formData.example_outputs.map((output, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <Input
                          value={output}
                          onChange={(e) => updateArrayItem('example_outputs', index, e.target.value)}
                          placeholder="Example output..."
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('example_outputs', index)}
                          disabled={formData.example_outputs.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => addArrayItem('example_outputs')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Example Output
                    </Button>
                  </div>

                  <div>
                    <Label>Required Tools/Integrations</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      What tools or external systems does this skill need?
                    </p>
                    {formData.tools.map((tool, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <Input
                          value={tool}
                          onChange={(e) => updateArrayItem('tools', index, e.target.value)}
                          placeholder="e.g., knowledge_base, email_system, CRM"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeArrayItem('tools', index)}
                          disabled={formData.tools.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => addArrayItem('tools')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tool
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parameters">Configuration Parameters (JSON)</Label>
                  <Textarea
                    id="parameters"
                    value={formData.parameters}
                    onChange={(e) => setFormData(prev => ({ ...prev, parameters: e.target.value }))}
                    placeholder='{"max_response_length": 500, "tone": "professional", "include_citations": true}'
                    rows={6}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Optional: Advanced configuration in JSON format
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSaveSkill} disabled={loading}>
                {loading ? 'Saving...' : (editingSkill ? 'Update Skill' : 'Create Skill')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {skills.map(skill => (
          <Card key={skill.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>{skill.skill_name}</span>
                    {skill.is_template && <Badge variant="secondary">Template</Badge>}
                  </CardTitle>
                  <CardDescription>{skill.skill_description}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => handleEditSkill(skill)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDuplicateSkill(skill)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!skill.is_template && (
                    <Button variant="outline" size="icon" onClick={() => handleDeleteSkill(skill.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">{skill.skill_category.replace('_', ' ').toUpperCase()}</Badge>
                  <Badge variant="outline">{skill.skill_difficulty}</Badge>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <Label className="text-sm font-medium">Natural Language Prompt:</Label>
                  <p className="text-sm mt-1">{skill.natural_language_prompt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}