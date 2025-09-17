import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Info, Star, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface InformationTier {
  level: 'essential' | 'contextual' | 'detailed';
  content: React.ReactNode;
  priority: number;
  estimatedReadTime?: number;
}

interface ProgressiveInformationDisplayProps {
  title: string;
  essential: React.ReactNode;
  contextual?: React.ReactNode;
  detailed?: React.ReactNode;
  metadata?: {
    rating?: number;
    duration?: string;
    location?: string;
    capacity?: number;
    price?: number;
    currency?: string;
  };
  className?: string;
  onExpand?: (level: 'contextual' | 'detailed') => void;
}

export const ProgressiveInformationDisplay: React.FC<ProgressiveInformationDisplayProps> = ({
  title,
  essential,
  contextual,
  detailed,
  metadata,
  className = '',
  onExpand
}) => {
  const [expandedLevel, setExpandedLevel] = useState<'essential' | 'contextual' | 'detailed'>('essential');
  const [isContextualExpanded, setIsContextualExpanded] = useState(false);
  const [isDetailedExpanded, setIsDetailedExpanded] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Track reading progress for accessibility and UX
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (rect.top < windowHeight && rect.bottom > 0) {
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const progress = (visibleHeight / rect.height) * 100;
        setReadingProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [expandedLevel]);

  const handleExpand = (level: 'contextual' | 'detailed') => {
    if (level === 'contextual') {
      setIsContextualExpanded(!isContextualExpanded);
      if (!isContextualExpanded) {
        setExpandedLevel('contextual');
        onExpand?.('contextual');
      }
    } else {
      setIsDetailedExpanded(!isDetailedExpanded);
      if (!isDetailedExpanded) {
        setExpandedLevel('detailed');
        onExpand?.('detailed');
      }
    }
  };

  const renderMetadataBadges = () => {
    if (!metadata) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-3">
        {metadata.rating && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            {metadata.rating}
          </Badge>
        )}
        {metadata.duration && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {metadata.duration}
          </Badge>
        )}
        {metadata.location && (
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {metadata.location}
          </Badge>
        )}
        {metadata.capacity && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Up to {metadata.capacity}
          </Badge>
        )}
        {metadata.price && (
          <Badge variant="default" className="font-semibold">
            {metadata.currency || '$'}{metadata.price}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardContent className="p-6" ref={contentRef}>
        {/* Reading progress indicator */}
        {readingProgress > 0 && readingProgress < 100 && (
          <div className="w-full h-1 bg-muted rounded-full mb-4 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        )}

        {/* Title and metadata */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          {renderMetadataBadges()}
        </div>

        {/* Essential information - always visible */}
        <div className="mb-4">
          {essential}
        </div>

        {/* Contextual information - expandable */}
        {contextual && (
          <Collapsible open={isContextualExpanded} onOpenChange={() => handleExpand('contextual')}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-0 h-auto font-normal"
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Show more details
                </span>
                {isContextualExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="pl-6 border-l-2 border-muted">
                {contextual}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Detailed information - expandable, only if contextual is expanded */}
        {detailed && isContextualExpanded && (
          <Collapsible 
            open={isDetailedExpanded} 
            onOpenChange={() => handleExpand('detailed')}
            className="mt-4"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-0 h-auto font-normal"
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Full details & specifications
                </span>
                {isDetailedExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="pl-6 border-l-2 border-primary/30">
                {detailed}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Quick actions based on expanded state */}
        {(isContextualExpanded || isDetailedExpanded) && (
          <div className="mt-6 pt-4 border-t border-muted">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Save for Later
              </Button>
              <Button variant="outline" size="sm">
                Share
              </Button>
              <Button variant="outline" size="sm">
                Compare
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Activity-specific implementation
interface ActivityProgressiveDisplayProps {
  activity: {
    id: string;
    title: string;
    description: string;
    longDescription?: string;
    specifications?: string;
    category: string;
    price: number;
    currency: string;
    rating: number;
    duration: string;
    location: string;
    maxParticipants: number;
    difficulty: string;
    highlights?: string[];
    includes?: string[];
    requirements?: string[];
    cancellationPolicy?: string;
    provider?: {
      name: string;
      rating: number;
      verified: boolean;
    };
  };
  className?: string;
}

export const ActivityProgressiveDisplay: React.FC<ActivityProgressiveDisplayProps> = ({
  activity,
  className = ''
}) => {
  const essential = (
    <div>
      <p className="text-muted-foreground mb-3">{activity.description}</p>
      {activity.highlights && activity.highlights.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Highlights</h4>
          <ul className="space-y-1">
            {activity.highlights.slice(0, 3).map((highlight, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                {highlight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const contextual = activity.longDescription || activity.includes ? (
    <div className="space-y-4">
      {activity.longDescription && (
        <div>
          <h4 className="font-medium mb-2">Full Description</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {activity.longDescription}
          </p>
        </div>
      )}
      
      {activity.includes && activity.includes.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">What's Included</h4>
          <ul className="space-y-1">
            {activity.includes.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-green-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {activity.provider && (
        <div>
          <h4 className="font-medium mb-2">Provider</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm">{activity.provider.name}</span>
            {activity.provider.verified && (
              <Badge variant="outline" className="text-xs">Verified</Badge>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-yellow-500" />
              <span className="text-xs">{activity.provider.rating}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;

  const detailed = (
    <div className="space-y-4">
      {activity.specifications && (
        <div>
          <h4 className="font-medium mb-2">Detailed Specifications</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {activity.specifications}
          </p>
        </div>
      )}
      
      {activity.requirements && activity.requirements.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Requirements</h4>
          <ul className="space-y-1">
            {activity.requirements.map((req, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-orange-500">!</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {activity.cancellationPolicy && (
        <div>
          <h4 className="font-medium mb-2">Cancellation Policy</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {activity.cancellationPolicy}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <ProgressiveInformationDisplay
      title={activity.title}
      essential={essential}
      contextual={contextual}
      detailed={detailed}
      metadata={{
        rating: activity.rating,
        duration: activity.duration,
        location: activity.location,
        capacity: activity.maxParticipants,
        price: activity.price,
        currency: activity.currency
      }}
      className={className}
    />
  );
};