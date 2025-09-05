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

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: 'user' | 'booking' | 'security' | 'communication';
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  template: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'textarea';
    required: boolean;
    placeholder?: string;
  }>;
}

const taskTemplates: TaskTemplate[] = [
  {
    id: 'password-reset',
    title: 'Password Reset Request',
    description: 'Help a customer reset their password',
    category: 'user',
    estimatedTime: '5 minutes',
    difficulty: 'easy',
    template: 'Hi {customerName},\n\nI understand you need help resetting your password. I\'ve sent a secure reset link to {email}.\n\nPlease check your email and follow the instructions. The link will expire in 24 hours.\n\nIf you don\'t see the email, please check your spam folder.\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true, placeholder: 'John Doe' },
      { name: 'email', label: 'Customer Email', type: 'email', required: true, placeholder: 'customer@example.com' },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true, placeholder: 'Admin Name' }
    ]
  },
  {
    id: 'booking-modification',
    title: 'Booking Modification',
    description: 'Help modify an existing booking',
    category: 'booking',
    estimatedTime: '10 minutes',
    difficulty: 'medium',
    template: 'Hi {customerName},\n\nI\'ve successfully modified your booking {bookingReference}.\n\nChanges made:\n{changes}\n\nNew total: {newTotal}\n\nYou\'ll receive an updated confirmation email shortly.\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
      { name: 'changes', label: 'Changes Made', type: 'textarea', required: true },
      { name: 'newTotal', label: 'New Total Amount', type: 'text', required: true },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },
  {
    id: 'refund-confirmation',
    title: 'Refund Confirmation',
    description: 'Confirm a refund has been processed',
    category: 'booking',
    estimatedTime: '5 minutes',
    difficulty: 'easy',
    template: 'Hi {customerName},\n\nYour refund for booking {bookingReference} has been processed.\n\nRefund amount: {refundAmount}\nProcessing time: 3-5 business days\nRefund method: Original payment method\n\nYou\'ll see the refund in your account within the specified timeframe.\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'bookingReference', label: 'Booking Reference', type: 'text', required: true },
      { name: 'refundAmount', label: 'Refund Amount', type: 'text', required: true },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  },
  {
    id: 'security-alert',
    title: 'Security Alert Response',
    description: 'Respond to a security concern',
    category: 'security',
    estimatedTime: '15 minutes',
    difficulty: 'hard',
    template: 'Hi {customerName},\n\nWe\'ve received your security concern regarding {securityIssue}.\n\nWe take security very seriously. Here\'s what we\'ve done:\n{actionsTaken}\n\nAdditional recommendations:\n{recommendations}\n\nIf you have any other concerns, please don\'t hesitate to contact us.\n\nBest regards,\n{adminName}',
    fields: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'securityIssue', label: 'Security Issue', type: 'textarea', required: true },
      { name: 'actionsTaken', label: 'Actions Taken', type: 'textarea', required: true },
      { name: 'recommendations', label: 'Recommendations', type: 'textarea', required: true },
      { name: 'adminName', label: 'Your Name', type: 'text', required: true }
    ]
  }
];

const AdminTaskAssistant: React.FC = () => {
  const { state } = useAdminIntegration();
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = taskTemplates.filter(template =>
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
        </TabsList>

        {['all', 'user', 'booking', 'security'].map((category) => (
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