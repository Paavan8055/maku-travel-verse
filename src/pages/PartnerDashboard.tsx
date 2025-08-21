
import { useState, useEffect, useRef } from "react";
import { 
  BarChart3, Building, Car, Plane, Users, TrendingUp, 
  DollarSign, Calendar, MapPin, Settings, Bell, Upload,
  Eye, Edit, Trash2, Plus, Star, Camera, Clock, 
  AlertTriangle, CheckCircle, XCircle, CreditCard,
  Wifi, Phone, Mail, Globe, Shield, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { useAuth } from "@/features/auth/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Type definition for dashboard data
interface DashboardData {
  current_month_bookings: number;
  current_month_revenue: number;
  active_properties: number;
  total_properties: number;
  recent_bookings: Array<{
    id: string;
    booking_value: number;
    commission_amount?: number;
    created_at: string;
    property_name: string;
  }>;
}

const PartnerDashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications, setNotifications] = useState([
    { id: 1, type: "booking", message: "New booking received for Ocean View Resort", time: "2 minutes ago", read: false },
    { id: 2, type: "review", message: "New 5-star review for Mountain Retreat", time: "1 hour ago", read: false },
    { id: 3, type: "payment", message: "Payment processed: $1,250", time: "3 hours ago", read: true }
  ]);
  const [supplierType, setSupplierType] = useState("hotel");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({ name: "", location: "", type: "Hotel" });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your partner account."
      });
    }
  };

    const [stats, setStats] = useState<any[]>([]);
    const [listings, setListings] = useState<any[]>([]);
    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState({ stats: true, listings: true, bookings: true });
    const [error, setError] = useState<{ stats?: string; listings?: string; bookings?: string }>({});

    useEffect(() => {
      if (!user) return;

      const fetchData = async () => {
        const { data: profile, error: profileError } = await supabase
          .from('partner_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profile) {
          const message = profileError?.message || 'Partner profile not found';
          setError({ stats: message, listings: message, bookings: message });
          setLoading({ stats: false, listings: false, bookings: false });
          return;
        }

        const partnerId = profile.id;

        const { data: dashboardData, error: dashboardError } = await supabase.rpc(
          'get_partner_dashboard_data',
          { p_partner_id: partnerId }
        );

        if (dashboardError || (dashboardData && typeof dashboardData === 'object' && 'error' in dashboardData)) {
          const msg = dashboardError?.message || (dashboardData as any)?.error || 'Failed to load metrics';
          setError((prev) => ({ ...prev, stats: msg, bookings: msg }));
        } else if (dashboardData && typeof dashboardData === 'object') {
          const data = dashboardData as DashboardData;
          setStats([
            {
              title: 'Total Bookings',
              value: String(data.current_month_bookings || 0),
              icon: Calendar,
              color: 'text-travel-ocean',
            },
            {
              title: 'Revenue',
              value: `$${(data.current_month_revenue || 0).toLocaleString()}`,
              icon: DollarSign,
              color: 'text-travel-forest',
            },
            {
              title: 'Active Listings',
              value: String(data.active_properties || 0),
              icon: Building,
              color: 'text-primary',
            },
            {
              title: 'Occupancy Rate',
              value: data.total_properties
                ? `${Math.round(((data.active_properties || 0) / (data.total_properties || 1)) * 100)}%`
                : '0%',
              icon: TrendingUp,
              color: 'text-travel-sunset',
            },
          ]);
          setRecentBookings(data.recent_bookings || []);
        }
        setLoading((prev) => ({ ...prev, stats: false, bookings: false }));

        const { data: listingsData, error: listingsError } = await supabase
          .from('partner_properties')
          .select('id, property_name, location, status, photos, updated_at, property_type')
          .eq('partner_id', partnerId);

        if (listingsError) {
          setError((prev) => ({ ...prev, listings: listingsError.message }));
        } else {
          const mappedListings = (listingsData || []).map((l: any) => ({
            id: l.id,
            name: l.property_name,
            type: l.property_type,
            location: typeof l.location === 'object' && l.location !== null
              ? [l.location.city, l.location.country].filter(Boolean).join(', ')
              : '',
            status: l.status || 'inactive',
            rating: 0,
            image: Array.isArray(l.photos) && l.photos.length > 0 ? l.photos[0] : 'https://via.placeholder.com/50',
            lastUpdated: l.updated_at ? new Date(l.updated_at).toLocaleString() : '',
          }));
          setListings(mappedListings);
        }
        setLoading((prev) => ({ ...prev, listings: false }));
      };

      fetchData();
    }, [user]);

  return (
    <AuthGuard redirectTo="/auth">
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="pt-24 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold font-['Playfair_Display']">
                  Partner <span className="hero-text">Dashboard</span>
                </h1>
                <p className="text-muted-foreground mt-2">
                  Welcome back, {user?.email} - Manage your properties and grow your business
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
                <Button className="btn-primary" onClick={() => setIsAddOpen(true)} aria-label="Add a new property">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>
            </div>

            {/* Add Property Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                  <DialogDescription>
                    Fill in details to create a new listing.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prop-name">Property Name</Label>
                      <Input id="prop-name" value={newProperty.name} onChange={(e) => setNewProperty(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ocean View Resort" />
                    </div>
                    <div>
                      <Label htmlFor="prop-location">Location</Label>
                      <Input id="prop-location" value={newProperty.location} onChange={(e) => setNewProperty(p => ({ ...p, location: e.target.value }))} placeholder="City, Country" />
                    </div>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={newProperty.type} onValueChange={(v) => setNewProperty(p => ({ ...p, type: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hotel">Hotel</SelectItem>
                        <SelectItem value="Flight">Flight</SelectItem>
                        <SelectItem value="Car">Car Rental</SelectItem>
                        <SelectItem value="Activity">Activity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button className="btn-primary" onClick={() => {
                    toast({ title: "Property created", description: `${newProperty.name || 'Untitled'} in ${newProperty.location || 'Unknown'}` });
                    setIsAddOpen(false);
                    setNewProperty({ name: "", location: "", type: "Hotel" });
                  }}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-8">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="listings">My Listings</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="notifications">Alerts</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {loading.stats ? (
                    <p className="col-span-full text-center text-muted-foreground">Loading statistics...</p>
                  ) : error.stats ? (
                    <p className="col-span-full text-center text-destructive">Failed to load statistics.</p>
                  ) : stats.length === 0 ? (
                    <p className="col-span-full text-center text-muted-foreground">No statistics available.</p>
                  ) : (
                    stats.map((stat, index) => (
                      <Card key={index} className="travel-card hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">{stat.title}</p>
                              <p className="text-3xl font-bold">{stat.value}</p>
                              {stat.change && (
                                <p className={`text-sm ${stat.change.startsWith('+') ? 'text-travel-forest' : 'text-travel-sunset'}`}>
                                  {stat.change}
                                </p>
                              )}
                            </div>
                            <stat.icon className={`h-8 w-8 ${stat.color}`} />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="travel-card">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Recent Bookings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loading.bookings ? (
                          <p className="text-sm text-muted-foreground">Loading bookings...</p>
                        ) : error.bookings ? (
                          <p className="text-sm text-destructive">Failed to load bookings.</p>
                        ) : recentBookings.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No recent bookings.</p>
                        ) : (
                          recentBookings.map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                              <div>
                                <p className="font-semibold">{booking.property_name}</p>
                                <p className="text-xs text-muted-foreground">{new Date(booking.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">${Number(booking.booking_value ?? 0).toFixed(2)}</p>
                                {booking.commission_amount !== undefined && (
                                  <Badge variant="secondary">${Number(booking.commission_amount ?? 0).toFixed(2)}</Badge>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <Button variant="outline" className="w-full mt-4" size="sm">
                        View All Bookings
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="travel-card">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        My Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {loading.listings ? (
                          <p className="text-sm text-muted-foreground">Loading properties...</p>
                        ) : error.listings ? (
                          <p className="text-sm text-destructive">Failed to load properties.</p>
                        ) : listings.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No properties found.</p>
                        ) : (
                          listings.slice(0, 3).map((listing) => (
                            <div key={listing.id} className="p-3 rounded-lg border border-border">
                              <div className="flex items-start space-x-3">
                                <img
                                  src={listing.image}
                                  alt={listing.name}
                                  className="w-12 h-12 rounded object-cover"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{listing.name}</p>
                                  <p className="text-xs text-muted-foreground">{listing.location}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <Badge variant="outline" className="text-xs">{listing.status}</Badge>
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-3 w-3 fill-current text-travel-sunset" />
                                      <span className="text-xs">{listing.rating}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => setActiveTab('listings')}>
                        Manage All Properties
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="travel-card">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="h-16 flex-col text-xs" onClick={() => setIsAddOpen(true)}>
                          <Building className="h-5 w-5 mb-1" />
                          <span>Add Property</span>
                        </Button>
                        <Button variant="outline" className="h-16 flex-col text-xs" onClick={() => fileInputRef.current?.click()}>
                          <Camera className="h-5 w-5 mb-1" />
                          <span>Upload Photos</span>
                        </Button>
                        <Button variant="outline" className="h-16 flex-col text-xs" onClick={() => setActiveTab('analytics')}>
                          <BarChart3 className="h-5 w-5 mb-1" />
                          <span>View Analytics</span>
                        </Button>
                        <Button variant="outline" className="h-16 flex-col text-xs" onClick={() => setActiveTab('settings')}>
                          <Settings className="h-5 w-5 mb-1" />
                          <span>Settings</span>
                        </Button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const count = e.target.files?.length || 0;
                          if (count) {
                            toast({ title: 'Photos selected', description: `${count} photo${count > 1 ? 's' : ''} ready to upload` });
                          }
                          e.currentTarget.value = '';
                        }}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="listings">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>My Properties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Property management interface coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>All Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Booking management interface coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>Analytics & Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>Notifications & Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Notification center coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={user?.email || ''} disabled />
                      </div>
                      <div>
                        <Label htmlFor="company">Company Name</Label>
                        <Input id="company" placeholder="Your company name" />
                      </div>
                      <Button className="btn-primary">Update Profile</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default PartnerDashboard;
