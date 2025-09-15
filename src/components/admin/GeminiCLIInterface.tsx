import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeminiOperation {
  operation: string;
  data: Record<string, any>;
}

const GeminiCLIInterface = () => {
  const [selectedOperation, setSelectedOperation] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const operations = [
    { value: 'generate-destination', label: 'Generate Destination Guide', fields: ['destination'] },
    { value: 'create-itinerary', label: 'Create Itinerary', fields: ['destination', 'days'] },
    { value: 'generate-hotel-desc', label: 'Generate Hotel Description', fields: ['hotelName', 'location'] },
    { value: 'travel-tips', label: 'Travel Tips', fields: ['destination'] },
    { value: 'test-prompt', label: 'Test Custom Prompt', fields: ['prompt'] }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedOperation) {
      toast.error('Please select an operation');
      return;
    }

    const selectedOp = operations.find(op => op.value === selectedOperation);
    const missingFields = selectedOp?.fields.filter(field => !formData[field]) || [];
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      const { data, error } = await supabase.functions.invoke('gemini-cli-operations', {
        body: {
          operation: selectedOperation,
          data: formData
        }
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.content);
        toast.success('Content generated successfully!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error calling Gemini CLI:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const renderFormFields = () => {
    const selectedOp = operations.find(op => op.value === selectedOperation);
    if (!selectedOp) return null;

    return selectedOp.fields.map(field => (
      <div key={field} className="space-y-2">
        <Label htmlFor={field} className="capitalize">
          {field === 'hotelName' ? 'Hotel Name' : 
           field === 'days' ? 'Number of Days' :
           field}
        </Label>
        {field === 'prompt' ? (
          <Textarea
            id={field}
            placeholder={`Enter your custom ${field}...`}
            value={formData[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows={3}
          />
        ) : (
          <Input
            id={field}
            placeholder={`Enter ${field}...`}
            value={formData[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            type={field === 'days' ? 'number' : 'text'}
          />
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Gemini CLI Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operation">Operation</Label>
            <Select value={selectedOperation} onValueChange={setSelectedOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Select an operation..." />
              </SelectTrigger>
              <SelectContent>
                {operations.map(op => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {renderFormFields()}

          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !selectedOperation}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Generated Content</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GeminiCLIInterface;