import { useState } from "react";
import { ChevronLeft, CreditCard, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";

const CheckoutPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Mock data from URL params in real app
  const bookingDetails = {
    hotel: "Ocean Breeze Resort",
    room: "Deluxe Ocean View",
    checkIn: "Mar 15, 2025",
    checkOut: "Mar 22, 2025",
    nights: 7,
    guests: 2,
    basePrice: 3150,
    extrasPrice: 244,
    fundContribution: 50,
    total: 3444
  };

  const handlePayment = async () => {
    if (!agreeToTerms) return;
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Redirect to confirmation
      window.location.href = `/dashboard/bookings/confirmed-${Date.now()}`;
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Extras
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Complete Your <span className="hero-text">Booking</span></h1>
          <p className="text-muted-foreground">
            Review your details and confirm your reservation
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Information */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Guest Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <Input placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <Input placeholder="Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input type="email" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input type="tel" placeholder="+1 (555) 123-4567" />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Special Requests</label>
                  <Input placeholder="Any special requirements or requests..." />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                
                <div className="space-y-4">
                  {/* Payment Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5" />
                        <span className="font-medium">Credit Card</span>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === 'fund' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setPaymentMethod('fund')}
                    >
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5" />
                        <span className="font-medium">Travel Fund</span>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === 'split' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setPaymentMethod('split')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex">
                          <CreditCard className="h-5 w-5" />
                          <Shield className="h-5 w-5 -ml-2" />
                        </div>
                        <span className="font-medium">Split Payment</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Details */}
                  {(paymentMethod === 'card' || paymentMethod === 'split') && (
                    <div className="space-y-4 mt-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Card Number</label>
                        <Input placeholder="1234 5678 9012 3456" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Expiry Date</label>
                          <Input placeholder="MM/YY" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">CVV</label>
                          <Input placeholder="123" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                        <Input placeholder="John Doe" />
                      </div>
                    </div>
                  )}

                  {/* Fund Balance Info */}
                  {(paymentMethod === 'fund' || paymentMethod === 'split') && (
                    <div className="bg-muted p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span>Available Fund Balance:</span>
                        <span className="font-bold text-primary">$1,250</span>
                      </div>
                      {paymentMethod === 'fund' && bookingDetails.total > 1250 && (
                        <p className="text-sm text-destructive">
                          Insufficient funds. Please add more to your travel fund or choose split payment.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <Card className="travel-card">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                  />
                  <div className="flex-1">
                    <label htmlFor="terms" className="text-sm cursor-pointer">
                      I agree to the{" "}
                      <Button variant="link" className="h-auto p-0 text-primary underline">
                        Terms & Conditions
                      </Button>{" "}
                      and{" "}
                      <Button variant="link" className="h-auto p-0 text-primary underline">
                        Privacy Policy
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      By proceeding, you acknowledge that you have read and understood our cancellation policy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="travel-card sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Booking Summary</h3>
                
                <div className="space-y-4">
                  {/* Hotel Details */}
                  <div>
                    <h4 className="font-medium">{bookingDetails.hotel}</h4>
                    <p className="text-sm text-muted-foreground">{bookingDetails.room}</p>
                  </div>
                  
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Check-in</p>
                      <p className="font-medium">{bookingDetails.checkIn}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Check-out</p>
                      <p className="font-medium">{bookingDetails.checkOut}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">{bookingDetails.nights} nights</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Guests</p>
                      <p className="font-medium">{bookingDetails.guests} adults</p>
                    </div>
                  </div>
                  
                  {/* Price Breakdown */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Room ({bookingDetails.nights} nights)</span>
                      <span>${bookingDetails.basePrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Extras & Services</span>
                      <span>${bookingDetails.extrasPrice}</span>
                    </div>
                    <div className="flex justify-between text-sm text-primary">
                      <span>Fund Contribution</span>
                      <span>+${bookingDetails.fundContribution}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>${bookingDetails.total}</span>
                    </div>
                  </div>
                  
                  {/* Security Badge */}
                  <div className="bg-green-50 p-3 rounded-lg flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Secure Payment</p>
                      <p className="text-xs text-green-600">256-bit SSL encryption</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handlePayment}
                  disabled={!agreeToTerms || isProcessing}
                  className="w-full mt-6 btn-primary h-12"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm & Pay ${bookingDetails.total}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;