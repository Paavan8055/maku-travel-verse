
import Navbar from '@/components/Navbar';
import { ActivityBookingWizard } from '@/components/booking/ActivityBookingWizard';

const ActivityBookingReview = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <ActivityBookingWizard />
      </div>
    </div>
  );
};

export default ActivityBookingReview;
