import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Camera, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reviewsAPI } from '@/lib/otaDataClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';

interface ReviewsSectionProps {
  itemType: string;
  itemId: string;
  itemName: string;
  canReview?: boolean;
  bookingId?: string;
}

interface Review {
  id: string;
  user_id: string;
  overall_rating: number;
  cleanliness_rating?: number;
  service_rating?: number;
  value_rating?: number;
  location_rating?: number;
  title: string;
  content: string;
  photos: any;
  helpful_votes: number;
  is_verified: boolean;
  is_featured: boolean;
  travel_date?: string;
  created_at: string;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  itemType,
  itemId,
  itemName,
  canReview = false,
  bookingId
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    title: '',
    content: '',
    overall_rating: 5,
    cleanliness_rating: 5,
    service_rating: 5,
    value_rating: 5,
    location_rating: 5,
    travel_date: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    loadReviews();
  }, [itemType, itemId]);

  const loadReviews = async () => {
    try {
      const data = await reviewsAPI.fetchReviews(itemType, itemId);
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    try {
      await reviewsAPI.createReview({
        user_id: user.id,
        booking_id: bookingId,
        item_type: itemType,
        item_id: itemId,
        ...reviewForm
      });
      
      setShowReviewDialog(false);
      loadReviews();
      setReviewForm({
        title: '',
        content: '',
        overall_rating: 5,
        cleanliness_rating: 5,
        service_rating: 5,
        value_rating: 5,
        location_rating: 5,
        travel_date: ''
      });
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.overall_rating, 0) / reviews.length 
    : 0;

  const renderStars = (rating: number, size = 'sm') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingInput = (label: string, value: number, onChange: (value: number) => void) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              Reviews & Ratings
              {averageRating > 0 && (
                <div className="flex items-center gap-2">
                  {renderStars(averageRating, 'lg')}
                  <span className="text-lg font-semibold">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-muted text-sm">
                    ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </CardTitle>
          </div>
          {canReview && user && (
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
              <DialogTrigger asChild>
                <Button>Write Review</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Review {itemName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {renderRatingInput('Overall Rating', reviewForm.overall_rating, (value) =>
                      setReviewForm(prev => ({ ...prev, overall_rating: value }))
                    )}
                    {itemType === 'hotel' && (
                      <>
                        {renderRatingInput('Cleanliness', reviewForm.cleanliness_rating, (value) =>
                          setReviewForm(prev => ({ ...prev, cleanliness_rating: value }))
                        )}
                        {renderRatingInput('Service', reviewForm.service_rating, (value) =>
                          setReviewForm(prev => ({ ...prev, service_rating: value }))
                        )}
                        {renderRatingInput('Value', reviewForm.value_rating, (value) =>
                          setReviewForm(prev => ({ ...prev, value_rating: value }))
                        )}
                        {renderRatingInput('Location', reviewForm.location_rating, (value) =>
                          setReviewForm(prev => ({ ...prev, location_rating: value }))
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Review Title</Label>
                    <Input
                      id="title"
                      placeholder="Summarize your experience"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content">Your Review</Label>
                    <Textarea
                      id="content"
                      placeholder="Share your experience with other travelers..."
                      className="min-h-32"
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="travel_date">Travel Date</Label>
                    <Input
                      id="travel_date"
                      type="date"
                      value={reviewForm.travel_date}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, travel_date: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button onClick={submitReview} className="flex-1">
                      Submit Review
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowReviewDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {review.user_id.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {renderStars(review.overall_rating)}
                      <span className="font-medium">{review.title}</span>
                      {review.is_verified && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                      {review.is_featured && (
                        <Badge variant="default">Featured</Badge>
                      )}
                    </div>
                    
                    <p className="text-foreground leading-relaxed">{review.content}</p>
                    
                    {review.photos && Array.isArray(review.photos) && review.photos.length > 0 && (
                      <div className="flex gap-2">
                        {review.photos.slice(0, 3).map((photo, index) => (
                          <div key={index} className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Camera className="w-6 h-6 text-muted" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span>
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                      {review.travel_date && (
                        <span>Traveled: {new Date(review.travel_date).toLocaleDateString()}</span>
                      )}
                      <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                        Helpful ({review.helpful_votes})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};