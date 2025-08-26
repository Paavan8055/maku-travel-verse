import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Calendar, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationRule {
  type: 'required' | 'date' | 'iata' | 'positive' | 'email' | 'phone' | 'custom';
  message?: string;
  validator?: (value: string) => boolean;
}

interface EnhancedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rules?: ValidationRule[];
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'number';
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
  'aria-label'?: string;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  value,
  onChange,
  rules = [],
  placeholder,
  type = 'text',
  icon,
  className = '',
  disabled = false,
  autoComplete,
  'aria-label': ariaLabel,
}) => {
  const [touched, setTouched] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);

  const validateValue = React.useCallback((val: string): string[] => {
    const validationErrors: string[] = [];

    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (!val.trim()) {
            validationErrors.push(rule.message || `${label} is required`);
          }
          break;
        
        case 'date':
          if (val && !isValidDate(val)) {
            validationErrors.push(rule.message || 'Please enter a valid date');
          }
          break;
        
        case 'iata':
          if (val && !isValidIATA(val)) {
            validationErrors.push(rule.message || 'Please enter a valid airport or city code (e.g., SYD, NYC)');
          }
          break;
        
        case 'positive':
          if (val && (isNaN(Number(val)) || Number(val) <= 0)) {
            validationErrors.push(rule.message || 'Please enter a positive number');
          }
          break;
        
        case 'email':
          if (val && !isValidEmail(val)) {
            validationErrors.push(rule.message || 'Please enter a valid email address');
          }
          break;
        
        case 'phone':
          if (val && !isValidPhone(val)) {
            validationErrors.push(rule.message || 'Please enter a valid phone number');
          }
          break;
        
        case 'custom':
          if (rule.validator && val && !rule.validator(val)) {
            validationErrors.push(rule.message || 'Invalid value');
          }
          break;
      }
    }

    return validationErrors;
  }, [rules, label]);

  React.useEffect(() => {
    if (touched) {
      setErrors(validateValue(value));
    }
  }, [value, touched, validateValue]);

  const handleBlur = () => {
    setTouched(true);
    setErrors(validateValue(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const isValid = touched && errors.length === 0 && value.trim() !== '';
  const hasErrors = touched && errors.length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={label.toLowerCase().replace(/\s+/g, '-')}
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {rules.some(rule => rule.type === 'required') && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </Label>
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <Input
          id={label.toLowerCase().replace(/\s+/g, '-')}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-label={ariaLabel || label}
          aria-invalid={hasErrors}
          aria-describedby={hasErrors ? `${label}-error` : undefined}
          className={cn(
            icon && "pl-10",
            hasErrors && "border-red-500 focus:border-red-500 focus:ring-red-500",
            isValid && "border-green-500 focus:border-green-500 focus:ring-green-500",
            "transition-colors duration-200"
          )}
        />
        
        {/* Validation icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isValid && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {hasErrors && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>
      
      {/* Error messages */}
      {hasErrors && (
        <div id={`${label}-error`} className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          ))}
        </div>
      )}
      
      {/* Success message */}
      {isValid && (
        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Valid {label.toLowerCase()}
        </p>
      )}
    </div>
  );
};

// Validation helper functions
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date > new Date();
}

function isValidIATA(code: string): boolean {
  // IATA codes are 3 letters for airports or cities
  return /^[A-Z]{3}$/i.test(code.trim());
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // Basic phone validation - adjust regex based on requirements
  return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Pre-configured input components for common travel use cases
export const DateInput: React.FC<Omit<EnhancedInputProps, 'rules' | 'icon' | 'type'>> = (props) => (
  <EnhancedInput
    {...props}
    type="date"
    icon={<Calendar className="h-4 w-4" />}
    rules={[{ type: 'required' }, { type: 'date' }]}
  />
);

export const LocationInput: React.FC<Omit<EnhancedInputProps, 'rules' | 'icon'>> = (props) => (
  <EnhancedInput
    {...props}
    icon={<MapPin className="h-4 w-4" />}
    rules={[{ type: 'required' }, { type: 'iata' }]}
    placeholder="e.g., SYD, NYC, LON"
  />
);

export const PassengerInput: React.FC<Omit<EnhancedInputProps, 'rules' | 'icon' | 'type'>> = (props) => (
  <EnhancedInput
    {...props}
    type="number"
    icon={<Users className="h-4 w-4" />}
    rules={[{ type: 'required' }, { type: 'positive' }]}
    placeholder="1"
  />
);