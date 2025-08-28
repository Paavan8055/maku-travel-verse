import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { useHotelSearch } from '@/hooks/useUnifiedSearch';
import { useToast } from '@/hooks/use-toast';

const HotelSearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { search: searchHotels, loading: isLoading, data: hotels } = useHotelSearch();

  const destination = searchParams.get('destination') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');

  useEffect(() => {
    if (!destination || !checkIn || !checkOut) {
      toast({
        title: "Missing search parameters",
        description: "Please provide all required search details",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    const performSearch = async () => {
      try {
        await searchHotels({
          cityCode: destination,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults,
          roomQuantity: 1
        });
      } catch (error) {
        console.error('Hotel search error:', error);
      }
    };

    performSearch();
  }, [destination, checkIn, checkOut, adults, children, searchHotels, toast, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Hotel Search Results</h1>
        <p className="text-muted-foreground mb-4">
          Destination: {destination} | Check-in: {checkIn} | Check-out: {checkOut} | Adults: {adults} | Children: {children}
        </p>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {hotels && hotels.length > 0 ? (
              hotels.map((hotel: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{hotel.name || `Hotel ${index + 1}`}</h3>
                  <p className="text-sm text-muted-foreground">{hotel.location || 'Location'}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hotels found for your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelSearchPage;