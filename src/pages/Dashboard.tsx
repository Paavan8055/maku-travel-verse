import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Building, 
  MapPin, 
  Car,
  Calendar,
  Users,
  CreditCard,
  Bell,
  Search,
  Plus,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useBookings } from '@/hooks/useBookings';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, loading: bookingsLoading } = useBookings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Your flight to Bali is confirmed!', time: '2 hours ago' },
    { id: 2, message: 'Special hotel deals in Rome', time: 'Yesterday' },
  ]);

  const handleSearch = () => {
    // Implement search logic here, e.g., navigate to search page
    console.log('Searching for:', searchTerm);
    navigate(`/search?q=${searchTerm}`);
  };

  const handleNotificationClick = (id: number) => {
    // Mark notification as read or navigate to details
    console.log('Notification clicked:', id);
  };

  const quickActions = [
    { 
      icon: Plane, 
      label: 'Book Flight', 
      description: 'Find and book flights',
      onClick: () => navigate('/search/flights')
    },
    { 
      icon: Building, 
      label: 'Book Hotel', 
      description: 'Find and book hotels',
      onClick: () => navigate('/search/hotels')
    },
    { 
      icon: MapPin, 
      label: 'Activities', 
      description: 'Discover local activities',
      onClick: () => navigate('/search/activities')
    },
    { 
      icon: Car, 
      label: 'Car Rental', 
      description: 'Rent a car for your trip',
      onClick: () => navigate('/search/cars')
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          {/* Welcome Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold">
                  Welcome back, {user?.user_metadata?.name || user?.email || 'Guest'}!
                </h1>
                <p className="text-muted-foreground">
                  Explore new destinations and plan your next adventure.
                </p>
              </div>
              <div className="space-x-2">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Trip
                </Button>
                <Button variant="secondary" onClick={() => setShowNotifications(!showNotifications)}>
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <Badge className="ml-2">{notifications.length}</Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Notification Dropdown */}
            {showNotifications && (
              <Card className="absolute right-6 mt-2 w-80 shadow-md">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {notifications.length > 0 ? (
                    <ul className="space-y-2">
                      {notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className="flex items-center justify-between p-2 hover:bg-secondary cursor-pointer"
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          <div>
                            <p className="text-sm font-medium">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">{notification.time}</p>
                          </div>
                          <Star className="h-4 w-4 text-yellow-500" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No new notifications.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
          
          {/* Quick Actions */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={action.onClick}
                >
                  <CardContent className="p-4 text-center">
                    <action.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-medium mb-1">{action.label}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Recent Bookings */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Recent Bookings</h2>
            {bookingsLoading ? (
              <p>Loading bookings...</p>
            ) : bookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <CardTitle>{booking.booking_type}</CardTitle>
                      <CardDescription>
                        {new Date(booking.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Reference: {booking.booking_reference}</p>
                      <p>Status: {booking.status}</p>
                      <p>Amount: {booking.currency} {booking.total_amount}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p>No recent bookings found.</p>
            )}
          </section>

          {/* Travel Inspiration */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Travel Inspiration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-1">Explore Europe</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover the best of Europe with our curated travel guides.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-1">Beach Getaways</h3>
                  <p className="text-sm text-muted-foreground">
                    Find your perfect beach escape with our top-rated resorts.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-1">City Adventures</h3>
                  <p className="text-sm text-muted-foreground">
                    Experience the vibrant city life with our urban adventure tours.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
