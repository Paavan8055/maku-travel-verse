import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Tag, Percent, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Deals = () => {
  const navigate = useNavigate();

  const deals = [
    {
      title: "Last Minute Hotel Deals",
      description: "Save up to 50% on hotel bookings made within 48 hours",
      discount: "Up to 50% OFF",
      category: "Hotels",
      expires: "Limited Time"
    },
    {
      title: "Early Bird Flight Specials",
      description: "Book flights 60 days in advance and save big",
      discount: "30% OFF",
      category: "Flights",
      expires: "Book Early"
    },
    {
      title: "Activity Bundle Packages",
      description: "Book 3+ activities in the same city for special pricing",
      discount: "25% OFF",
      category: "Activities",
      expires: "Bundle Deal"
    }
  ];

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
            <Tag className="h-8 w-8 mr-3" />
            Travel Deals & Offers
          </h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Percent className="h-6 w-6 mr-2" />
                Featured Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Discover amazing savings on hotels, flights, and activities. Limited time offers updated daily.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 mb-8">
            {deals.map((deal, index) => (
              <Card key={index} className="border-primary/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{deal.title}</CardTitle>
                      <p className="text-muted-foreground mt-2">{deal.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary">
                        {deal.discount}
                      </Badge>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {deal.expires}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {deal.category}
                    </Badge>
                    <Button>
                      View Deal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subscribe for Deal Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Never miss out on the best travel deals. Get notified when new offers become available.
              </p>
              <Button>
                Subscribe to Alerts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Deals;