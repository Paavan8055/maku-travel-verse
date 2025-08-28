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

const PartnerPortal = () => {
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold font-['Playfair_Display']">
                Partner <span className="hero-text">Portal</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your properties, bookings, and grow your business
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
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

          {/* Configure Integrations Dialog */}
          <Dialog open={isIntegrationsOpen} onOpenChange={setIsIntegrationsOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Connect with Maku.travel</DialogTitle>
                <DialogDescription>
                  Integrate your property management system with Maku's platform for real-time bookings and revenue optimization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                
                {/* Step 1: Get API Credentials */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                    <h3 className="font-semibold text-lg">Get Your Maku API Credentials</h3>
                  </div>
                  <div className="ml-8 space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2">Partner API Key (Test Mode)</p>
                      <div className="flex items-center space-x-2">
                        <Input value="pk_test_maku_partner_abc123xyz789" readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="sm">Copy</Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Use this key for testing integration</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2">Webhook Endpoint</p>
                      <div className="flex items-center space-x-2">
                        <Input value="https://api.maku.travel/partner/webhooks" readOnly className="font-mono text-sm" />
                        <Button variant="outline" size="sm">Copy</Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Send booking updates to this endpoint</p>
                    </div>
                  </div>
                </div>

                {/* Step 2: Configure Your PMS */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                    <h3 className="font-semibold text-lg">Configure Your Property Management System</h3>
                  </div>
                  <div className="ml-8 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pms-endpoint">Your PMS API Endpoint</Label>
                        <Input id="pms-endpoint" placeholder="https://your-pms.com/api/v1" />
                      </div>
                      <div>
                        <Label htmlFor="pms-key">Your PMS API Key</Label>
                        <Input id="pms-key" type="password" placeholder="Enter your PMS API key" />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Supported PMS: CloudBeds, Opera PMS, RoomKeyPMS, Booking.com Connectivity, Expedia Partner Central</p>
                    </div>
                  </div>
                </div>

                {/* Step 3: Test Connection */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                    <h3 className="font-semibold text-lg">Test Integration</h3>
                  </div>
                  <div className="ml-8">
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Test Connection & Sync Sample Data
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      We'll verify the connection and sync a test booking to ensure everything works correctly.
                    </p>
                  </div>
                </div>

                {/* Benefits Section */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Benefits of Integration:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-travel-forest mt-0.5" />
                      <span>Real-time inventory sync</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-travel-forest mt-0.5" />
                      <span>Automated booking confirmations</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-travel-forest mt-0.5" />
                      <span>Revenue optimization through bidding</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-travel-forest mt-0.5" />
                      <span>Analytics and performance reports</span>
                    </div>
                  </div>
                </div>

                {/* Support Section */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <p className="font-medium text-blue-900">Need Help?</p>
                  </div>
                  <p className="text-sm text-blue-800 mb-3">
                    Our integration team is here to help you get connected quickly.
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Support
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Schedule Call
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsIntegrationsOpen(false)}>Close</Button>
                <Button className="btn-primary" onClick={() => { 
                  toast({ 
                    title: 'Integration Started', 
                    description: 'Our team will reach out within 24 hours to complete setup.' 
                  }); 
                  setIsIntegrationsOpen(false); 
                }}>
                  Start Integration
                </Button>
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
                      <Bell className="h-5 w-5 mr-2" />
                      Recent Alerts
                      {notifications.filter(n => !n.read).length > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {notifications.filter(n => !n.read).length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {notifications.slice(0, 3).map((notification) => (
                        <div key={notification.id} className={`p-3 rounded-lg border ${!notification.read ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'}`}>
                          <div className="flex items-start space-x-2">
                            {notification.type === "booking" && <Calendar className="h-4 w-4 text-travel-ocean mt-1" />}
                            {notification.type === "review" && <Star className="h-4 w-4 text-travel-sunset mt-1" />}
                            {notification.type === "payment" && <CreditCard className="h-4 w-4 text-travel-forest mt-1" />}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notification.message}</p>
                              <p className="text-xs text-muted-foreground">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      View All Alerts
                    </Button>
                  </CardContent>
                </Card>

                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
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
                      <Button variant="outline" className="h-16 flex-col text-xs" onClick={() => { setActiveTab('listings'); toast({ title: 'Availability', description: 'Go to Listings to manage availability and rates' }); }}>
                        <Calendar className="h-5 w-5 mb-1" />
                        <span>Availability</span>
                      </Button>
                      <Button variant="outline" className="h-16 flex-col text-xs" onClick={() => setActiveTab('analytics')}>
                        <BarChart3 className="h-5 w-5 mb-1" />
                        <span>Reports</span>
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
                        } else {
                          toast({ title: 'No files selected', description: 'Please choose photos to upload' });
                        }
                        e.currentTarget.value = '';
                      }}
                    />
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-travel-ocean/10 to-travel-forest/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">API Status</span>
                        <div className="flex items-center space-x-1">
                          <div className="h-2 w-2 bg-travel-forest rounded-full"></div>
                          <span className="text-xs text-travel-forest">Connected</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Last sync</span>
                          <span className="text-muted-foreground">2 min ago</span>
                        </div>
                        <Progress value={95} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="listings" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">My Properties</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <Select value={supplierType} onValueChange={setSupplierType}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">Hotels & Resorts</SelectItem>
                        <SelectItem value="flight">Airlines & Jets</SelectItem>
                        <SelectItem value="car">Car Rentals</SelectItem>
                        <SelectItem value="activity">Tours & Activities</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="outline">{listings.length} active listings</Badge>
                  </div>
                </div>
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Property
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {listings.map((listing) => (
                  <Card key={listing.id} className="travel-card overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex">
                      <div className="relative">
                        <img
                          src={listing.image}
                          alt={listing.name}
                          className="w-48 h-40 object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          {listing.type === "Hotel" && <Building className="h-5 w-5 text-white bg-black/50 rounded p-1" />}
                          {listing.type === "Flight" && <Plane className="h-5 w-5 text-white bg-black/50 rounded p-1" />}
                          {listing.type === "Car" && <Car className="h-5 w-5 text-white bg-black/50 rounded p-1" />}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs">
                          {listing.images} photos
                        </div>
                      </div>
                      <CardContent className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold">{listing.name}</h4>
                            <div className="flex items-center text-muted-foreground text-sm">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{listing.location}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground text-xs mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Updated {listing.lastUpdated}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge variant="default">{listing.status}</Badge>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-current text-travel-sunset" />
                              <span className="text-xs font-medium">{listing.rating}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">This Month</p>
                            <p className="font-bold">{listing.bookings} bookings</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <p className="font-bold">{listing.revenue}</p>
                          </div>
                        </div>

                        {listing.type === "Hotel" && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Occupancy Rate</span>
                              <span className="font-medium">{listing.occupancy}%</span>
                            </div>
                            <Progress value={listing.occupancy} className="h-2" />
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex space-x-3 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Wifi className="h-3 w-3 mr-1" />
                              <span>WiFi</span>
                            </div>
                            <div className="flex items-center">
                              <Shield className="h-3 w-3 mr-1" />
                              <span>Verified</span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Camera className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bookings">
              <Card className="travel-card">
                <CardHeader>
                  <CardTitle>All Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="grid grid-cols-4 gap-4 flex-1">
                          <div>
                            <p className="font-semibold">{booking.id}</p>
                            <p className="text-sm text-muted-foreground">Booking ID</p>
                          </div>
                          <div>
                            <p className="font-semibold">{booking.guest}</p>
                            <p className="text-sm text-muted-foreground">Guest</p>
                          </div>
                          <div>
                            <p className="font-semibold">{booking.property}</p>
                            <p className="text-sm text-muted-foreground">Property</p>
                          </div>
                          <div>
                            <p className="font-semibold">{booking.checkIn}</p>
                            <p className="text-sm text-muted-foreground">Check-in</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold">{booking.amount}</p>
                            <Badge variant={booking.status === "Confirmed" ? "default" : "secondary"}>
                              {booking.status}
                            </Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="travel-card">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Revenue Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Last 6 Months</span>
                          <span className="text-lg font-bold text-travel-forest">+18.2%</span>
                        </div>
                        <div className="space-y-2">
                          {revenueData.map((data, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm">{data.month}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-travel-ocean h-2 rounded-full"
                                    style={{ width: `${(data.revenue / 30000) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium w-16 text-right">
                                  ${(data.revenue / 1000).toFixed(0)}k
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="travel-card">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Customer Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-semibold">Repeat Customers</p>
                            <p className="text-sm text-muted-foreground">Returning guests</p>
                          </div>
                          <span className="text-2xl font-bold text-travel-forest">34%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-semibold">Avg. Stay Length</p>
                            <p className="text-sm text-muted-foreground">Per booking</p>
                          </div>
                          <span className="text-2xl font-bold text-travel-ocean">3.2 days</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-semibold">Review Score</p>
                            <p className="text-sm text-muted-foreground">Average rating</p>
                          </div>
                          <span className="text-2xl font-bold text-travel-sunset">4.8</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-travel-ocean">96%</div>
                        <div className="text-sm text-muted-foreground">Booking Success Rate</div>
                        <Progress value={96} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-travel-forest">$2,340</div>
                        <div className="text-sm text-muted-foreground">Avg. Revenue per Booking</div>
                        <Progress value={78} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-travel-sunset">12.5h</div>
                        <div className="text-sm text-muted-foreground">Avg. Response Time</div>
                        <Progress value={85} className="mt-2" />
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">143</div>
                        <div className="text-sm text-muted-foreground">Total Reviews</div>
                        <Progress value={92} className="mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold">Notifications & Alerts</h3>
                  <Button variant="outline" size="sm" onClick={() => {
                    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
                    toast({ title: 'All alerts marked as read' });
                  }}>
                    Mark All as Read
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {notifications.map((notification) => (
                    <Card key={notification.id} className={`travel-card ${!notification.read ? 'border-travel-ocean' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="mt-1">
                              {notification.type === "booking" && (
                                <div className="h-8 w-8 bg-travel-ocean/20 rounded-full flex items-center justify-center">
                                  <Calendar className="h-4 w-4 text-travel-ocean" />
                                </div>
                              )}
                              {notification.type === "review" && (
                                <div className="h-8 w-8 bg-travel-sunset/20 rounded-full flex items-center justify-center">
                                  <Star className="h-4 w-4 text-travel-sunset" />
                                </div>
                              )}
                              {notification.type === "payment" && (
                                <div className="h-8 w-8 bg-travel-forest/20 rounded-full flex items-center justify-center">
                                  <CreditCard className="h-4 w-4 text-travel-forest" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{notification.message}</p>
                              <p className="text-sm text-muted-foreground">{notification.time}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <div className="h-2 w-2 bg-travel-ocean rounded-full"></div>
                            )}
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Alert Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Instant Booking Alerts</p>
                          <p className="text-sm text-muted-foreground">Get notified immediately for new bookings</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Low Inventory Warnings</p>
                          <p className="text-sm text-muted-foreground">Alert when availability drops below 20%</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Revenue Milestones</p>
                          <p className="text-sm text-muted-foreground">Celebrate when you hit revenue targets</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="travel-card">
                    <CardHeader>
                      <CardTitle>Company Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company-name">Company Name</Label>
                          <Input id="company-name" placeholder="Your company name" />
                        </div>
                        <div>
                          <Label htmlFor="contact-email">Contact Email</Label>
                          <Input id="contact-email" type="email" placeholder="contact@company.com" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" placeholder="+1 (555) 123-4567" />
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input id="website" placeholder="https://yourcompany.com" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Company Description</Label>
                        <Textarea id="description" placeholder="Tell us about your business..." />
                      </div>

                      <Button className="btn-primary">Update Profile</Button>
                    </CardContent>
                  </Card>

                  <Card className="travel-card">
                    <CardHeader>
                      <CardTitle>API Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Globe className="h-5 w-5 text-travel-ocean" />
                            <div>
                              <p className="font-medium">Booking Engine API</p>
                              <p className="text-sm text-muted-foreground">Real-time inventory sync</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-travel-forest" />
                            <span className="text-sm text-travel-forest">Connected</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-5 w-5 text-travel-sunset" />
                            <div>
                              <p className="font-medium">Payment Gateway</p>
                              <p className="text-sm text-muted-foreground">Stripe Connect</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-travel-forest" />
                            <span className="text-sm text-travel-forest">Active</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Bell className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">Notification Service</p>
                              <p className="text-sm text-muted-foreground">Email & SMS alerts</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-travel-sunset" />
                            <span className="text-sm text-travel-sunset">Setup Required</span>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full" onClick={() => setIsIntegrationsOpen(true)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Integrations
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>Communication Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Email Notifications</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">New Bookings</p>
                            <p className="text-sm text-muted-foreground">Instant email alerts for new reservations</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Cancellations</p>
                            <p className="text-sm text-muted-foreground">Alert for booking cancellations</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Payment Updates</p>
                            <p className="text-sm text-muted-foreground">Payout and commission notifications</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">SMS Notifications</h4>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Urgent Alerts</p>
                            <p className="text-sm text-muted-foreground">Critical issues requiring immediate attention</p>
                          </div>
                          <Switch />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Daily Summary</p>
                            <p className="text-sm text-muted-foreground">Daily performance summary</p>
                          </div>
                          <Switch />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Weekly Reports</p>
                            <p className="text-sm text-muted-foreground">Comprehensive weekly analytics</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button variant="outline">Reset to Defaults</Button>
                      <Button className="btn-primary">Save Preferences</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PartnerPortal;