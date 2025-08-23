import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { formatCurrency } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Bed, 
  Coffee, 
  Wifi, 
  Car, 
  Shield, 
  CheckCircle,
  XCircle,
  Info,
  Star,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useHotelOffers } from '@/hooks/useHotelOffers';
import { AddOnsSelector } from './AddOnsSelector';
import { toast } from 'sonner';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useSessionRecovery } from "@/hooks/useSessionRecovery";
import { format } from 'date-fns';

interface HotelOffer {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  rateCode: string;
  rateFamilyEstimated: any;
  room: {
    type: string;
    typeEstimated: any;
    description: string;
    capacity: number;
  };
  guests: any;
  price: {
    currency: string;
    base: string;
    total: string;
    taxes: any[];
    markups: any[];
    variations: any;
  };
  policies: {
    paymentType: string;
    cancellation: any;
    guarantee: any;
    deposit: any;
  };
  self: string;
}

interface Hotel {
  hotelId: string;
  chainCode?: string;
  dupeId?: string;
  name: string;
  cityCode?: string;
  latitude?: number;
  longitude?: number;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: 'meals' | 'transport' | 'services' | 'amenities';
  required: boolean;
  perNight?: boolean;
}

interface RoomSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  currency: string;
  onRoomSelected: (selectedOffer: HotelOffer, hotel: Hotel, selectedAddOns?: AddOn[]) => void;
}

