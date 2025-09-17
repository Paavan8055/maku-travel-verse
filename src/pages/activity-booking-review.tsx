
import Navbar from '@/components/Navbar';
import { ActivityBookingWizard } from '@/components/booking/ActivityBookingWizard';
import { ViatorBookingWizard } from '@/components/booking/ViatorBookingWizard';
import { useEffect, useState } from 'react';

const ActivityBookingReview = () => {
  const [isViatorActivity, setIsViatorActivity] = useState(false);

  useEffect(() => {
    // Check if the selected activity is from Viator
    const storedData = sessionStorage.getItem('selectedActivity');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setIsViatorActivity(data.provider === 'Viator' || data.viatorData?.productCode);
      } catch (error) {
        console.error('Error parsing activity data:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        {isViatorActivity ? <ViatorBookingWizard /> : <ActivityBookingWizard />}
      </div>
    </div>
  );
};

export default ActivityBookingReview;
