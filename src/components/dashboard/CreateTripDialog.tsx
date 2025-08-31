
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTrips } from '@/hooks/useTrips';
import { Plus } from 'lucide-react';

export const CreateTripDialog: React.FC = () => {
  const { createTrip } = useTrips();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    status: 'planning' as const,
    trip_type: 'leisure' as const,
    budget: 0,
    spent: 0,
    activities_count: 0,
    photos: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.destination || !formData.start_date || !formData.end_date) {
      return;
    }

    const result = await createTrip(formData);
    if (result) {
      setOpen(false);
      setFormData({
        destination: '',
        start_date: '',
        end_date: '',
        status: 'planning',
        trip_type: 'leisure',
        budget: 0,
        spent: 0,
        activities_count: 0,
        photos: []
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Trip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
              placeholder="e.g., Tokyo, Japan"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trip_type">Trip Type</Label>
              <Select value={formData.trip_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, trip_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leisure">Leisure</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="solo">Solo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="traveling">Traveling</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget ($)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Trip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
