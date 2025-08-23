
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

const HotelBookingReview = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-8">Review Your Hotel Booking</h1>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Hotel booking review coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HotelBookingReview;
