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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const verifyPartnerRole = async () => {
      if (!user) return;
      const { data: isPartner, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'partner'
      });
      if (error || !isPartner) {
        navigate('/dashboard');
      } else {
        setCheckingRole(false);
      }
    };

    verifyPartnerRole();
  }, [user, navigate]);

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

  const stats = [
    { title: "Total Bookings", value: "1,234", change: "+12%", icon: Calendar, color: "text-travel-ocean" },
    { title: "Revenue", value: "$45,678", change: "+8%", icon: DollarSign, color: "text-travel-forest" },
    { title: "Occupancy Rate", value: "87%", change: "+5%", icon: TrendingUp, color: "text-travel-sunset" },
    { title: "Active Listings", value: "12", change: "0%", icon: Building, color: "text-primary" }
  ];

  const revenueData = [
    { month: "Jan", revenue: 12000, bookings: 45 },
    { month: "Feb", revenue: 15000, bookings: 52 },
    { month: "Mar", revenue: 18000, bookings: 68 },
    { month: "Apr", revenue: 22000, bookings: 78 },
    { month: "May", revenue: 25000, bookings: 89 },
    { month: "Jun", revenue: 28000, bookings: 95 }
  ];

  const listings = [
    {
      id: "1",
      name: "Ocean View Resort",
      type: "Hotel",
      location: "Maldives",
      status: "Active",
      bookings: 45,
      revenue: "$12,450",
      rating: 4.8,
      occupancy: 87,
      images: 24,
      lastUpdated: "2 hours ago",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=150&fit=crop"
    },
    {
      id: "2", 
      name: "Mountain Retreat",
      type: "Hotel",
      location: "Swiss Alps",
      status: "Active",
      bookings: 32,
      revenue: "$8,960",
      rating: 4.9,
      occupancy: 92,
      images: 18,
      lastUpdated: "5 hours ago",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=200&h=150&fit=crop"
    },
    {
      id: "3",
      name: "Executive Jet Service",
      type: "Flight",
      location: "Global",
      status: "Active", 
      bookings: 78,
      revenue: "$35,200",
      rating: 4.7,
      occupancy: 75,
      images: 12,
      lastUpdated: "1 day ago",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&h=150&fit=crop"
    }
  ];

  const recentBookings = [
    { id: "B001", guest: "John Smith", property: "Ocean View Resort", checkIn: "2024-03-15", amount: "$450", status: "Confirmed" },
    { id: "B002", guest: "Sarah Johnson", property: "Mountain Retreat", checkIn: "2024-03-18", amount: "$320", status: "Pending" },
    { id: "B003", guest: "Mike Davis", property: "Ocean View Resort", checkIn: "2024-03-20", amount: "$450", status: "Confirmed" }
  ];

  return (
    <AuthGuard redirectTo="/auth">
      {checkingRole ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
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
                  {stats.map((stat, index) => (
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
                        {recentBookings.map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                            <div>
                              <p className="font-semibold">{booking.guest}</p>
                              <p className="text-sm text-muted-foreground">{booking.property}</p>
                              <p className="text-xs text-muted-foreground">{booking.checkIn}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{booking.amount}</p>
                              <Badge variant={booking.status === "Confirmed" ? "default" : "secondary"}>
                                {booking.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
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
                        {listings.slice(0, 3).map((listing) => (
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
                        ))}
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
      )}
    </AuthGuard>
  );
};

export default PartnerDashboard;
