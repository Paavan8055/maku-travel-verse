import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ThumbsUp, User, MapPin, Calendar, Search, TrendingUp, Award, Eye } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EnhancedReviewsSection } from '@/components/reviews/EnhancedReviewsSection';

const Reviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    verifiedReviews: 0,
    photosUploaded: 0
  });

  const categories = [
    { value: 'all', label: 'All Reviews' },
    { value: 'hotel', label: 'Hotels' },
    { value: 'flight', label: 'Flights' },
    { value: 'activity', label: 'Activities' },
    { value: 'restaurant', label: 'Restaurants' }
  ];

  useEffect(() => {
    fetchReviews();
    fetchReviewStats();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('detailed_reviews')
        .select(`
          *,
          review_photos(*)
        `)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchReviewStats = async () => {
    try {
      const { data, error } = await supabase
        .from('detailed_reviews')
        .select('overall_rating, is_verified, photo_urls');

      if (error) throw error;

      const stats = {
        totalReviews: data?.length || 0,
        averageRating: data?.length > 0 
          ? data.reduce((sum, review) => sum + review.overall_rating, 0) / data.length 
          : 0,
        verifiedReviews: data?.filter(review => review.is_verified).length || 0,
        photosUploaded: data?.reduce((sum, review) => sum + (review.photo_urls?.length || 0), 0) || 0
      };

      setReviewStats(stats);
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };


  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    return (
      <div className={`flex ${size === 'lg' ? 'space-x-1' : 'space-x-0.5'}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || review.item_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Travel Reviews & Insights
            </h1>
            <p className="text-lg text-muted-foreground">
              Enhanced reviews with photo uploads, verification, and supplier integration
            </p>
          </div>

          {/* Review Statistics */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold">{reviewStats.totalReviews}</div>
                <div className="text-sm text-muted-foreground">Total Reviews</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="text-2xl font-bold">{reviewStats.averageRating.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-2xl font-bold">{reviewStats.verifiedReviews}</div>
                <div className="text-sm text-muted-foreground">Verified Reviews</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Eye className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{reviewStats.photosUploaded}</div>
                <div className="text-sm text-muted-foreground">Photos Uploaded</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browse">Browse Reviews</TabsTrigger>
              <TabsTrigger value="demo">Enhanced Demo</TabsTrigger>
              <TabsTrigger value="insights">Review Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="browse">
              <div className="space-y-6">
                {/* Search and Filter */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search reviews..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex space-x-2">
                        {categories.map((category) => (
                          <Button
                            key={category.value}
                            variant={selectedCategory === category.value ? "default" : "outline"}
                            onClick={() => setSelectedCategory(category.value)}
                            size="sm"
                          >
                            {category.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                <div className="space-y-6">
                  {filteredReviews.map((review, index) => (
                    <Card key={review.id || index}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{review.title}</h3>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                <Badge variant="outline">{review.item_type}</Badge>
                                {review.is_verified && (
                                  <Badge variant="secondary">Verified</Badge>
                                )}
                                {review.photo_urls?.length > 0 && (
                                  <Badge variant="outline">📷 {review.photo_urls.length}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {renderStars(review.overall_rating, 'lg')}
                            <div className="text-sm text-muted-foreground mt-1">
                              {review.overall_rating}/5
                            </div>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4">{review.content}</p>

                        {/* Detailed Ratings */}
                        {review.item_type === 'hotel' && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-sm font-medium mb-1">Cleanliness</div>
                              {renderStars(review.cleanliness_rating)}
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium mb-1">Service</div>
                              {renderStars(review.service_rating)}
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium mb-1">Value</div>
                              {renderStars(review.value_rating)}
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium mb-1">Location</div>
                              {renderStars(review.location_rating)}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="sm">
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Helpful ({review.helpful_votes || 0})
                            </Button>
                            {review.is_verified && (
                              <Badge>Verified Stay</Badge>
                            )}
                          </div>
                          {review.travel_date && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-1" />
                              Stayed {new Date(review.travel_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredReviews.length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search or filter criteria
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="demo">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Enhanced Reviews Demo</CardTitle>
                    <p className="text-muted-foreground">
                      Experience our new enhanced review system with photo uploads, verification, and moderation
                    </p>
                  </CardHeader>
                </Card>

                <EnhancedReviewsSection
                  itemType="hotel"
                  itemId="demo-hotel-123"
                  itemName="Grand Plaza Hotel Sydney"
                  canReview={true}
                  bookingId="demo-booking-456"
                />
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Analytics & Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">Review Categories</h3>
                        <div className="space-y-2">
                          {categories.map(category => {
                            const count = reviews.filter(r => r.item_type === category.value || category.value === 'all').length;
                            return (
                              <div key={category.value} className="flex justify-between items-center">
                                <span>{category.label}</span>
                                <Badge variant="outline">{count}</Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-3">Verification Status</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>Verified Reviews</span>
                            <Badge variant="secondary">{reviews.filter(r => r.is_verified).length}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Unverified Reviews</span>
                            <Badge variant="outline">{reviews.filter(r => !r.is_verified).length}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>With Photos</span>
                            <Badge variant="outline">{reviews.filter(r => r.photo_urls?.length > 0).length}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Enhancements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium">Photo Upload System</h4>
                          <p className="text-sm text-muted-foreground">Users can now upload up to 5 photos per review with automatic moderation</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium">Booking Verification</h4>
                          <p className="text-sm text-muted-foreground">Reviews are automatically verified against confirmed bookings</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium">Supplier Integration</h4>
                          <p className="text-sm text-muted-foreground">Enhanced data from Amadeus, Sabre, and HotelBeds APIs</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <h4 className="font-medium">Content Moderation</h4>
                          <p className="text-sm text-muted-foreground">AI-powered content moderation with admin approval workflow</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Reviews;