
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

const TravelPreferencesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-8 flex items-center">
          <Heart className="h-8 w-8 mr-3" />
          Travel Preferences
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Travel Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Travel preferences page coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TravelPreferencesPage;
