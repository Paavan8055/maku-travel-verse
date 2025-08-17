import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CarSearchCriteria {
  pickUpLocation: string;
  dropOffLocation?: string;
  pickUpDate: string;
  pickUpTime: string;
  dropOffDate: string;
  dropOffTime: string;
  driverAge?: number;
}

interface Car {
  id: string;
  vehicle: {
    category: string;
    description: string;
    imageURL?: string;
    seats: number;
    doors: number;
    fuelType: string;
    transmission: string;
    airConditioning: boolean;
    navigationSystem: boolean;
  };
  vendor: {
    name: string;
    code: string;
    logoUrl?: string;
    contactNumber?: string;
  };
  pickUp: {
    location: string;
    address: string;
    coordinates?: { latitude: number; longitude: number };
    dateTime: string;
  };
  dropOff: {
    location: string;
    address: string;
    coordinates?: { latitude: number; longitude: number };
    dateTime: string;
  };
  price: {
    currency: string;
    amount: number;
    convertedAmount?: number;
    taxes: any[];
    inclusions: string[];
  };
  policies: {
    cancellation: any;
    paymentType: string;
    guarantee: any;
  };
  extras: any[];
}

export const useCarSearch = (criteria: CarSearchCriteria) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!criteria.pickUpLocation || !criteria.pickUpDate || !criteria.dropOffDate) {
      // Show mock data for development when no search criteria
      setCars(generateMockCars(criteria));
      return;
    }

    const searchCars = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Searching cars with criteria:', criteria);

        // Call Amadeus car search function
        const { data, error: functionError } = await supabase.functions.invoke('amadeus-car-search', {
          body: {
            pickUpLocationCode: criteria.pickUpLocation,
            dropOffLocationCode: criteria.dropOffLocation || criteria.pickUpLocation,
            pickUpDate: criteria.pickUpDate,
            pickUpTime: criteria.pickUpTime,
            dropOffDate: criteria.dropOffDate,
            dropOffTime: criteria.dropOffTime,
            driverAge: criteria.driverAge || 30,
            currencyCode: 'USD'
          }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.cars && data.cars.length > 0) {
          console.log('Found real car data:', data.cars.length, 'cars');
          setCars(data.cars);
        } else {
          console.log('No real car data, using mock data');
          setCars(generateMockCars(criteria));
        }
      } catch (err) {
        console.error("Car search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search cars");
        toast.error("Failed to search cars. Showing sample results.");
        
        // Show mock data on error
        setCars(generateMockCars(criteria));
      } finally {
        setLoading(false);
      }
    };

    searchCars();
  }, [criteria.pickUpLocation, criteria.dropOffLocation, criteria.pickUpDate, criteria.dropOffDate, criteria.pickUpTime, criteria.dropOffTime]);

  return { cars, loading, error };
};

// Mock data generator for development
const generateMockCars = (criteria: CarSearchCriteria): Car[] => {
  const vendors = [
    { name: "Hertz", code: "HZ", logoUrl: "/placeholder-logo.svg" },
    { name: "Avis", code: "AV", logoUrl: "/placeholder-logo.svg" },
    { name: "Enterprise", code: "ET", logoUrl: "/placeholder-logo.svg" },
    { name: "Budget", code: "BG", logoUrl: "/placeholder-logo.svg" },
    { name: "Europcar", code: "EP", logoUrl: "/placeholder-logo.svg" },
  ];

  const carCategories = [
    {
      category: "Economy",
      description: "Toyota Corolla or similar",
      seats: 5,
      doors: 4,
      basePrice: 45
    },
    {
      category: "Compact",
      description: "Nissan Versa or similar", 
      seats: 5,
      doors: 4,
      basePrice: 55
    },
    {
      category: "Intermediate",
      description: "Toyota Camry or similar",
      seats: 5,
      doors: 4,
      basePrice: 70
    },
    {
      category: "Standard",
      description: "Chevrolet Malibu or similar",
      seats: 5,
      doors: 4,
      basePrice: 85
    },
    {
      category: "Full Size",
      description: "Toyota Avalon or similar",
      seats: 5,
      doors: 4,
      basePrice: 100
    },
    {
      category: "Premium",
      description: "BMW 3 Series or similar",
      seats: 5,
      doors: 4,
      basePrice: 150
    },
    {
      category: "Luxury",
      description: "Mercedes-Benz E-Class or similar",
      seats: 5,
      doors: 4,
      basePrice: 200
    },
    {
      category: "SUV",
      description: "Toyota RAV4 or similar",
      seats: 5,
      doors: 5,
      basePrice: 120
    }
  ];

  const cars: Car[] = [];

  // Calculate rental duration in days
  const pickUpDate = new Date(criteria.pickUpDate);
  const dropOffDate = new Date(criteria.dropOffDate);
  const days = Math.ceil((dropOffDate.getTime() - pickUpDate.getTime()) / (1000 * 60 * 60 * 24));

  carCategories.forEach((carCategory, index) => {
    const vendor = vendors[index % vendors.length];
    const dailyRate = carCategory.basePrice + Math.random() * 30;
    const totalPrice = dailyRate * days;

    cars.push({
      id: `car-${index + 1}`,
      vehicle: {
        category: carCategory.category,
        description: carCategory.description,
        imageURL: "/placeholder.svg",
        seats: carCategory.seats,
        doors: carCategory.doors,
        fuelType: Math.random() < 0.3 ? "Electric" : (Math.random() < 0.5 ? "Diesel" : "Gasoline"),
        transmission: Math.random() < 0.7 ? "Automatic" : "Manual",
        airConditioning: Math.random() < 0.9,
        navigationSystem: Math.random() < 0.6
      },
      vendor: vendor,
      pickUp: {
        location: criteria.pickUpLocation,
        address: `${criteria.pickUpLocation} Airport - Terminal 1`,
        dateTime: `${criteria.pickUpDate}T${criteria.pickUpTime}:00`
      },
      dropOff: {
        location: criteria.dropOffLocation || criteria.pickUpLocation,
        address: `${criteria.dropOffLocation || criteria.pickUpLocation} Airport - Terminal 1`,
        dateTime: `${criteria.dropOffDate}T${criteria.dropOffTime}:00`
      },
      price: {
        currency: "USD",
        amount: Math.round(totalPrice * 100) / 100,
        taxes: [],
        inclusions: ["Unlimited mileage", "Third-party insurance"]
      },
      policies: {
        cancellation: {
          type: "FREE_CANCELLATION",
          description: "Free cancellation up to 24 hours before pickup"
        },
        paymentType: "PAY_AT_LOCATION",
        guarantee: {
          type: "CREDIT_CARD_REQUIRED"
        }
      },
      extras: [
        { name: "GPS Navigation", price: 12 },
        { name: "Child Seat", price: 8 },
        { name: "Additional Driver", price: 15 }
      ].filter(() => Math.random() < 0.6)
    });
  });

  return cars.sort((a, b) => a.price.amount - b.price.amount);
};