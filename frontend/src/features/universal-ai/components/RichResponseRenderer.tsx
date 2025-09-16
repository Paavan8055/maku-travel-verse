import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Clock, 
  DollarSign,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickReply {
  text: string;
  action?: string;
  payload?: any;
}

interface CardData {
  title: string;
  subtitle?: string;
  image?: string;
  description?: string;
  buttons?: Array<{
    text: string;
    action?: string;
    url?: string;
  }>;
  metadata?: Record<string, any>;
}

interface ListItem {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  metadata?: Record<string, any>;
  action?: string;
}

interface RichContent {
  type: 'card' | 'carousel' | 'quick_replies' | 'list' | 'travel_card' | 'booking_summary';
  data: any;
}

interface RichResponseRendererProps {
  richContent: RichContent;
  onAction?: (actionType: string, payload?: any) => void;
  className?: string;
}

export const RichResponseRenderer: React.FC<RichResponseRendererProps> = ({
  richContent,
  onAction,
  className
}) => {
  const handleAction = (actionType: string, payload?: any) => {
    onAction?.(actionType, payload);
  };

  const renderQuickReplies = (data: { title?: string; replies: string[] | QuickReply[] }) => (
    <div className={cn("space-y-3", className)}>
      {data.title && (
        <p className="text-sm text-muted-foreground">{data.title}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {data.replies.map((reply, index) => {
          const replyText = typeof reply === 'string' ? reply : reply.text;
          const replyAction = typeof reply === 'object' ? reply.action : undefined;
          const replyPayload = typeof reply === 'object' ? reply.payload : reply;
          
          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleAction(replyAction || 'quick_reply', replyPayload)}
              className="h-auto py-2 px-3 text-xs rounded-full"
            >
              {replyText}
            </Button>
          );
        })}
      </div>
    </div>
  );

  const renderCard = (data: CardData) => (
    <Card className={cn("max-w-sm", className)}>
      {data.image && (
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img 
            src={data.image} 
            alt={data.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{data.title}</CardTitle>
        {data.subtitle && (
          <p className="text-sm text-muted-foreground">{data.subtitle}</p>
        )}
      </CardHeader>
      {(data.description || data.buttons) && (
        <CardContent className="pt-0 space-y-3">
          {data.description && (
            <p className="text-sm">{data.description}</p>
          )}
          {data.buttons && (
            <div className="flex flex-wrap gap-2">
              {data.buttons.map((button, index) => (
                <Button
                  key={index}
                  variant={index === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (button.url) {
                      window.open(button.url, '_blank');
                    } else {
                      handleAction(button.action || 'button_click', button);
                    }
                  }}
                  className="text-xs"
                >
                  {button.text}
                  {button.url && <ExternalLink className="ml-1 h-3 w-3" />}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );

  const renderTravelCard = (data: {
    type: 'flight' | 'hotel' | 'activity';
    title: string;
    price?: { amount: number; currency: string };
    rating?: { score: number; reviews: number };
    duration?: string;
    location?: string;
    image?: string;
    highlights?: string[];
  }) => (
    <Card className={cn("max-w-md cursor-pointer hover:shadow-lg transition-shadow", className)}>
      <div className="flex">
        {data.image && (
          <div className="w-24 h-24 flex-shrink-0">
            <img 
              src={data.image} 
              alt={data.title}
              className="w-full h-full object-cover rounded-l-lg"
            />
          </div>
        )}
        <CardContent className="flex-1 p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm leading-tight">{data.title}</h4>
              {data.location && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{data.location}</span>
                </div>
              )}
            </div>
            {data.price && (
              <div className="text-right">
                <div className="font-semibold text-sm">
                  {data.price.currency} {data.price.amount}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {data.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {data.duration}
                </div>
              )}
              {data.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{data.rating.score}</span>
                  <span>({data.rating.reviews})</span>
                </div>
              )}
            </div>
            <ChevronRight className="h-3 w-3" />
          </div>
          
          {data.highlights && (
            <div className="flex flex-wrap gap-1">
              {data.highlights.slice(0, 2).map((highlight, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {highlight}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );

  const renderList = (data: { title?: string; items: ListItem[] }) => (
    <div className={cn("space-y-3", className)}>
      {data.title && (
        <h4 className="font-medium">{data.title}</h4>
      )}
      <div className="space-y-2">
        {data.items.map((item, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
            onClick={() => handleAction(item.action || 'list_item_click', item)}
          >
            {item.image && (
              <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.title}</p>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              )}
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderCarousel = (data: { items: CardData[] }) => (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {data.items.map((item, index) => (
          <div key={index} className="flex-shrink-0">
            {renderCard(item)}
          </div>
        ))}
      </div>
    </div>
  );

  switch (richContent.type) {
    case 'quick_replies':
      return renderQuickReplies(richContent.data);
    
    case 'card':
      return renderCard(richContent.data);
    
    case 'travel_card':
      return renderTravelCard(richContent.data);
    
    case 'list':
      return renderList(richContent.data);
    
    case 'carousel':
      return renderCarousel(richContent.data);
    
    case 'booking_summary':
      return (
        <Card className={cn("max-w-md", className)}>
          <CardHeader>
            <CardTitle className="text-base">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(richContent.data).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="capitalize">{key.replace('_', ' ')}:</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    
    default:
      return (
        <div className={cn("p-3 bg-muted rounded-lg text-sm", className)}>
          <pre>{JSON.stringify(richContent.data, null, 2)}</pre>
        </div>
      );
  }
};

export default RichResponseRenderer;