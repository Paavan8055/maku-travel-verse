import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Building, 
  Shield, 
  Search,
  Mail,
  CreditCard,
  FileText,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAdminIntegration } from '../context/AdminIntegrationContext';
import { agentTemplates, type AgentTemplate } from '../constants/agentTemplates';

// Using imported templates from constants

const AdminTaskAssistant: React.FC = () => {
  const { state } = useAdminIntegration();
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = agentTemplates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'booking':
        return <Building className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'communication':
        return <Mail className="h-4 w-4" />;
      case 'financial':
        return <CreditCard className="h-4 w-4" />;
      case 'operational':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const generateContent = () => {
    if (!selectedTemplate) return;

    let content = selectedTemplate.template;
    Object.entries(formData).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    setGeneratedContent(content);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(selectedTemplate.category)}
                <CardTitle>{selectedTemplate.title}</CardTitle>
                <Badge variant={selectedTemplate.difficulty === 'easy' ? 'secondary' : selectedTemplate.difficulty === 'medium' ? 'outline' : 'destructive'}>
                  {selectedTemplate.difficulty}
                </Badge>
              </div>
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Back to Templates
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{selectedTemplate.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {selectedTemplate.estimatedTime}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Fill in the Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTemplate.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      rows={3}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    />
                  )}
                </div>
              ))}
              <Button onClick={generateContent} className="w-full">
                Generate Response
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Response</CardTitle>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-4">
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button onClick={copyToClipboard} variant="outline">
                      Copy to Clipboard
                    </Button>
                    <Button>
                      Send Email
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Fill in the details and click "Generate Response" to create your message.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Administrative Task Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search task templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="user">User Management</TabsTrigger>
          <TabsTrigger value="booking">Booking Support</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
        </TabsList>

        {['all', 'user', 'booking', 'security', 'financial', 'operational'].map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates
                .filter(template => category === 'all' || template.category === category)
                .map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                        </div>
                        <Badge variant={template.difficulty === 'easy' ? 'secondary' : template.difficulty === 'medium' ? 'outline' : 'destructive'}>
                          {template.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {template.estimatedTime}
                        </div>
                        <Button size="sm" onClick={() => setSelectedTemplate(template)}>
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminTaskAssistant;