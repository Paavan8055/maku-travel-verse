import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logger from "@/utils/logger";

// Import activity images
import bridgeClimbImg from "@/assets/activity-bridge-climb.jpg";
import blueMountainsImg from "@/assets/activity-blue-mountains.jpg";
import operaHouseImg from "@/assets/activity-opera-house.jpg";
import surfingImg from "@/assets/activity-surfing.jpg";
import wineTastingImg from "@/assets/activity-wine-tasting.jpg";
import whaleWatchingImg from "@/assets/activity-whale-watching.jpg";
import foodTourImg from "@/assets/activity-food-tour.jpg";
import kayakingImg from "@/assets/activity-kayaking.jpg";
import botanicGardensImg from "@/assets/activity-botanic-gardens.jpg";
import jetBoatImg from "@/assets/activity-jet-boat.jpg";

interface ActivitySearchCriteria {
  destination: string;
  date: string;
  participants: number;
}

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
  ageGroup?: string;
  meetingPoint?: string;
}

export const useActivitySearch = (criteria: ActivitySearchCriteria) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!criteria.destination) {
      setActivities([]);
      setError("Please select a destination to search for activities");
      return;
    }

    const searchActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use Provider Rotation for Activities API
        const { data, error: functionError } = await supabase.functions.invoke('provider-rotation', {
          body: {
            searchType: 'activity',
            params: {
              destination: criteria.destination,
              date: criteria.date,
              participants: criteria.participants
            }
          }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.success) {
          // Handle provider rotation response format
          const activitiesData = data?.data || data?.activities || [];
          
          if (data.fallbackUsed) {
            toast.info("Showing sample activities while we restore full service.");
          }
          
          if (Array.isArray(activitiesData) && activitiesData.length > 0) {
            console.log("Activity search success:", activitiesData.length, "activities found");
            setActivities(activitiesData);
          } else {
            console.log("Activity search returned no data");
            setActivities([]);
            setError("No activities found for your search criteria. Please try a different destination or check back later.");
          }
        } else {
          console.log("Activity search failed");
          setActivities([]);
          setError(data?.error || "No activities found for your search criteria. Please try a different destination or check back later.");
        }
        } catch (err) {
          logger.error("Activity search error:", err);
          const errorMessage = err instanceof Error ? err.message : "Failed to search activities";
          setError(`Provider API Error: ${errorMessage}. Please try a different destination or check our service status.`);
          toast.error("Activity search temporarily unavailable. Please try again in a few minutes.");
          setActivities([]);
        } finally {
          setLoading(false);
        }
    };

    searchActivities();
  }, [criteria.destination, criteria.date, criteria.participants]);

  return { activities, loading, error };
};

// Mock data generator removed - production app uses only real Amadeus data