import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Shield, 
  ExternalLink,
  Clock,
  MessageCircle
} from 'lucide-react';

interface SupplierContactInfoProps {
  supplier: {
    name: string;
    type: 'airline' | 'hotel' | 'activity' | 'transfer';
    code?: string;
    description?: string;
    logo?: string;
    contact: {
      phone?: string;
      email?: string;
      website?: string;
      address?: string;
      country?: string;
    };
    certifications?: string[];
    supportHours?: string;
    languages?: string[];
    rating?: {
      score: number;
      reviews: number;
    };
  };
  bookingReference?: string;
  emergencyContact?: boolean;
}

export const SupplierContactInfo: React.FC<SupplierContactInfoProps> = ({
  supplier,
  bookingReference,
  emergencyContact = false
}) => {
  const getSupplierTypeLabel = (type: string) => {
    switch (type) {
      case 'airline': return 'Airline';
      case 'hotel': return 'Hotel Chain';
      case 'activity': return 'Activity Provider';
      case 'transfer': return 'Transfer Service';
      default: return 'Service Provider';
    }
  };

  const getSupplierTypeIcon = (type: string) => {
    switch (type) {
      case 'airline': return '✈️';
      case 'hotel': return '🏨';
      case 'activity': return '🎯';
      case 'transfer': return '🚗';
      default: return '🏢';
    }
  };

  const handleContactClick = (type: 'phone' | 'email' | 'website', value: string) => {
    switch (type) {
      case 'phone':
        window.open(`tel:${value}`);
        break;
      case 'email':
        window.open(`mailto:${value}`);
        break;
      case 'website':
        window.open(value, '_blank', 'noopener,noreferrer');
        break;
    }
  };

  return (
    <Card className={emergencyContact ? "border-red-200 bg-red-50" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
              {supplier.logo ? (
                <img 
                  src={supplier.logo} 
                  alt={`${supplier.name} logo`}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) nextElement.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center text-2xl ${supplier.logo ? 'hidden' : ''}`}>
                {getSupplierTypeIcon(supplier.type)}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">{supplier.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{getSupplierTypeLabel(supplier.type)}</Badge>
                {supplier.code && (
                  <Badge variant="outline" className="text-xs">{supplier.code}</Badge>
                )}
                {emergencyContact && (
                  <Badge variant="destructive" className="text-xs">Emergency Contact</Badge>
                )}
              </div>
            </div>
          </div>
          {supplier.rating && (
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{supplier.rating.score}/5</div>
              <div className="text-xs text-muted-foreground">
                {supplier.rating.reviews.toLocaleString()} reviews
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {supplier.description && (
          <p className="text-sm text-muted-foreground">{supplier.description}</p>
        )}

        {/* Booking Reference */}
        {bookingReference && (
          <div className="bg-primary/5 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Your Booking Reference:</span>
              <code className="bg-primary/10 px-2 py-1 rounded text-sm font-mono">
                {bookingReference}
              </code>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use this reference when contacting the supplier about your booking.
            </p>
          </div>
        )}

        {/* Contact Methods */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Contact Information
          </h4>

          <div className="grid gap-2">
            {supplier.contact.phone && (
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start"
                onClick={() => handleContactClick('phone', supplier.contact.phone!)}
              >
                <Phone className="h-4 w-4 mr-2" />
                {supplier.contact.phone}
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            )}

            {supplier.contact.email && (
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start"
                onClick={() => handleContactClick('email', supplier.contact.email!)}
              >
                <Mail className="h-4 w-4 mr-2" />
                {supplier.contact.email}
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            )}

            {supplier.contact.website && (
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start"
                onClick={() => handleContactClick('website', supplier.contact.website!)}
              >
                <Globe className="h-4 w-4 mr-2" />
                Visit Website
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            )}
          </div>
        </div>

        {/* Address */}
        {supplier.contact.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground">{supplier.contact.address}</p>
              {supplier.contact.country && (
                <p className="text-muted-foreground">{supplier.contact.country}</p>
              )}
            </div>
          </div>
        )}

        {/* Support Hours */}
        {supplier.supportHours && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Support Hours:</span>
            <span className="font-medium">{supplier.supportHours}</span>
          </div>
        )}

        {/* Languages */}
        {supplier.languages && supplier.languages.length > 0 && (
          <div>
            <span className="text-sm text-muted-foreground">Languages supported: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {supplier.languages.map((language, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {language}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {supplier.certifications && supplier.certifications.length > 0 && (
          <div>
            <h5 className="font-medium text-sm flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              Certifications & Memberships
            </h5>
            <div className="flex flex-wrap gap-1">
              {supplier.certifications.map((cert, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Contact Notice */}
        {emergencyContact && (
          <div className="bg-red-100 border border-red-200 p-3 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Emergency Contact:</strong> This supplier provides 24/7 emergency support 
              for urgent booking issues, cancellations, or travel disruptions.
            </p>
          </div>
        )}

        {/* IATA/ATOL Notice */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          <p>
            This supplier operates under applicable travel industry regulations and consumer protection laws. 
            Your booking is protected according to the supplier's terms and conditions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};