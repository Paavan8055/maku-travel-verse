
import Navbar from '@/components/Navbar';
import { FlightBookingWizard } from '@/components/booking/FlightBookingWizard';

const FlightBookingReview = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <FlightBookingWizard />
      </div>
    </div>
  );
};

export default FlightBookingReview;
