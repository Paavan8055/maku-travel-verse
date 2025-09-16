
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Trip {
  id: string;
  user_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'booked' | 'traveling' | 'completed';
  trip_type: 'business' | 'leisure' | 'family' | 'solo';
  budget: number;
  spent: number;
  activities_count: number;
  photos: string[];
  rating?: number;
  created_at: string;
  updated_at: string;
  daysUntil?: number;
}

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTrips = async () => {
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const tripsWithDaysUntil = data?.map(trip => ({
        id: trip.id,
        user_id: trip.user_id,
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        status: trip.status as 'planning' | 'booked' | 'traveling' | 'completed',
        trip_type: trip.trip_type as 'business' | 'leisure' | 'family' | 'solo',
        budget: trip.budget || 0,
        spent: trip.spent || 0,
        activities_count: trip.activities_count || 0,
        photos: Array.isArray(trip.photos) ? trip.photos as string[] : [],
        rating: trip.rating || undefined,
        created_at: trip.created_at,
        updated_at: trip.updated_at,
        daysUntil: calculateDaysUntil(trip.start_date)
      })) || [];

      setTrips(tripsWithDaysUntil);
      setError(null);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trips');
      toast({
        title: "Error",
        description: "Failed to load trips. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTrip = async (tripData: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'daysUntil'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          ...tripData,
          user_id: user.id,
          photos: tripData.photos || []
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trip created successfully!",
        variant: "default"
      });

      fetchTrips(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error creating trip:', err);
      toast({
        title: "Error",
        description: "Failed to create trip. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trip updated successfully!",
        variant: "default"
      });

      fetchTrips(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error updating trip:', err);
      toast({
        title: "Error",
        description: "Failed to update trip. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteTrip = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trip deleted successfully!",
        variant: "default"
      });

      fetchTrips(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error deleting trip:', err);
      toast({
        title: "Error",
        description: "Failed to delete trip. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const calculateDaysUntil = (startDate: string): number => {
    const today = new Date();
    const tripDate = new Date(startDate);
    const diffTime = tripDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  return {
    trips,
    loading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
    refetch: fetchTrips
  };
};
