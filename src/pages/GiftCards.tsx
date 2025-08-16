import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Gift, Heart, Send, Check, AlertCircle, Mountain, Waves, Building, Sunset, Sparkles, Shield, RefreshCw, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Import travel images
import heroMaldives from "@/assets/hero-maldives.jpg";
import heroSwissAlps from "@/assets/hero-swiss-alps.jpg";
import heroTokyo from "@/assets/hero-tokyo.jpg";
import mapSydney from "@/assets/map-sydney.jpg";

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
  const [selectedDesign, setSelectedDesign] = useState("maldives");

  // Check for success/cancelled status from URL params
  const isSuccess = searchParams.get("success") === "true";
  const isCancelled = searchParams.get("cancelled") === "true";
  const giftCardCode = searchParams.get("code");

  const predefinedAmounts = [100, 250, 500, 1000, 5000, 10000];

  const giftCardDesigns = [
    { 
      id: "maldives", 
      name: "Maldives Paradise", 
      icon: Waves, 
      image: heroMaldives,
      colors: "from-cyan-600 via-blue-700 to-indigo-900"
    },
    { 
      id: "swiss_alps", 
      name: "Swiss Alps Adventure", 
      icon: Mountain, 
      image: heroSwissAlps,
      colors: "from-slate-600 via-slate-700 to-slate-900"
    },
    { 
      id: "tokyo", 
      name: "Tokyo Experience", 
      icon: Building, 
      image: heroTokyo,
      colors: "from-purple-700 via-indigo-800 to-gray-900"
    },
    { 
      id: "sydney", 
      name: "Sydney Harbour", 
      icon: Sunset, 
      image: mapSydney,
      colors: "from-orange-600 via-red-700 to-pink-900"
    }
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
    
    if (amount < 100 || amount > 10000) {
      toast({
        title: "Invalid Amount",
        description: "Gift card amount must be between $100 and $10,000",
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
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-travel-sky/5 via-travel-ocean/5 to-travel-coral/5 border-b">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--travel-sky),0.1),transparent_50%)]"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-travel-ocean to-travel-coral bg-clip-text text-transparent mb-4">
              Premium Travel Gift Cards
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Give the gift of unforgettable journeys. Our premium gift cards never expire and can be used for any travel experience on Maku Travel.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">

        {/* Success/Cancelled Messages */}
        {isSuccess && giftCardCode && (
          <Alert className="mb-8 border-green-500/20 bg-green-500/5 backdrop-blur-sm">
            <Check className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-700">
              <div className="font-semibold mb-2">Gift card purchased successfully!</div>
              <div className="space-y-2">
                <div>Gift card code: <span className="font-mono bg-background px-3 py-1 rounded-md border text-foreground">{giftCardCode}</span></div>
                <div className="text-sm">An email has been sent to the recipient with redemption instructions.</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isCancelled && (
          <Alert className="mb-8 border-orange-500/20 bg-orange-500/5 backdrop-blur-sm">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <div className="font-semibold">Payment was cancelled</div>
              <div className="text-sm mt-1">No charges were made. You can try purchasing again below.</div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gift Card Purchase Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-luxury bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <span>Create Your Gift Card</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Amount Selection */}
                <div>
                  <label className="text-base font-medium mb-4 block text-foreground">Select Amount (AUD)</label>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {predefinedAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount ? "default" : "outline"}
                        onClick={() => handleAmountSelection(amount)}
                        className="h-14 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-md"
                      >
                        ${amount.toLocaleString()}
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Custom amount ($100-$10,000)"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      min="100"
                      max="10000"
                      className="h-12 text-lg"
                    />
                  </div>
                </div>

                {/* Design Selection */}
                <div>
                  <label className="text-base font-medium mb-4 block text-foreground">Choose Design Theme</label>
                  <div className="grid grid-cols-2 gap-4">
                    {giftCardDesigns.map((design) => {
                      const IconComponent = design.icon;
                      const isSelected = selectedDesign === design.id;
                      return (
                        <button
                          key={design.id}
                          onClick={() => setSelectedDesign(design.id)}
                          className={`relative h-24 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                            isSelected 
                              ? 'ring-2 ring-primary shadow-lg' 
                              : 'hover:shadow-md border border-border'
                          }`}
                        >
                          <div 
                            className="h-full w-full relative bg-cover bg-center flex flex-col items-center justify-center text-white"
                            style={{ backgroundImage: `url(${design.image})` }}
                          >
                            <div className="absolute inset-0 bg-black/40"></div>
                            <div className="relative z-10 flex flex-col items-center">
                              <IconComponent className="h-6 w-6 mb-1" />
                              <span className="text-sm font-medium">{design.name}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sender Information */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-foreground">Your Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Your full name"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="h-12"
                    />
                    <Input
                      type="email"
                      placeholder="Your email address"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Recipient Information */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-foreground">Recipient Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Recipient's full name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="h-12"
                    />
                    <Input
                      type="email"
                      placeholder="Recipient's email address"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Personal Message */}
                <div className="space-y-3">
                  <label className="text-base font-medium block text-foreground">Personal Message</label>
                  <Textarea
                    placeholder="Write a heartfelt message to accompany your gift..."
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">Optional • This message will appear on the gift card</p>
                </div>

                <Button 
                  onClick={handlePurchase} 
                  disabled={loading || getSelectedAmount() < 100}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-travel-ocean hover:from-primary/90 hover:to-travel-ocean/90 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Purchase Gift Card • $${getSelectedAmount().toLocaleString() || 0} AUD`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Gift Card Preview */}
          <div className="space-y-6">
            <Card className="border-0 shadow-luxury bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-center">Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {(() => {
                  const selectedDesignData = giftCardDesigns.find(d => d.id === selectedDesign);
                  const IconComponent = selectedDesignData?.icon || Waves;
                  return (
                    <div className="relative">
                      <div 
                        className="rounded-xl text-white relative overflow-hidden aspect-[16/10] shadow-xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${selectedDesignData?.image})` }}
                      >
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 rounded-xl"></div>
                        
                        {/* Content */}
                        <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                          {/* Brand */}
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-6 w-6" />
                            <span className="text-sm font-medium opacity-90">maku.travel</span>
                          </div>
                          
                          {/* Main Content */}
                          <div className="text-center">
                            <div className="text-3xl font-bold mb-1">
                              ${getSelectedAmount().toLocaleString() || 0}
                            </div>
                            <div className="text-lg mb-3">
                              for {recipientName || "Recipient Name"}
                            </div>
                            {personalMessage && (
                              <div className="text-sm opacity-80 italic max-w-xs mx-auto">
                                "{personalMessage}"
                              </div>
                            )}
                          </div>
                          
                          {/* Footer */}
                          <div className="text-right">
                            <span className="text-xs opacity-70">Gift Card • Never Expires</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Features */}
            <div className="space-y-6">
              <h3 className="font-semibold text-lg text-center">Why Choose Our Gift Cards</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
                  <div className="w-12 h-12 bg-travel-sky/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-travel-sky" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Never Expires</h4>
                    <p className="text-sm text-muted-foreground">Your gift maintains its full value forever, with no expiration date.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
                  <div className="w-12 h-12 bg-travel-ocean/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plane className="h-6 w-6 text-travel-ocean" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Global Adventures</h4>
                    <p className="text-sm text-muted-foreground">Use for flights, hotels, activities, and experiences worldwide.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
                  <div className="w-12 h-12 bg-travel-coral/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Send className="h-6 w-6 text-travel-coral" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Instant Delivery</h4>
                    <p className="text-sm text-muted-foreground">Digital delivery straight to their inbox with a personalized message.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/50">
                  <div className="w-12 h-12 bg-travel-sky/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="h-6 w-6 text-travel-sky" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Premium Designs</h4>
                    <p className="text-sm text-muted-foreground">Beautiful designs featuring stunning travel destinations from around the world.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCardsPage;
