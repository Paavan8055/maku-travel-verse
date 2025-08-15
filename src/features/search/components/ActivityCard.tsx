import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Star, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

interface ActivityCardProps {
  activity: Activity;
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const navigate = useNavigate();

  const handleSelectActivity = () => {
    // Navigate directly to activity checkout (skip intermediate pages)
    const searchParams = new URLSearchParams({
      activityId: activity.id,
      title: activity.title,
      price: activity.price.toString(),
      currency: activity.currency,
      duration: activity.duration,
      location: activity.location,
      category: activity.category,
      difficulty: activity.difficulty
    });
    
    navigate(`/booking/activity?${searchParams.toString()}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "challenging":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "adventure":
        return "bg-orange-100 text-orange-800";
      case "cultural":
        return "bg-purple-100 text-purple-800";
      case "food & drink":
        return "bg-pink-100 text-pink-800";
      case "nature":
        return "bg-green-100 text-green-800";
      case "sightseeing":
        return "bg-blue-100 text-blue-800";
      case "water sports":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <div className="relative">
        <img
          src={activity.images[0] || "/placeholder.svg"}
          alt={activity.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-3 left-3 flex space-x-2">
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

      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
            {activity.title}
          </h3>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{activity.rating}</span>
              <span>({activity.reviewCount})</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{activity.duration}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{activity.location}</span>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {activity.description}
          </p>

          {/* Highlights */}
          {activity.highlights.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-foreground mb-1">Highlights:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {activity.highlights.slice(0, 2).map((highlight, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="line-clamp-1">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Group Size */}
          <div className="flex items-center space-x-1 mb-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {activity.groupSize.min}-{activity.groupSize.max} participants
            </span>
          </div>

          {/* Cancellation Policy */}
          <Badge variant="outline" className="text-xs mb-3">
            {activity.cancellationPolicy}
          </Badge>
        </div>

        {/* Pricing and Book Button */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">From</p>
              <p className="text-xl font-bold text-foreground">
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
};