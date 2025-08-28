import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { useActivitySearch } from '@/hooks/useUnifiedSearch';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const ActivitySearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { search: searchActivities, loading: isLoading, data: activities } = useActivitySearch();

  const destination = searchParams.get('destination') || '';
  const checkIn = searchParams.get('checkIn') || '';
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');

  useEffect(() => {
    if (!destination || !checkIn) {
      toast({
        title: "Missing search parameters",
        description: "Please provide destination and date",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    const performSearch = async () => {
      try {
        await searchActivities({
          latitude: 0,
          longitude: 0,
          radius: 20
        });
      } catch (error) {
        console.error('Activity search error:', error);
      }
    };

    performSearch();
  }, [destination, checkIn, adults, children, searchActivities, toast, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Activity Search Results</h1>
        <p className="text-muted-foreground mb-4">
          Destination: {destination} | Date: {checkIn} | Adults: {adults} | Children: {children}
        </p>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {activities && activities.length > 0 ? (
              activities.map((activity: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{activity.name || `Activity ${index + 1}`}</h3>
                  <p className="text-sm text-muted-foreground">{activity.description || 'Activity description'}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No activities found for your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ActivitySearchPage;