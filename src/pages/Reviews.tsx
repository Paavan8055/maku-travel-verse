import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ThumbsUp, User, MapPin, Calendar, Search } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Reviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newReview, setNewReview] = useState({
    itemId: '',
    itemType: 'hotel',
    title: '',
    content: '',
    overallRating: 5,
    cleanlinessRating: 5,
    serviceRating: 5,
    valueRating: 5,
    locationRating: 5
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
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('detailed_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to submit a review');
      return;
    }

    try {
      const { error } = await supabase
        .from('detailed_reviews')
        .insert([{
          user_id: user.id,
          item_id: newReview.itemId,
          item_type: newReview.itemType,
          title: newReview.title,
          content: newReview.content,
          overall_rating: newReview.overallRating,
          cleanliness_rating: newReview.cleanlinessRating,
          service_rating: newReview.serviceRating,
          value_rating: newReview.valueRating,
          location_rating: newReview.locationRating
        }]);

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setNewReview({
        itemId: '',
        itemType: 'hotel',
        title: '',
        content: '',
        overallRating: 5,
        cleanlinessRating: 5,
        serviceRating: 5,
        valueRating: 5,
        locationRating: 5
      });
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
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
              Travel Reviews
            </h1>
            <p className="text-lg text-muted-foreground">
              Share your experiences and discover authentic traveler insights
            </p>
          </div>

          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse Reviews</TabsTrigger>
              <TabsTrigger value="write">Write Review</TabsTrigger>
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

            <TabsContent value="write">
              <Card>
                <CardHeader>
                  <CardTitle>Write a Review</CardTitle>
                  <p className="text-muted-foreground">
                    Share your travel experience to help other travelers
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Booking/Item ID
                        </label>
                        <Input
                          value={newReview.itemId}
                          onChange={(e) => setNewReview({...newReview, itemId: e.target.value})}
                          placeholder="e.g., hotel-123, flight-456"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Category
                        </label>
                        <select
                          value={newReview.itemType}
                          onChange={(e) => setNewReview({...newReview, itemType: e.target.value})}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="hotel">Hotel</option>
                          <option value="flight">Flight</option>
                          <option value="activity">Activity</option>
                          <option value="restaurant">Restaurant</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Review Title
                      </label>
                      <Input
                        value={newReview.title}
                        onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                        placeholder="Summarize your experience"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Review Content
                      </label>
                      <Textarea
                        value={newReview.content}
                        onChange={(e) => setNewReview({...newReview, content: e.target.value})}
                        placeholder="Share details about your experience..."
                        rows={4}
                        required
                      />
                    </div>

                    {/* Ratings */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Rate Your Experience</h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Overall Rating
                          </label>
                          <div className="flex items-center space-x-2">
                            {renderStars(newReview.overallRating, 'lg')}
                            <select
                              value={newReview.overallRating}
                              onChange={(e) => setNewReview({...newReview, overallRating: parseInt(e.target.value)})}
                              className="ml-2 p-1 border rounded"
                            >
                              {[1,2,3,4,5].map(rating => (
                                <option key={rating} value={rating}>{rating}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {newReview.itemType === 'hotel' && (
                          <>
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Cleanliness
                              </label>
                              <div className="flex items-center space-x-2">
                                {renderStars(newReview.cleanlinessRating, 'lg')}
                                <select
                                  value={newReview.cleanlinessRating}
                                  onChange={(e) => setNewReview({...newReview, cleanlinessRating: parseInt(e.target.value)})}
                                  className="ml-2 p-1 border rounded"
                                >
                                  {[1,2,3,4,5].map(rating => (
                                    <option key={rating} value={rating}>{rating}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Service
                              </label>
                              <div className="flex items-center space-x-2">
                                {renderStars(newReview.serviceRating, 'lg')}
                                <select
                                  value={newReview.serviceRating}
                                  onChange={(e) => setNewReview({...newReview, serviceRating: parseInt(e.target.value)})}
                                  className="ml-2 p-1 border rounded"
                                >
                                  {[1,2,3,4,5].map(rating => (
                                    <option key={rating} value={rating}>{rating}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Value for Money
                              </label>
                              <div className="flex items-center space-x-2">
                                {renderStars(newReview.valueRating, 'lg')}
                                <select
                                  value={newReview.valueRating}
                                  onChange={(e) => setNewReview({...newReview, valueRating: parseInt(e.target.value)})}
                                  className="ml-2 p-1 border rounded"
                                >
                                  {[1,2,3,4,5].map(rating => (
                                    <option key={rating} value={rating}>{rating}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      Submit Review
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Reviews;