import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Star, 
  Clock, 
  Users, 
  MapPin, 
  Calendar,
  CheckCircle,
  X,
  Heart,
  Share2,
  Camera,
  Shield,
  RefreshCw
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export interface ActivityDetailModalProps {
  activity: any | null;
  isOpen: boolean;
  onClose: () => void;
  searchParams?: {
    destination: string;
    date: string;
    participants: number;
  };
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  isOpen,
  onClose,
  searchParams
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!activity) return null;

  const handleBookNow = () => {
    navigate('/booking/activity', { 
      state: { 
        activity, 
        searchParams 
      } 
    });
    onClose();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: activity.name || activity.title,
          text: activity.description,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Activity link has been copied to your clipboard",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: isFavorited 
        ? "Activity removed from your favorites" 
        : "Activity added to your favorites",
    });
  };

  const images = activity.images || activity.photos || activity.pictures || [];
  const currentImage = images[selectedImageIndex] || '/placeholder.svg';

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'challenging': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'adventure': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cultural': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'food & drink': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'nature': return 'bg-green-100 text-green-800 border-green-200';
      case 'sightseeing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'water sports': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header with close button and actions */}
          <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4">
            <DialogTitle className="text-2xl font-bold line-clamp-2 pr-4">
              {activity.name || activity.title}
            </DialogTitle>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleFavorite}
                className={isFavorited ? 'text-red-500' : ''}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 pb-6">
              {/* Image Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={currentImage}
                    alt={activity.name || activity.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>
                
                {images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded overflow-hidden border-2 transition-colors ${
                          index === selectedImageIndex 
                            ? 'border-primary' 
                            : 'border-transparent hover:border-border'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${activity.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Key Info */}
              <div className="flex flex-wrap gap-4">
                {activity.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{activity.rating}</span>
                    {activity.reviewCount && (
                      <span className="text-muted-foreground">({activity.reviewCount})</span>
                    )}
                  </div>
                )}
                
                {activity.duration && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{activity.duration}</span>
                  </div>
                )}
                
                {activity.location && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{activity.location}</span>
                  </div>
                )}
                
                {(activity.groupSize || activity.maxParticipants) && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {activity.groupSize 
                        ? `${activity.groupSize.min}-${activity.groupSize.max} people`
                        : `Up to ${activity.maxParticipants} people`
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {activity.category && (
                  <Badge className={getCategoryColor(activity.category)}>
                    {activity.category}
                  </Badge>
                )}
                {activity.difficulty && (
                  <Badge className={getDifficultyColor(activity.difficulty)}>
                    {activity.difficulty}
                  </Badge>
                )}
                {activity.instantConfirmation && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Instant Confirmation
                  </Badge>
                )}
                {activity.freeCancellation && (
                  <Badge variant="outline">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Free Cancellation
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">About This Activity</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {activity.description || activity.shortDescription || 'No description available'}
                </p>
              </div>

              {/* Highlights */}
              {activity.highlights && activity.highlights.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Highlights</h3>
                    <ul className="space-y-2">
                      {activity.highlights.map((highlight: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* What's Included */}
              {activity.included && activity.included.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">What's Included</h3>
                    <ul className="space-y-2">
                      {activity.included.map((item: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Features */}
              {activity.features && activity.features.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {activity.features.map((feature: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Cancellation Policy */}
              {activity.cancellationPolicy && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Cancellation Policy
                    </h3>
                    <p className="text-muted-foreground">
                      {activity.cancellationPolicy}
                    </p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer with pricing and book button */}
          <div className="border-t bg-background p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {activity.price?.currency || 'AUD'} {activity.price?.total || activity.totalPrice || activity.price || '0'}
                </div>
                <div className="text-sm text-muted-foreground">
                  per person
                  {searchParams && (
                    <span className="ml-2">
                      • {formatDate(new Date(searchParams.date), 'MMM d, yyyy')}
                      • {searchParams.participants} participant{searchParams.participants !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handleBookNow} size="lg">
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};