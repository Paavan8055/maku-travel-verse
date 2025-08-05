import { useState } from "react";
import { 
  BarChart3, Building, Car, Plane, Users, TrendingUp, 
  DollarSign, Calendar, MapPin, Settings, Bell, Upload,
  Eye, Edit, Trash2, Plus
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
import Navbar from "@/components/Navbar";

const PartnerPortal = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const stats = [
    { title: "Total Bookings", value: "1,234", change: "+12%", icon: Calendar },
    { title: "Revenue", value: "$45,678", change: "+8%", icon: DollarSign },
    { title: "Occupancy Rate", value: "87%", change: "+5%", icon: TrendingUp },
    { title: "Active Listings", value: "12", change: "0%", icon: Building }
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
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=200&h=150&fit=crop"
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
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="travel-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                          <p className="text-3xl font-bold">{stat.value}</p>
                          <p className="text-sm text-travel-forest">{stat.change}</p>
                        </div>
                        <stat.icon className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-20 flex-col">
                        <Building className="h-6 w-6 mb-2" />
                        <span>Add Property</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <Upload className="h-6 w-6 mb-2" />
                        <span>Upload Photos</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <Calendar className="h-6 w-6 mb-2" />
                        <span>Update Calendar</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col">
                        <BarChart3 className="h-6 w-6 mb-2" />
                        <span>View Reports</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="listings" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">My Properties</h3>
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Property
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {listings.map((listing) => (
                  <Card key={listing.id} className="travel-card overflow-hidden">
                    <div className="flex">
                      <img
                        src={listing.image}
                        alt={listing.name}
                        className="w-48 h-40 object-cover"
                      />
                      <CardContent className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold">{listing.name}</h4>
                            <div className="flex items-center text-muted-foreground text-sm">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{listing.location}</span>
                            </div>
                          </div>
                          <Badge variant="default">{listing.status}</Badge>
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

                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">Rating:</span>
                            <span className="font-bold">{listing.rating}</span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
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
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>Performance Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Detailed analytics and insights coming soon. Track your property performance,
                      revenue trends, and customer feedback all in one place.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <Card className="travel-card">
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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

                    <div>
                      <Label htmlFor="description">Company Description</Label>
                      <Textarea id="description" placeholder="Tell us about your business..." />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Notification Preferences</h4>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">New Bookings</p>
                          <p className="text-sm text-muted-foreground">Get notified when you receive new bookings</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Cancellations</p>
                          <p className="text-sm text-muted-foreground">Get notified about booking cancellations</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Reviews</p>
                          <p className="text-sm text-muted-foreground">Get notified about new reviews</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <Button className="btn-primary">Save Settings</Button>
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