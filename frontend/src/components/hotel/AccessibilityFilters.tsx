import React from 'react';
import { Accessibility, Ear, Eye, Heart, Navigation, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AccessibilityOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'mobility' | 'hearing' | 'visual' | 'cognitive' | 'other';
}

interface AccessibilityFiltersProps {
  selectedAccessibility: string[];
  onAccessibilityChange: (accessibility: string[]) => void;
  hotelAccessibilityData?: Record<string, boolean>;
  className?: string;
}

const accessibilityOptions: AccessibilityOption[] = [
  // Mobility
  {
    id: 'wheelchair_accessible',
    label: 'Wheelchair Accessible',
    description: 'Entrances, elevators, and rooms designed for wheelchair users',
    icon: <Accessibility className="h-4 w-4" />,
    category: 'mobility'
  },
  {
    id: 'accessible_parking',
    label: 'Accessible Parking',
    description: 'Designated parking spaces near accessible entrances',
    icon: <Car className="h-4 w-4" />,
    category: 'mobility'
  },
  {
    id: 'step_free_access',
    label: 'Step-Free Access',
    description: 'No steps or stairs to navigate main areas',
    icon: <Navigation className="h-4 w-4" />,
    category: 'mobility'
  },
  {
    id: 'accessible_bathroom',
    label: 'Accessible Bathroom',
    description: 'Roll-in showers, grab bars, and accessible fixtures',
    icon: <Accessibility className="h-4 w-4" />,
    category: 'mobility'
  },
  
  // Hearing
  {
    id: 'hearing_accessible',
    label: 'Hearing Accessible',
    description: 'Visual alarms, doorbell lights, and hearing loop systems',
    icon: <Ear className="h-4 w-4" />,
    category: 'hearing'
  },
  {
    id: 'sign_language',
    label: 'Sign Language Support',
    description: 'Staff trained in sign language or video relay services',
    icon: <Ear className="h-4 w-4" />,
    category: 'hearing'
  },
  
  // Visual
  {
    id: 'visual_accessible',
    label: 'Visual Accessible',
    description: 'Braille signage, audio descriptions, and high contrast features',
    icon: <Eye className="h-4 w-4" />,
    category: 'visual'
  },
  {
    id: 'guide_dog_friendly',
    label: 'Guide Dog Friendly',
    description: 'Welcoming to service animals with appropriate facilities',
    icon: <Heart className="h-4 w-4" />,
    category: 'visual'
  },
  
  // Cognitive
  {
    id: 'cognitive_support',
    label: 'Cognitive Support',
    description: 'Clear signage, quiet spaces, and sensory-friendly environments',
    icon: <Heart className="h-4 w-4" />,
    category: 'cognitive'
  }
];

export const AccessibilityFilters: React.FC<AccessibilityFiltersProps> = ({
  selectedAccessibility,
  onAccessibilityChange,
  hotelAccessibilityData,
  className = ""
}) => {
  const handleAccessibilityToggle = (optionId: string) => {
    const newSelection = selectedAccessibility.includes(optionId)
      ? selectedAccessibility.filter(id => id !== optionId)
      : [...selectedAccessibility, optionId];
    
    onAccessibilityChange(newSelection);
  };

  const getAvailableCount = (category: string) => {
    if (!hotelAccessibilityData) return 0;
    return accessibilityOptions
      .filter(opt => opt.category === category)
      .reduce((count, opt) => count + (hotelAccessibilityData[opt.id] ? 1 : 0), 0);
  };

  const categories = [
    { key: 'mobility', label: 'Mobility & Physical', icon: <Accessibility className="h-4 w-4" /> },
    { key: 'hearing', label: 'Hearing', icon: <Ear className="h-4 w-4" /> },
    { key: 'visual', label: 'Visual', icon: <Eye className="h-4 w-4" /> },
    { key: 'cognitive', label: 'Cognitive & Sensory', icon: <Heart className="h-4 w-4" /> }
  ];

  return (
    <Card className={`travel-card ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Accessibility className="h-5 w-5 mr-2" />
          Accessibility Features
        </CardTitle>
        {selectedAccessibility.length > 0 && (
          <Badge variant="secondary" className="w-fit">
            {selectedAccessibility.length} selected
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {categories.map((category, categoryIndex) => {
            const categoryOptions = accessibilityOptions.filter(opt => opt.category === category.key);
            const availableCount = getAvailableCount(category.key);
            
            return (
              <div key={category.key}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {category.icon}
                    <span className="font-medium text-sm">{category.label}</span>
                  </div>
                  {hotelAccessibilityData && (
                    <Badge variant="outline" className="text-xs">
                      {availableCount} available
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3 pl-6">
                  {categoryOptions.map((option) => {
                    const isSelected = selectedAccessibility.includes(option.id);
                    const isAvailable = hotelAccessibilityData?.[option.id] ?? true;
                    
                    return (
                      <div key={option.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={option.id}
                          checked={isSelected}
                          onCheckedChange={() => handleAccessibilityToggle(option.id)}
                          disabled={hotelAccessibilityData && !isAvailable}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={option.id}
                            className={`text-sm font-medium cursor-pointer ${
                              hotelAccessibilityData && !isAvailable 
                                ? 'text-muted-foreground line-through' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {option.icon}
                              <span>{option.label}</span>
                              {hotelAccessibilityData && !isAvailable && (
                                <Badge variant="outline" className="text-xs">
                                  Not available
                                </Badge>
                              )}
                            </div>
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {categoryIndex < categories.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })}
          
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Accessibility information is provided by hotels and may vary. 
              Contact the hotel directly to confirm specific accessibility needs.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};