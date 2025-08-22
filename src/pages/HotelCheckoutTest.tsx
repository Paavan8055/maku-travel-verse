import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function HotelCheckoutTest() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const navigateToCheckout = () => {
    setIsLoading(true);
    
    // Test parameters that should work
    const testParams = new URLSearchParams({
      hotelId: 'RTLON001',
      offerId: 'TEST-OFFER-001',
      checkIn: '2025-02-15',
      checkOut: '2025-02-17',
      adults: '2',
      children: '0', 
      rooms: '1',
      addons: 'breakfast,wifi',
      bedPref: 'king',
      note: 'Test booking for payment debugging'
    });

    console.log('🔍 Navigating to hotel checkout with test parameters');
    
    // Navigate to checkout page with test parameters
    window.location.href = `/hotel-checkout?${testParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-6 px-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold mb-6">Hotel Checkout <span className="hero-text">Payment Test</span></h1>
          
          <Card className="travel-card">
            <CardHeader>
              <CardTitle>Test Hotel Payment Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Test Scenario:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Hotel: London Test Hotel (RTLON001)</li>
                  <li>• Dates: Feb 15-17, 2025</li>
                  <li>• Guests: 2 adults, 1 room</li>
                  <li>• Add-ons: Breakfast + WiFi</li>
                  <li>• Bed preference: King size</li>
                </ul>
              </div>
              
              <p className="text-muted-foreground">
                This will take you to the hotel checkout page with test parameters to debug the payment integration.
                The system will attempt to:
              </p>
              
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Retrieve Stripe publishable key</li>
                <li>Create hotel booking via edge function</li>
                <li>Initialize Stripe payment element</li>
                <li>Display payment form for testing</li>
              </ol>
              
              <Button 
                onClick={navigateToCheckout}
                className="btn-primary w-full h-12"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "🧪 Test Hotel Checkout Payment"}
              </Button>
              
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                <strong>Debug info:</strong> Check browser console for detailed logs during the payment flow.
                Use Stripe test card: 4242 4242 4242 4242
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}