import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Gift, Heart, Calendar, Send, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const GiftCardsPage = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [selectedDesign, setSelectedDesign] = useState("default");

  // Check for success/cancelled status from URL params
  const isSuccess = searchParams.get("success") === "true";
  const isCancelled = searchParams.get("cancelled") === "true";
  const giftCardCode = searchParams.get("code");

  const predefinedAmounts = [25, 50, 100, 250, 500, 1000];

  const giftCardDesigns = [
    { id: "default", name: "Adventure", emoji: "🌍", color: "bg-gradient-to-br from-blue-500 to-purple-600" },
    { id: "tropical", name: "Tropical", emoji: "🏝️", color: "bg-gradient-to-br from-green-400 to-blue-500" },
    { id: "luxury", name: "Luxury", emoji: "✨", color: "bg-gradient-to-br from-yellow-400 to-orange-500" },
    { id: "family", name: "Family", emoji: "👨‍👩‍👧‍👦", color: "bg-gradient-to-br from-pink-400 to-red-500" }
  ];

  const handleAmountSelection = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getSelectedAmount = () => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  const handlePurchase = async () => {
    const amount = getSelectedAmount();
    
    if (amount < 25 || amount > 1000) {
      toast({
        title: "Invalid Amount",
        description: "Gift card amount must be between $25 and $1000",
        variant: "destructive"
      });
      return;
    }

    if (!senderName || !senderEmail || !recipientName || !recipientEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-gift-card', {
        body: {
          amount,
          senderName,
          senderEmail,
          recipientName,
          recipientEmail,
          personalMessage,
          designTemplate: selectedDesign
        }
      });

      if (error) throw error;

      if (data.success && data.checkout_url) {
        // Open Stripe checkout in a new tab
        window.open(data.checkout_url, '_blank');
        
        toast({
          title: "Redirecting to Payment",
          description: "Please complete your purchase in the new tab"
        });
      } else {
        throw new Error(data.error || "Failed to create gift card");
      }
    } catch (error: any) {
      console.error("Gift card purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Travel Gift Cards</h1>
          <p className="text-muted-foreground">Give the gift of adventure with Maku Travel gift cards</p>
        </div>

        {/* Success/Cancelled Messages */}
        {isSuccess && giftCardCode && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Gift card purchased successfully!</strong> 
              <br />Your gift card code is: <span className="font-mono bg-white px-2 py-1 rounded">{giftCardCode}</span>
              <br />An email has been sent to the recipient with redemption instructions.
            </AlertDescription>
          </Alert>
        )}

        {isCancelled && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Gift card purchase was cancelled. You can try again below.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gift Card Purchase Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="h-5 w-5" />
                <span>Purchase Gift Card</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">Select Amount (AUD)</label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {predefinedAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount ? "default" : "outline"}
                      onClick={() => handleAmountSelection(amount)}
                      className="h-12"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Custom amount ($25-$1000)"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    min="25"
                    max="1000"
                  />
                </div>
              </div>

              {/* Design Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">Choose Design</label>
                <div className="grid grid-cols-2 gap-3">
                  {giftCardDesigns.map((design) => (
                    <Button
                      key={design.id}
                      variant={selectedDesign === design.id ? "default" : "outline"}
                      onClick={() => setSelectedDesign(design.id)}
                      className="h-16 flex flex-col space-y-1"
                    >
                      <span className="text-lg">{design.emoji}</span>
                      <span className="text-xs">{design.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sender Information */}
              <div className="space-y-3">
                <h3 className="font-medium">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Your name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Recipient Information */}
              <div className="space-y-3">
                <h3 className="font-medium">Recipient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Recipient name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Recipient email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Personal Message */}
              <div>
                <label className="text-sm font-medium mb-2 block">Personal Message (Optional)</label>
                <Textarea
                  placeholder="Add a personal message to make this gift extra special..."
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handlePurchase} 
                disabled={loading || getSelectedAmount() < 25}
                className="w-full h-12"
              >
                {loading ? "Processing..." : `Purchase Gift Card - $${getSelectedAmount() || 0} AUD`}
              </Button>
            </CardContent>
          </Card>

          {/* Gift Card Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gift Card Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`${giftCardDesigns.find(d => d.id === selectedDesign)?.color} rounded-lg p-6 text-white text-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="text-3xl mb-2">
                      {giftCardDesigns.find(d => d.id === selectedDesign)?.emoji}
                    </div>
                    <h3 className="text-xl font-bold mb-2">Maku Travel</h3>
                    <div className="text-2xl font-bold mb-4">
                      ${getSelectedAmount() || 0} AUD
                    </div>
                    <p className="text-sm opacity-90">
                      {recipientName || "Recipient Name"}
                    </p>
                    {personalMessage && (
                      <div className="mt-4 p-3 bg-white/20 rounded text-sm">
                        "{personalMessage}"
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-travel-sky/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-travel-sky" />
                </div>
                <h3 className="font-medium mb-1">Valid for 1 Year</h3>
                <p className="text-sm text-muted-foreground">No expiry worries</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-travel-coral/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-6 w-6 text-travel-coral" />
                </div>
                <h3 className="font-medium mb-1">Perfect Gift</h3>
                <p className="text-sm text-muted-foreground">For any occasion</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-travel-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="h-6 w-6 text-travel-gold" />
                </div>
                <h3 className="font-medium mb-1">Instant Delivery</h3>
                <p className="text-sm text-muted-foreground">Sent immediately</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCardsPage;