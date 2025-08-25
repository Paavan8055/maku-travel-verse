// Curated demo data for quota-exceeded scenarios
// This provides a better user experience than empty results

export const fallbackFlightData = {
  flights: [
    {
      id: "demo-flight-1",
      airline: "Demo Airways",
      flightNumber: "DM101",
      departure: {
        airport: "SYD",
        city: "Sydney",
        time: "08:00",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      arrival: {
        airport: "MEL",
        city: "Melbourne", 
        time: "09:30",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      duration: "1h 30m",
      price: {
        amount: 249,
        currency: "AUD"
      },
      class: "economy",
      stops: 0,
      aircraft: "Boeing 737",
      isDemoData: true
    },
    {
      id: "demo-flight-2", 
      airline: "Sample Airlines",
      flightNumber: "SA205",
      departure: {
        airport: "SYD",
        city: "Sydney",
        time: "14:15",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      arrival: {
        airport: "MEL",
        city: "Melbourne",
        time: "15:45", 
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      duration: "1h 30m",
      price: {
        amount: 189,
        currency: "AUD"
      },
      class: "economy",
      stops: 0,
      aircraft: "Airbus A320",
      isDemoData: true
    }
  ],
  meta: {
    isDemoData: true,
    message: "Live flight data temporarily unavailable. Showing sample results.",
    searchParams: {},
    totalResults: 2
  }
};

export const fallbackHotelData = {
  hotels: [
    {
      id: "demo-hotel-1",
      name: "Grand Demo Hotel",
      address: "123 Sample Street, Sydney NSW 2000",
      location: {
        latitude: -33.8688,
        longitude: 151.2093
      },
      starRating: 4,
      amenities: ["WiFi", "Pool", "Gym", "Restaurant", "Spa"],
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop"
      ],
      price: {
        amount: 185,
        currency: "AUD",
        period: "per night"
      },
      rating: {
        score: 4.2,
        reviews: 1205
      },
      availableRooms: [
        {
          type: "Standard Queen",
          price: 185,
          beds: "1 Queen bed",
          size: "25 sqm"
        }
      ],
      isDemoData: true
    },
    {
      id: "demo-hotel-2",
      name: "Sample Boutique Hotel", 
      address: "456 Example Avenue, Sydney NSW 2000",
      location: {
        latitude: -33.8650,
        longitude: 151.2094
      },
      starRating: 5,
      amenities: ["WiFi", "Concierge", "Business Center", "Restaurant", "Bar"],
      images: [
        "https://images.unsplash.com/photo-1549294413-26f195200c16?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=300&fit=crop"
      ],
      price: {
        amount: 295,
        currency: "AUD", 
        period: "per night"
      },
      rating: {
        score: 4.7,
        reviews: 856
      },
      availableRooms: [
        {
          type: "Deluxe King",
          price: 295,
          beds: "1 King bed",
          size: "35 sqm"
        }
      ],
      isDemoData: true
    }
  ],
  meta: {
    isDemoData: true,
    message: "Live hotel data temporarily unavailable. Showing sample results.",
    searchParams: {},
    totalResults: 2
  }
};

export const fallbackActivityData = {
  activities: [
    {
      id: "demo-activity-1",
      name: "Sydney Harbour Bridge Climb",
      description: "Experience breathtaking 360-degree views of Sydney from the top of the iconic Harbour Bridge.",
      location: "Sydney Harbour Bridge, Sydney NSW",
      category: "Adventure",
      duration: "3.5 hours",
      price: {
        amount: 185,
        currency: "AUD",
        period: "per person"
      },
      rating: {
        score: 4.8,
        reviews: 12540
      },
      images: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=400&h=300&fit=crop"
      ],
      highlights: [
        "360-degree views of Sydney",
        "Professional guide included",
        "Safety equipment provided"
      ],
      isDemoData: true
    },
    {
      id: "demo-activity-2",
      name: "Sydney Opera House Tour",
      description: "Go behind the scenes of Australia's most famous performing arts venue with this guided tour.",
      location: "Sydney Opera House, Bennelong Point, Sydney NSW",
      category: "Cultural",
      duration: "1 hour",
      price: {
        amount: 45,
        currency: "AUD",
        period: "per person"
      },
      rating: {
        score: 4.5,
        reviews: 8920
      },
      images: [
        "https://images.unsplash.com/photo-1548586744-7c4c9b26e5fd?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?w=400&h=300&fit=crop"
      ],
      highlights: [
        "Expert guide commentary",
        "Behind-the-scenes access",
        "Architectural insights"
      ],
      isDemoData: true
    }
  ],
  meta: {
    isDemoData: true,
    message: "Live activity data temporarily unavailable. Showing sample results.",
    searchParams: {},
    totalResults: 2
  }
};

// Get fallback data based on search type
export function getFallbackData(searchType: 'flight' | 'hotel' | 'activity', searchParams: any = {}) {
  const data = {
    flight: fallbackFlightData,
    hotel: fallbackHotelData, 
    activity: fallbackActivityData
  }[searchType];

  // Customize data based on search parameters if needed
  if (searchParams.destination) {
    data.meta.searchParams = { ...searchParams };
    data.meta.message = `Live ${searchType} data for ${searchParams.destination} temporarily unavailable. Showing sample results.`;
  }

  return data;
}

// Check if data is demo/fallback data
export function isDemoData(data: any): boolean {
  return data?.meta?.isDemoData === true || 
         (Array.isArray(data) && data.some((item: any) => item.isDemoData === true));
}