import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Handshake, Building, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PartnerPortal = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center flex items-center justify-center">
            <Handshake className="h-8 w-8 mr-3" />
            Partner Portal
          </h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Welcome, Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Access your partner dashboard, manage your listings, and grow your business with Maku.Travel.
              </p>
              <div className="flex gap-4">
                <Button>
                  Partner Login
                </Button>
                <Button variant="outline">
                  Become a Partner
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-6 w-6 mr-2" />
                  Hotels & Accommodations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  List your property and reach millions of travelers worldwide with our comprehensive booking platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2" />
                  Activity Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Showcase your tours and activities to adventurous travelers looking for unique experiences.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-6 w-6 mr-2" />
                Partner Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Global reach and exposure</li>
                <li>• Real-time booking management</li>
                <li>• Competitive commission rates</li>
                <li>• 24/7 partner support</li>
                <li>• Advanced analytics and reporting</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PartnerPortal;