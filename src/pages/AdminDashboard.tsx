import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, Settings, Shield, TrendingUp, 
  Building, Plane, MapPin, CheckCircle, XCircle, 
  Eye, Edit, AlertTriangle, Filter, Search,
  FileText, CreditCard, BarChart3, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [partners, setPartners] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPartners: 0,
    pendingApprovals: 0,
    platformRevenue: 0,
    activeBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: isAdmin, error } = await supabase.rpc('get_admin_status');
      if (error || !isAdmin) {
        navigate(user ? '/dashboard' : '/auth', { replace: true });
        return;
      }
      fetchDashboardData();
    };

    checkAdmin();
  }, [navigate, user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch partners
      const { data: partnersData, error: partnersError } = await supabase
        .from('partner_profiles')
        .select(`
          *,
          partner_onboarding_payments(*)
        `)
        .order('created_at', { ascending: false });

      if (partnersError) throw partnersError;

      setPartners(partnersData || []);

      // Calculate stats
      const totalPartners = partnersData?.length || 0;
      const pendingApprovals = partnersData?.filter(p => p.verification_status === 'pending').length || 0;
      
      // Calculate platform revenue from payments
      const { data: paymentsData } = await supabase
        .from('partner_onboarding_payments')
        .select('amount')
        .eq('status', 'succeeded');
      
      const platformRevenue = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      setStats({
        totalPartners,
        pendingApprovals,
        platformRevenue: platformRevenue / 100, // Convert from cents
        activeBookings: 0 // TODO: Add actual bookings count
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const adminStats = [
    { title: "Total Partners", value: stats.totalPartners.toString(), change: "+12%", icon: Users, color: "text-travel-ocean" },
    { title: "Platform Revenue", value: `A$${stats.platformRevenue.toLocaleString()}`, change: "+18%", icon: DollarSign, color: "text-travel-forest" },
    { title: "Pending Approvals", value: stats.pendingApprovals.toString(), change: "0%", icon: AlertTriangle, color: "text-travel-sunset" },
    { title: "Active Bookings", value: stats.activeBookings.toString(), change: "+5%", icon: BarChart3, color: "text-primary" }
  ];

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || partner.verification_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const approvePartner = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from('partner_profiles')
        .update({ 
          verification_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;

      toast({
        title: "Partner Approved",
        description: "Partner has been approved and notified."
      });

      // Refresh data
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve partner",
        variant: "destructive"
      });
    }
  };

  const rejectPartner = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from('partner_profiles')
        .update({ 
          verification_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;

      toast({
        title: "Partner Rejected",
        description: "Partner has been rejected and notified."
      });

      // Refresh data
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject partner",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthGuard redirectTo="/admin/auth">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="pt-24 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold font-['Playfair_Display']">
                  Admin <span className="hero-text">Dashboard</span>
                </h1>
                <p className="text-muted-foreground mt-2">
                  Platform administration and partner management
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="partners">Partners</TabsTrigger>
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {adminStats.map((stat, index) => (
                    <Card key={index} className="travel-card hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{stat.title}</p>
                            <p className="text-3xl font-bold">{stat.value}</p>
                            <p className={`text-sm ${stat.change.startsWith('+') ? 'text-travel-forest' : 'text-travel-sunset'}`}>
                              {stat.change}
                            </p>
                          </div>
                          <stat.icon className={`h-8 w-8 ${stat.color}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="travel-card">
                    <CardHeader>
                      <CardTitle>Recent Partner Registrations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loading ? (
                          <div className="text-center py-4">Loading...</div>
                        ) : partners.slice(0, 3).map((partner) => (
                          <div key={partner.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                {partner.business_type === 'hotel' && <Building className="h-5 w-5 text-primary" />}
                                {partner.business_type === 'airline' && <Plane className="h-5 w-5 text-primary" />}
                                {partner.business_type === 'activity' && <MapPin className="h-5 w-5 text-primary" />}
                              </div>
                              <div>
                                <p className="font-semibold">{partner.business_name}</p>
                                <p className="text-sm text-muted-foreground">{partner.contact_person}</p>
                              </div>
                            </div>
                            <Badge variant={
                              partner.verification_status === 'verified'
                                ? 'default'
                                : partner.verification_status === 'pending'
                                ? 'secondary'
                                : 'destructive'
                            }>
                              {partner.verification_status}
                            </Badge>
                          </div>
                        ))}
                        {!loading && partners.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">No partners registered yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="travel-card">
                    <CardHeader>
                      <CardTitle>Platform Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">This Month</span>
                          <span className="font-bold">A$12,340</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Commission Earned</span>
                          <span className="font-bold">A$4,567</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Onboarding Fees</span>
                          <span className="font-bold">A$2,997</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="partners" className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search partners..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Partners</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Partners Table */}
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>All Partners</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Business</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPartners.map((partner) => (
                          <TableRow key={partner.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{partner.business_name}</p>
                                <p className="text-sm text-muted-foreground">{partner.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {partner.business_type === 'hotel' && <Building className="h-4 w-4" />}
                                {partner.business_type === 'airline' && <Plane className="h-4 w-4" />}
                                {partner.business_type === 'activity' && <MapPin className="h-4 w-4" />}
                                <span className="capitalize">{partner.business_type}</span>
                              </div>
                            </TableCell>
                            <TableCell>{partner.contact_person}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  partner.verification_status === 'verified'
                                    ? 'default'
                                    : partner.verification_status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {partner.verification_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={partner.payment_status === 'paid' ? 'default' : 'secondary'}>
                                {partner.payment_status}
                              </Badge>
                            </TableCell>
                            <TableCell>A${partner.monthly_revenue.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPartner(partner);
                                    setIsPartnerModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="approvals" className="space-y-6">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-8">Loading pending approvals...</div>
                      ) : partners.filter(p => p.verification_status === 'pending').map((partner) => (
                        <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              {partner.business_type === 'hotel' && <Building className="h-6 w-6 text-primary" />}
                              {partner.business_type === 'airline' && <Plane className="h-6 w-6 text-primary" />}
                              {partner.business_type === 'activity' && <MapPin className="h-6 w-6 text-primary" />}
                            </div>
                            <div>
                              <h3 className="font-semibold">{partner.business_name}</h3>
                              <p className="text-sm text-muted-foreground">{partner.contact_person} • {partner.email}</p>
                              <p className="text-xs text-muted-foreground">Registered: {partner.created_at}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => approvePartner(partner.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => rejectPartner(partner.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!loading && partners.filter(p => p.verification_status === 'pending').length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No pending approvals</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financials">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>Financial Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Financial management interface coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Platform settings interface coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>Reports & Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Reports and analytics interface coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Partner Details Modal */}
        <Dialog open={isPartnerModalOpen} onOpenChange={setIsPartnerModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Partner Details</DialogTitle>
            </DialogHeader>
            {selectedPartner && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Business Information</h4>
                    <p><strong>Name:</strong> {selectedPartner.business_name}</p>
                    <p><strong>Type:</strong> {selectedPartner.business_type}</p>
                    <p><strong>Contact:</strong> {selectedPartner.contact_person}</p>
                    <p><strong>Email:</strong> {selectedPartner.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Status Information</h4>
                    <p><strong>Verification:</strong> {selectedPartner.verification_status}</p>
                    <p><strong>Payment:</strong> {selectedPartner.payment_status}</p>
                    <p><strong>Trial:</strong> {selectedPartner.trial_status}</p>
                    <p><strong>Documents:</strong> {selectedPartner.documents_verified ? 'Verified' : 'Pending'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Financial Information</h4>
                  <p><strong>Commission Rate:</strong> {selectedPartner.commission_rate}%</p>
                  <p><strong>Monthly Revenue:</strong> A${selectedPartner.monthly_revenue.toLocaleString()}</p>
                  <p><strong>Onboarding Fee:</strong> {selectedPartner.onboarding_fee_paid ? 'Paid' : 'Pending'}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Admin Notes</h4>
                  <Textarea placeholder="Add internal notes about this partner..." rows={3} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPartnerModalOpen(false)}>
                Close
              </Button>
              <Button>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
};

export default AdminDashboard;