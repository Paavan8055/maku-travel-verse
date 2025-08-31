
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Plane, Hotel, FileText, Calendar, MapPin } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface TravelDocument {
  id: string;
  type: 'flight' | 'hotel';
  title: string;
  bookingReference: string;
  status: string;
  date: string;
  destination: string;
  hasTicket: boolean;
  hasConfirmation: boolean;
}

export function TravelDocuments() {
  const { bookings, loading } = useBookings();
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  const handleDownload = async (bookingId: string, docType: 'ticket' | 'confirmation') => {
    setDownloadingDoc(`${bookingId}-${docType}`);
    
    try {
      // Simulate document generation/download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would call an API to generate/download the document
      const filename = docType === 'ticket' ? 'e-ticket.pdf' : 'hotel-confirmation.pdf';
      
      // Create a mock download
      const link = document.createElement('a');
      link.href = '#';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleView = (bookingId: string, docType: 'ticket' | 'confirmation') => {
    // In a real implementation, this would open a modal or navigate to a view page
    console.log(`Viewing ${docType} for booking ${bookingId}`);
  };

  const getDocuments = (): TravelDocument[] => {
    if (!bookings) return [];
    
    return bookings.map(booking => ({
      id: booking.id,
      type: booking.booking_type as 'flight' | 'hotel',
      title: booking.booking_type === 'flight' 
        ? `Flight ${booking.booking_data?.flightNumber || 'Booking'}`
        : booking.booking_data?.hotel?.hotel || booking.booking_data?.hotelName || 'Hotel Booking',
      bookingReference: booking.booking_reference,
      status: booking.status,
      date: booking.booking_type === 'flight'
        ? booking.booking_data?.departureDate || booking.created_at
        : booking.booking_data?.checkInDate || booking.booking_data?.checkIn || booking.created_at,
      destination: booking.booking_type === 'flight'
        ? `${booking.booking_data?.origin || ''} → ${booking.booking_data?.destination || ''}`
        : booking.booking_data?.destination || booking.booking_data?.hotel?.hotel || 'Hotel',
      hasTicket: booking.booking_type === 'flight' && booking.status === 'confirmed',
      hasConfirmation: booking.status === 'confirmed'
    })).filter(doc => doc.hasTicket || doc.hasConfirmation);
  };

  const documents = getDocuments();

  if (loading) {
    return (
      <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Travel Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between p-3 border border-border/30 rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Travel Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium mb-1">No documents available</p>
            <p className="text-xs">Your tickets and confirmations will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Travel Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-3">
        {documents.slice(0, 2).map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-3 border border-border/30 rounded-lg hover:bg-muted/50 transition-colors bg-muted/30">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                {doc.type === 'flight' ? (
                  <Plane className="h-4 w-4 text-primary" />
                ) : (
                  <Hotel className="h-4 w-4 text-primary" />
                )}
              </div>
              
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                  <Badge 
                    variant={doc.status === 'confirmed' ? 'default' : 'secondary'}
                    className="text-xs px-2 py-0"
                  >
                    {doc.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 truncate">
                    <FileText className="h-3 w-3 flex-shrink-0" />
                    {doc.bookingReference}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    {format(new Date(doc.date), 'MMM dd')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {doc.type === 'flight' && doc.hasTicket && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc.id, 'ticket')}
                  disabled={downloadingDoc === `${doc.id}-ticket`}
                  className="text-xs px-2 py-1 h-auto"
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
              
              {doc.hasConfirmation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc.id, 'confirmation')}
                  disabled={downloadingDoc === `${doc.id}-confirmation`}
                  className="text-xs px-2 py-1 h-auto"
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {documents.length > 2 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground mt-2">
            View all {documents.length} documents
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
