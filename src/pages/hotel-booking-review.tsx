
import Navbar from '@/components/Navbar';
import { HotelBookingWizard } from '@/components/booking/HotelBookingWizard';

const HotelBookingReview = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <HotelBookingWizard />
      </div>
    </div>
  );
};

export default HotelBookingReview;
