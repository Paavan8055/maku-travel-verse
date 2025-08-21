import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'url';
  required?: boolean;
  placeholder?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

interface AccessibleFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  submitButtonText?: string;
  className?: string;
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  fields,
  onSubmit,
  submitButtonText,
  className = '',
}) => {
  const { t } = useTranslation();
  const { announce, generateId } = useAccessibility();
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateField = (field: FormField, value: string): string | null => {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    if (field.minLength && value.length < field.minLength) {
      return `${field.label} must be at least ${field.minLength} characters`;
    }

    if (field.maxLength && value.length > field.maxLength) {
      return `${field.label} must be no more than ${field.maxLength} characters`;
    }

    if (field.pattern && value) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) {
        return `${field.label} format is invalid`;
      }
    }

    return null;
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const handleFieldBlur = (field: FormField) => {
    const value = formData[field.id] || '';
    const error = validateField(field, value);
    
    if (error) {
      setErrors(prev => ({ ...prev, [field.id]: error }));
      announce(error, 'assertive');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const value = formData[field.id] || '';
      const error = validateField(field, value);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const errorCount = Object.keys(newErrors).length;
      announce(`Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please fix them and try again.`, 'assertive');
      
      // Focus first error field
      const firstErrorField = fields.find(field => newErrors[field.id]);
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField.id);
        element?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setSubmitSuccess(true);
      announce('Form submitted successfully!', 'polite');
    } catch (error) {
      announce('Failed to submit form. Please try again.', 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Form submitted successfully!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {Object.keys(errors).length > 0 && (
        <Alert className="mb-6 border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <div role="alert" aria-live="assertive">
              Please fix the following errors:
              <ul className="mt-2 list-disc list-inside">
                {Object.entries(errors).map(([fieldId, error]) => (
                  <li key={fieldId}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {fields.map((field) => {
          const fieldId = field.id;
          const errorId = `${fieldId}-error`;
          const descriptionId = `${fieldId}-description`;
          const hasError = !!errors[fieldId];

          return (
            <div key={fieldId} className="space-y-2">
              <Label 
                htmlFor={fieldId}
                className={hasError ? 'text-destructive' : ''}
              >
                {field.label}
                {field.required && (
                  <span className="text-destructive ml-1" aria-label={t('accessibility.required')}>
                    *
                  </span>
                )}
              </Label>
              
              <Input
                id={fieldId}
                type={field.type}
                value={formData[fieldId] || ''}
                onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                onBlur={() => handleFieldBlur(field)}
                placeholder={field.placeholder}
                required={field.required}
                minLength={field.minLength}
                maxLength={field.maxLength}
                pattern={field.pattern}
                className={hasError ? 'border-destructive focus-visible:ring-destructive' : ''}
                aria-invalid={hasError}
                aria-describedby={hasError ? errorId : undefined}
              />
              
              {hasError && (
                <p
                  id={errorId}
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {errors[fieldId]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full"
        aria-describedby={isSubmitting ? 'submit-status' : undefined}
      >
        {isSubmitting ? t('common.loading') : (submitButtonText || 'Submit')}
      </Button>
      
      {isSubmitting && (
        <p id="submit-status" className="sr-only" aria-live="polite">
          {t('common.loading')}
        </p>
      )}
    </form>
  );
};