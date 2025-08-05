import { useState, useEffect } from "react";
import { 
  BarChart3, Building, Car, Plane, Users, TrendingUp, 
  DollarSign, Calendar, MapPin, Settings, Bell, Upload,
  Eye, Edit, Trash2, Plus, Star, Camera, Clock, 
  AlertTriangle, CheckCircle, XCircle, CreditCard,
  Wifi, Phone, Mail, Globe, Shield
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

const PartnerPortal = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications, setNotifications] = useState([
    { id: 1, type: "booking", message: "New booking received for Ocean View Resort", time: "2 minutes ago", read: false },
    { id: 2, type: "review", message: "New 5-star review for Mountain Retreat", time: "1 hour ago", read: false },
    { id: 3, type: "payment", message: "Payment processed: $1,250", time: "3 hours ago", read: true }
  ]);
  const [supplierType, setSupplierType] = useState("hotel");

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
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </div>
          </div>

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
                      <Button variant="outline" className="h-16 flex-col text-xs">
                        <Building className="h-5 w-5 mb-1" />
                        <span>Add Property</span>
                      </Button>
                      <Button variant="outline" className="h-16 flex-col text-xs">
                        <Camera className="h-5 w-5 mb-1" />
                        <span>Upload Photos</span>
                      </Button>
                      <Button variant="outline" className="h-16 flex-col text-xs">
                        <Calendar className="h-5 w-5 mb-1" />
                        <span>Availability</span>
                      </Button>
                      <Button variant="outline" className="h-16 flex-col text-xs">
                        <BarChart3 className="h-5 w-5 mb-1" />
                        <span>Reports</span>
                      </Button>
                    </div>
                    
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
                  <Button variant="outline" size="sm">
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

                      <Button variant="outline" className="w-full">
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