export const RoomSelectionModal: React.FC<RoomSelectionModalProps> = ({
  isOpen,
  onClose,
  hotelId,
  hotelName,
  checkIn,
  checkOut,
  adults,
  children,
  rooms,
  currency,
  onRoomSelected
}) => {
  const [selectedOffer, setSelectedOffer] = useState<HotelOffer | null>(null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState<'rooms' | 'addons'>('rooms');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { offers, hotel, ancillaryServices, loading, error, fetchOffers } = useHotelOffers();
  const { saveSession } = useSessionRecovery();

  // Use real ancillary services from API or fallback to mock data
  const mockAddOns: AddOn[] = ancillaryServices?.length > 0 ? ancillaryServices.map(service => ({
    id: service.code || service.id || `addon-${Date.now()}`,
    name: service.name || service.description || 'Service',
    description: service.description || service.name || 'Additional service',
    price: service.price || 0,
    currency: service.currency || currency,
    category: service.category || 'amenities',
    perNight: service.perNight || false,
    required: false
  })) : [
    {
      id: 'breakfast',
      name: 'Continental Breakfast',
      description: 'Start your day with a delicious breakfast buffet',
      price: 25.00,
      currency,
      category: 'meals',
      required: false,
      perNight: true
    },
    {
      id: 'parking',
      name: 'Valet Parking',
      description: 'Convenient valet parking service',
      price: 35.00,
      currency,
      category: 'transport',
      required: false,
      perNight: true
    },
    {
      id: 'wifi',
      name: 'Premium WiFi',
      description: 'High-speed internet access',
      price: 15.00,
      currency,
      category: 'amenities',
      required: false,
      perNight: true
    },
    {
      id: 'late-checkout',
      name: 'Late Check-out',
      description: 'Check out up to 3 PM (subject to availability)',
      price: 50.00,
      currency,
      category: 'services',
      required: false,
      perNight: false
    }
  ];

  useEffect(() => {
    if (isOpen && hotelId) {
      fetchOffers({
        hotelId,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
        currency
      });
    }
  }, [isOpen, hotelId, checkIn, checkOut, adults, children, rooms, currency, fetchOffers]);

  const handleOfferSelect = (offer: HotelOffer) => {
    setSelectedOffer(offer);
  };

  const handleContinueToCheckout = async () => {
    if (!selectedOffer || !hotel) return;
    
    setIsProcessing(true);
    try {
      // Save session for recovery
      saveSession({
        hotelId,
        hotelName,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
        selectedOffer,
        selectedAddOns: (ancillaryServices || mockAddOns).filter(addOn => selectedAddOnIds.includes(addOn.id)),
        step: 'checkout'
      });

      const addOnsToUse = ancillaryServices || mockAddOns;
      const selectedAddOns = addOnsToUse.filter(addOn => selectedAddOnIds.includes(addOn.id));
      
      // Add a small delay to show processing state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onRoomSelected(selectedOffer, hotel, selectedAddOns);
      onClose();
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      toast.error('Failed to proceed to checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinueToAddOns = () => {
    if (selectedOffer) {
      setCurrentTab('addons');
    }
  };

  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  
  const getSelectedAddOnsPrice = () => {
    const addOnsToUse = ancillaryServices || mockAddOns;
    return addOnsToUse
      .filter(addOn => selectedAddOnIds.includes(addOn.id))
      .reduce((total, addOn) => {
        const price = addOn.perNight ? addOn.price * nights : addOn.price;
        return total + price;
      }, 0);
  };

  const getTotalPrice = () => {
    if (!selectedOffer) return 0;
    return parseFloat(selectedOffer.price.total) + getSelectedAddOnsPrice();
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(2);
  };

  const getCancellationText = (cancellation?: any) => {
    if (!cancellation) return 'No cancellation info';
    
    if (cancellation.type === 'FREE_CANCELLATION') {
      return `Free cancellation until ${cancellation.deadline ? new Date(cancellation.deadline).toLocaleDateString() : 'check-in'}`;
    }
    
    if (cancellation.amount) {
      return `Cancellation fee: ${currency} ${cancellation.amount}`;
    }
    
    return 'Non-refundable';
  };

  const getRoomTypeName = (room: HotelOffer['room']) => {
    if (room.typeEstimated?.category) {
      return room.typeEstimated.category.replace(/_/g, ' ').toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    return room.type?.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()) || 'Room';
  };

  const getBedInfo = (room: HotelOffer['room']) => {
    if (room.typeEstimated?.beds && room.typeEstimated?.bedType) {
      return `${room.typeEstimated.beds} ${room.typeEstimated.bedType.toLowerCase().replace(/_/g, ' ')}`;
    }
    return `Sleeps ${room.capacity}`;
  };

  const groupOffersByRoomType = (offers: HotelOffer[]) => {
    const grouped = offers.reduce((groups, offer) => {
      const roomType = getRoomTypeName(offer.room);
      if (!groups[roomType]) {
        groups[roomType] = [];
      }
      groups[roomType].push(offer);
      return groups;
    }, {} as Record<string, HotelOffer[]>);

    // Sort offers within each room type by price
    Object.keys(grouped).forEach(roomType => {
      grouped[roomType].sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
    });

    return grouped;
  };

  const getRatePlanName = (offer: HotelOffer) => {
    const isCancellable = offer.policies.cancellation?.type === 'FREE_CANCELLATION';
    const hasBreakfast = offer.rateFamilyEstimated?.type?.includes('BREAKFAST') || 
                        offer.room.description?.toLowerCase().includes('breakfast');
    
    let planName = 'Standard Rate';
    
    if (hasBreakfast && isCancellable) {
      planName = 'Flexible with Breakfast';
    } else if (hasBreakfast) {
      planName = 'Non-refundable with Breakfast';
    } else if (isCancellable) {
      planName = 'Flexible Rate';
    } else {
      planName = 'Non-refundable Rate';
    }
    
    return planName;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="flex flex-col items-center justify-center h-40 space-y-4">
            <LoadingSpinner size="lg" text="Finding the best room options for you..." />
            <div className="text-sm text-muted-foreground text-center">
              <p>Checking {hotelName}</p>
              <p>{format(new Date(checkIn), 'MMM dd')} - {format(new Date(checkOut), 'MMM dd')} • {adults} Adults{children > 0 && `, ${children} Children`}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unable to load rooms</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => fetchOffers({ hotelId, checkIn, checkOut, adults, children, rooms, currency })}
              className="mt-4 w-full"
            >
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const groupedOffers = groupOffersByRoomType(offers);

  return (
    <ErrorBoundary>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {currentTab === 'rooms' ? `Choose your room at ${hotelName}` : 'Add extras to your stay'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {checkIn} - {checkOut} • {adults} adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''} • {rooms} room{rooms > 1 ? 's' : ''} • {nights} night{nights > 1 ? 's' : ''}
          </p>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'rooms' | 'addons')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms" className="flex items-center space-x-2">
              <Bed className="h-4 w-4" />
              <span>Choose Room</span>
            </TabsTrigger>
            <TabsTrigger 
              value="addons" 
              disabled={!selectedOffer}
              className="flex items-center space-x-2"
            >
              <Coffee className="h-4 w-4" />
              <span>Add Extras</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            {offers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No rooms available for the selected dates.</p>
                  <p className="text-sm text-muted-foreground mt-2">Please try different dates or contact the hotel directly.</p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedOffers).map(([roomType, roomOffers]) => (
                <Card key={roomType}>
                  <CardHeader>
                    <CardTitle className="text-lg">{roomType}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {roomOffers.map((offer) => (
                      <Card 
                        key={offer.id}
                        className={`cursor-pointer transition-all ${
                          selectedOffer?.id === offer.id 
                            ? 'ring-2 ring-primary border-primary' 
                            : 'hover:shadow-md border-muted'
                        }`}
                        onClick={() => handleOfferSelect(offer)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <h4 className="font-semibold">
                                  {getRatePlanName(offer)}
                                </h4>
                                {selectedOffer?.id === offer.id && (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                )}
                              </div>

                              <div className="grid md:grid-cols-2 gap-4 mb-3">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <Bed className="h-4 w-4" />
                                    <span>{getBedInfo(offer.room)}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Up to {offer.room.capacity} guests</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {offer.room.description && offer.room.description !== 'No description available' && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {offer.room.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-3">
                                {offer.policies.cancellation?.type === 'FREE_CANCELLATION' ? (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Free cancellation
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Non-refundable
                                  </Badge>
                                )}

                                {offer.policies.paymentType && (
                                  <Badge variant="outline">
                                    <Shield className="h-3 w-3 mr-1" />
                                    {offer.policies.paymentType.replace(/_/g, ' ')}
                                  </Badge>
                                )}
                              </div>

                              <div className="text-sm text-muted-foreground">
                                <p className="mb-1">{getCancellationText(offer.policies.cancellation)}</p>
                                {offer.price.taxes && offer.price.taxes.length > 0 && (
                                  <p>Includes taxes and fees</p>
                                )}
                              </div>
                            </div>

                            <div className="text-right space-y-2 ml-6">
                              <div>
                                <p className="text-sm text-muted-foreground">Total for your stay</p>
                                 <p className="text-xl font-bold text-foreground">
                                   {formatCurrency(parseFloat(offer.price.total), offer.price.currency)}
                                 </p>
                                 <p className="text-sm text-muted-foreground">
                                   {formatCurrency(parseFloat(offer.price.total) / nights, offer.price.currency)} per night
                                 </p>
                              </div>

                              {offer.price.base !== offer.price.total && (
                                <div className="text-xs text-muted-foreground">
                                     <p>Base: {formatCurrency(parseFloat(offer.price.base), offer.price.currency)}</p>
                                     {offer.price.taxes && offer.price.taxes.length > 0 && (
                                       <p>Taxes: {formatCurrency(offer.price.taxes.reduce((sum, tax) => sum + parseFloat(tax.amount), 0), offer.price.currency)}</p>
                                     )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="addons" className="space-y-6">
            {selectedOffer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Selected Room</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentTab('rooms')}
                    >
                      Change Room
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{getRoomTypeName(selectedOffer.room)}</h4>
                      <p className="text-sm text-muted-foreground">{getRatePlanName(selectedOffer)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(parseFloat(selectedOffer.price.total), selectedOffer.price.currency)}</p>
                      <p className="text-sm text-muted-foreground">for {nights} nights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

                <AddOnsSelector
                  addOns={ancillaryServices || mockAddOns}
                  selectedAddOns={selectedAddOnIds}
                  onAddOnsChange={setSelectedAddOnIds}
                  nights={nights}
                  currency={currency}
                />

            {getSelectedAddOnsPrice() > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center font-medium">
                    <span>Add-ons total:</span>
                    <span>{formatCurrency(getSelectedAddOnsPrice(), currency)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {offers.length > 0 && (
          <div className="flex justify-between items-center pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Back to search
            </Button>
            
            {currentTab === 'rooms' ? (
              <Button 
                onClick={handleContinueToAddOns}
                disabled={!selectedOffer}
              >
                Continue to extras
                {selectedOffer && (
                  <span className="ml-2">
                    {formatCurrency(parseFloat(selectedOffer.price.total), selectedOffer.price.currency)}
                  </span>
                )}
              </Button>
            ) : (
              <Button 
                onClick={() => setShowConfirmation(true)}
                disabled={!selectedOffer || isProcessing}
                className="btn-primary"
              >
                {isProcessing ? "Processing..." : "Continue to checkout"}
                <span className="ml-2">
                  {formatCurrency(getTotalPrice(), selectedOffer?.price?.currency || currency)}
                </span>
              </Button>
            )}
          </div>
        )}
        </DialogContent>

        <ConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleContinueToCheckout}
          title="Confirm Your Selection"
          description={`Proceed to checkout with ${selectedOffer ? getRoomTypeName(selectedOffer.room) : 'selected room'} at ${hotelName}? Your selection will be saved and you can modify it before final payment.`}
          confirmText="Continue to Checkout"
          cancelText="Review Selection"
          variant="default"
          isLoading={isProcessing}
        />
      </Dialog>
    </ErrorBoundary>
  );
};