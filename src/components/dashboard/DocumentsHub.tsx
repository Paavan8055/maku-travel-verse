import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Plane, 
  Shield, 
  CreditCard,
  AlertTriangle,
  Upload,
  Download,
  Eye,
  Plus,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';

interface QuickAction {
  icon: React.ElementType;
  title: string;
  description: string;
  action: () => void;
  color: string;
}

export const DocumentsHub: React.FC<{ className?: string }> = ({ className }) => {
  const { documents, loading, expiringCount } = useDocuments();

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'boarding_pass':
        return <Plane className="h-4 w-4" />;
      case 'hotel_confirmation':
        return <FileText className="h-4 w-4" />;
      case 'passport':
      case 'visa':
        return <CreditCard className="h-4 w-4" />;
      case 'insurance':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'revoked':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const checkExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'active';
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 90) return 'expiring';
    return 'active';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const quickActions: QuickAction[] = [
    {
      icon: Upload,
      title: 'Upload Document',
      description: 'Add travel documents',
      action: () => console.log('Upload document'),
      color: 'text-travel-ocean'
    },
    {
      icon: Plane,
      title: 'Add Boarding Pass',
      description: 'Save flight details',
      action: () => console.log('Add boarding pass'),
      color: 'text-travel-sky'
    },
    {
      icon: Shield,
      title: 'Travel Insurance',
      description: 'Get coverage',
      action: () => console.log('Get insurance'),
      color: 'text-travel-forest'
    },
    {
      icon: CreditCard,
      title: 'Passport Renewal',
      description: 'Check requirements',
      action: () => console.log('Passport renewal'),
      color: 'text-travel-coral'
    }
  ];

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Travel Documents
          </h2>
          <p className="text-muted-foreground">Your digital travel wallet</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Expiry Alerts */}
      {expiringCount > 0 && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {expiringCount} document(s) expiring soon. Check your passport and visa validity.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
            onClick={action.action}
          >
            <action.icon className={`h-5 w-5 ${action.color}`} />
            <div className="text-center">
              <p className="text-sm font-medium">{action.title}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </Button>
        ))}
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Documents</h3>
        
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/50">
                        {getDocumentIcon(doc.document_type)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex justify-between">
                      <span>Date Added:</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                    {doc.expiry_date && (
                      <div className="flex justify-between">
                        <span>Expires:</span>
                        <span>{formatDate(doc.expiry_date)}</span>
                      </div>
                    )}
                    {doc.document_number && (
                      <div className="flex justify-between">
                        <span>Document #:</span>
                        <span className="font-mono text-xs">{doc.document_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Documents Yet</h3>
              <p className="text-muted-foreground mb-6">Start building your digital travel wallet</p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Document
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Travel Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-travel-forest" />
            Travel Document Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-travel-ocean/10">
              <h4 className="font-semibold mb-2 text-travel-ocean">Passport Validity</h4>
              <p className="text-sm text-muted-foreground">
                Many countries require 6+ months validity. Check requirements for each destination.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-travel-forest/10">
              <h4 className="font-semibold mb-2 text-travel-forest">Travel Insurance</h4>
              <p className="text-sm text-muted-foreground">
                Essential for international travel. Covers medical emergencies and trip cancellations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};