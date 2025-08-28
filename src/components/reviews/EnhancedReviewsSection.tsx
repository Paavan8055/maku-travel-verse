import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Camera, CheckCircle, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnhancedReviewsSectionProps {
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
  photo_urls: string[];
  helpful_votes: number;
  is_verified: boolean;
  supplier_verified: boolean;
  moderation_status: string;
  travel_date?: string;
  created_at: string;
}

interface ReviewPhoto {
  id: string;
  photo_url: string;
  photo_caption: string;
  is_approved: boolean;
}

export const EnhancedReviewsSection: React.FC<EnhancedReviewsSectionProps> = ({
  itemType,
  itemId,
  itemName,
  canReview = false,
  bookingId
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
      const { data, error } = await supabase
        .from('detailed_reviews')
        .select(`
          *,
          review_photos(*)
        `)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum file size is 5MB.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 photos
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (reviewId: string): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${reviewId}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('review-photos')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('review-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);

        // Store photo metadata
        await supabase.functions.invoke('review-enhancement', {
          body: {
            action: 'upload_photo',
            reviewId,
            photoData: {
              photo_url: publicUrl,
              photo_caption: '',
              file_size: file.size,
              file_type: file.type
            }
          }
        });
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload some photos');
      return uploadedUrls;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('review-enhancement', {
        body: {
          action: 'create',
          reviewData: {
            user_id: user.id,
            booking_id: bookingId,
            item_type: itemType,
            item_id: itemId,
            ...reviewForm
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        const reviewId = data.review.id;
        
        // Upload photos if any
        if (selectedFiles.length > 0) {
          await uploadPhotos(reviewId);
        }

        setShowReviewDialog(false);
        setSelectedFiles([]);
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

        toast.success(data.is_verified ? 'Verified review submitted!' : 'Review submitted for moderation');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
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

  const renderPhotoUpload = () => (
    <div className="space-y-4">
      <Label>Photos (Optional)</Label>
      <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className="cursor-pointer">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Click to upload photos (Max 5 photos, 5MB each)
          </p>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg"
              />
              <button
                onClick={() => removeSelectedFile(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadingPhotos && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Uploading photos...</p>
          <Progress value={50} className="w-full" />
        </div>
      )}
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

                  {renderPhotoUpload()}
                  
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
                    <Button 
                      onClick={submitReview} 
                      className="flex-1"
                      disabled={uploadingPhotos}
                    >
                      {uploadingPhotos ? 'Uploading...' : 'Submit Review'}
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
                          Verified Stay
                        </Badge>
                      )}
                      {review.supplier_verified && (
                        <Badge variant="default">Supplier Verified</Badge>
                      )}
                    </div>
                    
                    <p className="text-foreground leading-relaxed">{review.content}</p>
                    
                    {review.photo_urls && review.photo_urls.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {review.photo_urls.slice(0, 4).map((url, index) => (
                          <div key={index} className="min-w-24 h-24 rounded-lg overflow-hidden">
                            <img
                              src={url}
                              alt={`Review photo ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            />
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