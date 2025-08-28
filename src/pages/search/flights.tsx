import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { useFlightSearch } from '@/hooks/useUnifiedSearch';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const FlightSearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { search: searchFlights, loading: isLoading, data: flights } = useFlightSearch();

  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departureDate = searchParams.get('departureDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const adults = parseInt(searchParams.get('adults') || '1');
  const children = parseInt(searchParams.get('children') || '0');

  useEffect(() => {
    if (!origin || !destination || !departureDate) {
      toast({
        title: "Missing search parameters",
        description: "Please provide all required flight search details",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    const performSearch = async () => {
      try {
        await searchFlights({
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate,
          returnDate,
          adults,
          children,
          infants: 0,
          travelClass: 'ECONOMY'
        });
      } catch (error) {
        console.error('Flight search error:', error);
      }
    };

    performSearch();
  }, [origin, destination, departureDate, returnDate, adults, children, searchFlights, toast, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Flight Search Results</h1>
        <p className="text-muted-foreground mb-4">
          {origin} → {destination} | Departure: {departureDate} | Return: {returnDate || 'One-way'} | Adults: {adults} | Children: {children}
        </p>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {flights && flights.length > 0 ? (
              flights.map((flight: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{flight.airline || `Flight ${index + 1}`}</h3>
                  <p className="text-sm text-muted-foreground">{flight.route || `${origin} - ${destination}`}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No flights found for your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default FlightSearchPage;