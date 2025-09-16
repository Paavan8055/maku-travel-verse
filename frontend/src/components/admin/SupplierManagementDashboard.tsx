import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Plane, 
  MapPin, 
  Car,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Partner {
  id: string;
  partner_name: string;
  partner_type: string;
  status: string;
  commission_rate: number;
  created_at: string;
  metadata: any;
}

interface CommissionData {
  partner_id: string;
  commission_amount: number;
  currency: string;
  payment_status: string;
  created_at: string;
}

export function SupplierManagementDashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load partners
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (partnersError) throw partnersError;

      // Load commission data
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commission_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (commissionsError) throw commissionsError;

      setPartners(partnersData || []);
      setCommissions(commissionsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load supplier management data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPartnerTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Building2 className="h-4 w-4" />;
      case 'flight': return <Plane className="h-4 w-4" />;
      case 'activity': return <MapPin className="h-4 w-4" />;
      case 'car_rental': return <Car className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'destructive';
      case 'suspended': return 'outline';
      default: return 'secondary';
    }
  };

  const calculateTotalCommissions = () => {
    return commissions.reduce((sum, commission) => sum + commission.commission_amount, 0);
  };

  const getPartnersByType = () => {
    const typeCount = partners.reduce((acc, partner) => {
      acc[partner.partner_type] = (acc[partner.partner_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return typeCount;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const partnersByType = getPartnersByType();
  const totalCommissions = calculateTotalCommissions();
  const activePartners = partners.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
          <p className="text-muted-foreground">
            Manage partnerships, commissions, and supplier relationships
          </p>
        </div>
        <Button>Add New Partner</Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners.length}</div>
            <p className="text-xs text-muted-foreground">
              {activePartners} active partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalCommissions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hotel Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partnersByType.hotel || 0}</div>
            <p className="text-xs text-muted-foreground">
              Hotel suppliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.4</div>
            <Progress value={84} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="partners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner Directory</CardTitle>
              <CardDescription>
                Manage your supplier and partner relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {partners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getPartnerTypeIcon(partner.partner_type)}
                      <div>
                        <h3 className="font-medium">{partner.partner_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {partner.partner_type} • {partner.commission_rate}% commission
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(partner.status)}>
                        {partner.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Tracking</CardTitle>
              <CardDescription>
                Monitor commission payments and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissions.slice(0, 10).map((commission, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">
                        ${commission.commission_amount.toLocaleString()} {commission.currency}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={commission.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {commission.payment_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Management</CardTitle>
              <CardDescription>
                Manage supplier contracts and agreements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Contract Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Advanced contract management features coming soon
                </p>
                <Button variant="outline">Set Up Contracts</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner Performance</CardTitle>
              <CardDescription>
                Analyze partner performance and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Performance Analytics</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed performance analytics and reporting tools
                </p>
                <Button variant="outline">View Analytics</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}