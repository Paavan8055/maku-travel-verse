import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logger from "@/utils/logger";

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
      console.log('useCarSearch: Missing search criteria');
      setCars([]);
      setError("Please provide pickup location and dates to search for cars.");
      setLoading(false);
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
          console.log('No cars available for search criteria');
          setCars([]);
          setError("No cars available for your search criteria. Try different dates or locations.");
        }
      } catch (err) {
        logger.error("Car search error:", err);
        setError(err instanceof Error ? err.message : "Failed to search cars");
        toast.error("Failed to search cars. Please try different search criteria.");
        setCars([]);
      } finally {
        setLoading(false);
      }
    };

    searchCars();
  }, [criteria.pickUpLocation, criteria.dropOffLocation, criteria.pickUpDate, criteria.dropOffDate, criteria.pickUpTime, criteria.dropOffTime]);

  return { cars, loading, error };
};

// Production app - all mock data generators removed