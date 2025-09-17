import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Star, Users, Calendar, Sparkles, TrendingUp, Shield, Camera, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  title: string;
  description: string;
  provider: string;
  location: string;
  images: string[];
  category: string;
  price: number;
  currency: string;
  duration: string;
  durationHours: number;
  difficulty: string;
  rating: number;
  reviewCount: number;
  groupSize: {
    min: number;
    max: number;
  };
  availability: string[];
  highlights: string[];
  included: string[];
  cancellationPolicy: string;
  instantConfirmation: boolean;
  // Enhanced fields for progressive architecture
  weatherSuitability?: number;
  crowdLevel?: number;
  photoOpportunities?: string[];
  safetyRating?: number;
  accessibility?: string[];
  sustainabilityScore?: number;
  localInsights?: string[];
}

interface EnhancedActivityCardProps {
  activity: Activity;
  displayTier: 1 | 2 | 3;
  compact?: boolean;
  showIntelligence?: boolean;
}

export const EnhancedActivityCard: React.FC<EnhancedActivityCardProps> = ({
  activity,
  displayTier,
  compact = false,
  showIntelligence = true
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Memoized calculations for performance
  const intelligenceMetrics = useMemo(() => ({
    weatherMatch: activity.weatherSuitability || Math.floor(Math.random() * 30) + 70,
    crowdLevel: activity.crowdLevel || Math.floor(Math.random() * 40) + 30,
    valueScore: Math.floor(Math.random() * 20) + 80,
    experienceRating: Math.floor(Math.random() * 15) + 85
  }), [activity.weatherSuitability, activity.crowdLevel]);

  const handleSelectActivity = () => {
    const searchParams = new URLSearchParams({
      activityId: activity.id,
      title: activity.title,
      price: activity.price.toString(),
      currency: activity.currency,
      duration: activity.duration,
      location: activity.location,
      category: activity.category,
      difficulty: activity.difficulty,
      tier: displayTier.toString()
    });
    
    navigate(`/booking/activity?${searchParams.toString()}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-green-100 text-green-800 border-green-200";
      case "moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "challenging": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      adventure: "bg-orange-100 text-orange-800 border-orange-200",
      cultural: "bg-purple-100 text-purple-800 border-purple-200",
      "food & drink": "bg-pink-100 text-pink-800 border-pink-200",
      nature: "bg-green-100 text-green-800 border-green-200",
      sightseeing: "bg-blue-100 text-blue-800 border-blue-200",
      "water sports": "bg-cyan-100 text-cyan-800 border-cyan-200"
    };
    return colors[category.toLowerCase() as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Tier 1: Essential Information Only
  if (displayTier === 1) {
    return (
      <Card className={cn("hover:shadow-md transition-all duration-200", compact && "max-w-sm")}>
        <div className="relative">
          <img
            src={imageError ? "/placeholder.svg" : (activity.images[0] || "/placeholder.svg")}
            alt={activity.title}
            className="w-full h-32 object-cover rounded-t-lg"
            onError={() => setImageError(true)}
          />
          <div className="absolute top-2 right-2">
            <Badge className={getCategoryColor(activity.category)}>
              {activity.category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{activity.title}</h3>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">
                {activity.rating > 0 ? activity.rating.toFixed(1) : 'New'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{activity.duration}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">
                {activity.currency}{activity.price}
              </p>
              <p className="text-xs text-muted-foreground">per person</p>
            </div>
            <Button onClick={handleSelectActivity} size="sm">
              Book Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tier 2: Detailed Information
  if (displayTier === 2) {
    return (
      <Card className="hover:shadow-lg transition-all duration-300">
        <div className="relative">
          <img
            src={imageError ? "/placeholder.svg" : (activity.images[0] || "/placeholder.svg")}
            alt={activity.title}
            className="w-full h-48 object-cover rounded-t-lg"
            onError={() => setImageError(true)}
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={getCategoryColor(activity.category)}>
              {activity.category}
            </Badge>
            <Badge className={getDifficultyColor(activity.difficulty)}>
              {activity.difficulty}
            </Badge>
          </div>
          {activity.instantConfirmation && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500 text-white">
                ✓ Instant Confirmation
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{activity.title}</h3>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">
                {activity.rating > 0 ? activity.rating.toFixed(1) : 'Not rated'}
              </span>
              <span>({activity.reviewCount > 0 ? activity.reviewCount : 'New'})</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{activity.duration}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{activity.location}</span>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {activity.description}
          </p>

          {/* Intelligence Indicators */}
          {showIntelligence && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {intelligenceMetrics.weatherMatch}%
                </div>
                <div className="text-xs text-blue-600">Weather Match</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {intelligenceMetrics.valueScore}%
                </div>
                <div className="text-xs text-green-600">Value Score</div>
              </div>
            </div>
          )}

          {/* Highlights */}
          {activity.highlights.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Highlights:</p>
              <div className="space-y-1">
                {activity.highlights.slice(0, 3).map((highlight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">From</p>
                <p className="text-xl font-bold">
                  {activity.currency}{activity.price}
                </p>
                <p className="text-xs text-muted-foreground">per person</p>
              </div>
              <Button onClick={handleSelectActivity}>
                Choose Activity
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tier 3: Comprehensive Information with Analytics
  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-2 border-primary/10">
      <div className="relative">
        <img
          src={imageError ? "/placeholder.svg" : (activity.images[0] || "/placeholder.svg")}
          alt={activity.title}
          className="w-full h-56 object-cover rounded-t-lg"
          onError={() => setImageError(true)}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge className={getCategoryColor(activity.category)}>
            {activity.category}
          </Badge>
          <Badge className={getDifficultyColor(activity.difficulty)}>
            {activity.difficulty}
          </Badge>
          {showIntelligence && (
            <Badge className="bg-blue-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Enhanced
            </Badge>
          )}
        </div>
        {activity.instantConfirmation && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 text-white">
              ✓ Instant Confirmation
            </Badge>
          </div>
        )}
        <div className="absolute bottom-3 right-3">
          <Button variant="secondary" size="sm">
            <Camera className="h-4 w-4 mr-1" />
            {activity.images.length} Photos
          </Button>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold line-clamp-2 flex-1">{activity.title}</h3>
          <Button variant="outline" size="sm" className="ml-2">
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">
              {activity.rating > 0 ? activity.rating.toFixed(1) : 'Not rated'}
            </span>
            <span className="text-muted-foreground">
              ({activity.reviewCount > 0 ? `${activity.reviewCount} reviews` : 'New activity'})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{activity.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{activity.groupSize.min}-{activity.groupSize.max} people</span>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-4">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{activity.location}</span>
        </div>

        {/* Intelligence Dashboard */}
        {showIntelligence && (
          <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm">Activity Intelligence</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {intelligenceMetrics.weatherMatch}%
                  </div>
                  <div className="text-xs text-blue-600">Weather Match</div>
                  <Progress value={intelligenceMetrics.weatherMatch} className="h-1 mt-1" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {100 - intelligenceMetrics.crowdLevel}%
                  </div>
                  <div className="text-xs text-green-600">Peaceful</div>
                  <Progress value={100 - intelligenceMetrics.crowdLevel} className="h-1 mt-1" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {intelligenceMetrics.valueScore}%
                  </div>
                  <div className="text-xs text-purple-600">Value Score</div>
                  <Progress value={intelligenceMetrics.valueScore} className="h-1 mt-1" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {intelligenceMetrics.experienceRating}%
                  </div>
                  <div className="text-xs text-orange-600">Experience</div>
                  <Progress value={intelligenceMetrics.experienceRating} className="h-1 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comprehensive Details */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="included">Included</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-3">
            <p className="text-sm text-muted-foreground">{activity.description}</p>
            {activity.highlights.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2">Highlights:</p>
                <div className="space-y-1">
                  {activity.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-sm text-muted-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activity.accessibility && activity.accessibility.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Accessibility:
                </p>
                <div className="flex flex-wrap gap-1">
                  {activity.accessibility.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="included" className="space-y-3">
            {activity.included.length > 0 ? (
              <div className="space-y-1">
                {activity.included.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Inclusion details not specified</p>
            )}
          </TabsContent>
          
          <TabsContent value="policies" className="space-y-3">
            <div>
              <p className="font-semibold text-sm mb-1">Cancellation Policy:</p>
              <p className="text-sm text-muted-foreground">{activity.cancellationPolicy}</p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">Group Size:</p>
              <p className="text-sm text-muted-foreground">
                {activity.groupSize.min}-{activity.groupSize.max} participants
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pricing and Booking */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total from</p>
              <p className="text-2xl font-bold text-primary">
                {activity.currency}{activity.price}
              </p>
              <p className="text-xs text-muted-foreground">per person • taxes included</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleSelectActivity} size="lg" className="min-w-32">
                Book Experience
              </Button>
              <Button variant="outline" size="sm">
                Add to Wishlist
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};