import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Star
} from 'lucide-react';
import { useHotelOffers } from '@/hooks/useHotelOffers';
import { toast } from 'sonner';

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
  onRoomSelected: (selectedOffer: HotelOffer, hotel: Hotel) => void;
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
  const { offers, hotel, loading, error, fetchOffers } = useHotelOffers();

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

  const handleContinueToCheckout = () => {
    if (selectedOffer && hotel) {
      onRoomSelected(selectedOffer, hotel);
      onClose();
    }
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

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading room options...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Fetching available rooms...</span>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Choose your room at {hotelName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {checkIn} - {checkOut} • {adults} adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''} • {rooms} room{rooms > 1 ? 's' : ''}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {offers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No rooms available for the selected dates.</p>
                <p className="text-sm text-muted-foreground mt-2">Please try different dates or contact the hotel directly.</p>
              </CardContent>
            </Card>
          ) : (
            offers.map((offer) => (
              <Card 
                key={offer.id}
                className={`cursor-pointer transition-all ${
                  selectedOffer?.id === offer.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleOfferSelect(offer)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold">
                          {getRoomTypeName(offer.room)}
                        </h3>
                        {selectedOffer?.id === offer.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
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

                      <div className="flex flex-wrap gap-2 mb-4">
                        {offer.rateFamilyEstimated?.type && (
                          <Badge variant="secondary">
                            {offer.rateFamilyEstimated.type.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        
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
                      {offer.price.variations?.average && (
                        <p className="text-sm text-muted-foreground line-through">
                          {currency} {formatPrice(offer.price.variations.average.base)}
                        </p>
                      )}
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Total for your stay</p>
                        <p className="text-2xl font-bold text-foreground">
                          {currency} {formatPrice(offer.price.total)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currency} {formatPrice((parseFloat(offer.price.total) / ((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))).toString())} per night
                        </p>
                      </div>

                      {offer.price.base !== offer.price.total && (
                        <div className="text-xs text-muted-foreground">
                          <p>Base: {currency} {formatPrice(offer.price.base)}</p>
                          {offer.price.taxes && offer.price.taxes.length > 0 && (
                            <p>Taxes: {currency} {offer.price.taxes.reduce((sum, tax) => sum + parseFloat(tax.amount), 0).toFixed(2)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {offers.length > 0 && (
          <div className="flex justify-between items-center pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Back to search
            </Button>
            <Button 
              onClick={handleContinueToCheckout}
              disabled={!selectedOffer}
              className="btn-primary"
            >
              Continue to checkout
              {selectedOffer && (
                <span className="ml-2">
                  {currency} {formatPrice(selectedOffer.price.total)}
                </span>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};