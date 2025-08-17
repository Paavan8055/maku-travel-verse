import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      // Always show mock data for development
      setActivities(generateMockActivities(criteria));
      return;
    }

    const searchActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use direct Amadeus Tours & Activities API
        const { data, error: functionError } = await supabase.functions.invoke('amadeus-tours-activities', {
          body: {
            destination: criteria.destination,
            date: criteria.date,
            participants: criteria.participants
          }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.activities) {
          setActivities(data.activities);
        } else {
          // Fallback to mock data for development
          setActivities(generateMockActivities(criteria));
        }
      } catch (err) {
        console.error("Activity search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search activities");
        toast.error("Failed to search activities. Showing sample results.");
        
        // Show mock data on error
        setActivities(generateMockActivities(criteria));
      } finally {
        setLoading(false);
      }
    };

    searchActivities();
  }, [criteria.destination, criteria.date, criteria.participants]);

  return { activities, loading, error };
};

// Mock data generator for development
const generateMockActivities = (criteria: ActivitySearchCriteria): Activity[] => {
  const activityData = [
    { title: "Sydney Harbour Bridge Climb", image: bridgeClimbImg },
    { title: "Blue Mountains Day Tour", image: blueMountainsImg },
    { title: "Sydney Opera House Tour", image: operaHouseImg },
    { title: "Whale Watching Cruise", image: whaleWatchingImg },
    { title: "Bondi Beach Surfing Lesson", image: surfingImg },
    { title: "Hunter Valley Wine Tasting", image: wineTastingImg },
    { title: "Sydney Food Walking Tour", image: foodTourImg },
    { title: "Manly Beach Kayaking", image: kayakingImg },
    { title: "Royal Botanic Gardens Tour", image: botanicGardensImg },
    { title: "Harbour Jet Boat Ride", image: jetBoatImg }
  ];

  const categories = ["Adventure", "Cultural", "Food & Drink", "Nature", "Sightseeing", "Water Sports"];
  const difficulties = ["Easy", "Moderate", "Challenging"];
  const providers = ["Sydney Adventures", "Local Tours Co", "Adventure Seekers", "City Explorers", "Outdoor Escapes"];

  const activities: Activity[] = [];

  for (let i = 0; i < activityData.length; i++) {
    const basePrice = 50 + Math.random() * 250;
    const durationHours = Math.floor(Math.random() * 8) + 1;
    const rating = 3.5 + Math.random() * 1.5;
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const highlights = [
      "Professional guide included",
      "Small group experience",
      "Photo opportunities",
      "All equipment provided",
      "Safety briefing included",
      "Local insights and stories"
    ].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 2);

    const included = [
      "Professional guide",
      "Equipment rental",
      "Safety equipment",
      "Light refreshments",
      "Transportation",
      "Insurance coverage"
    ].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 2);

    activities.push({
      id: `activity-${i + 1}`,
      title: activityData[i].title,
      description: `Join us for an unforgettable ${activityData[i].title.toLowerCase()} experience in ${criteria.destination}. Perfect for ${category.toLowerCase()} enthusiasts of all levels.`,
      provider: providers[Math.floor(Math.random() * providers.length)],
      location: `${criteria.destination}, NSW`,
      images: [activityData[i].image],
      category,
      price: Math.round(basePrice),
      currency: "$",
      duration: durationHours === 1 ? "1 hour" : durationHours < 8 ? `${durationHours} hours` : "Full day",
      durationHours,
      difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
      rating: Math.round(rating * 10) / 10,
      reviewCount: Math.floor(Math.random() * 500) + 10,
      groupSize: {
        min: Math.floor(Math.random() * 3) + 1,
        max: Math.floor(Math.random() * 10) + 6
      },
      availability: ["Daily"],
      highlights,
      included,
      cancellationPolicy: Math.random() < 0.7 ? "Free cancellation up to 24 hours" : "Non-refundable",
      instantConfirmation: Math.random() < 0.8
    });
  }

  return activities.sort((a, b) => a.price - b.price);
};