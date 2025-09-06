import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Settings, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface CalendarIntegration {
  id: string;
  provider: string;
  calendar_id: string;
  user_id: string;
  sync_enabled: boolean;
  sync_status: string;
  created_at: string;
  updated_at: string;
}

export function CalendarModule() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const { toast } = useToast();

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'meeting',
    start_time: '',
    end_time: '',
  });

  const [newIntegration, setNewIntegration] = useState({
    provider: '',
  });

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = async () => {
    try {
      setIsLoading(true);

      // Mock calendar events
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Team Standup',
          description: 'Daily team synchronization meeting',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
          event_type: 'meeting',
          user_id: 'user1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Client Presentation',
          description: 'Present Q4 roadmap to client',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          end_time: new Date(Date.now() + 90000000).toISOString(),
          event_type: 'presentation',
          user_id: 'user1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Mock calendar integrations
      const mockIntegrations: CalendarIntegration[] = [
        {
          id: '1',
          provider: 'google',
          calendar_id: 'primary',
          user_id: 'user1',
          sync_enabled: true,
          sync_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setEvents(mockEvents);
      setIntegrations(mockIntegrations);

    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      // Mock adding event
      const mockEvent: CalendarEvent = {
        id: Date.now().toString(),
        ...newEvent,
        user_id: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setEvents(prev => [...prev, mockEvent]);

      toast({
        title: 'Success',
        description: 'Event created successfully',
      });

      setShowEventDialog(false);
      setNewEvent({
        title: '',
        description: '',
        event_type: 'meeting',
        start_time: '',
        end_time: '',
      });

    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  const handleCreateIntegration = async () => {
    try {
      // Mock connecting calendar
      const mockIntegration: CalendarIntegration = {
        id: Date.now().toString(),
        provider: newIntegration.provider,
        calendar_id: 'primary',
        user_id: 'user1',
        sync_enabled: true,
        sync_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setIntegrations(prev => [...prev, mockIntegration]);

      toast({
        title: 'Success',
        description: `${newIntegration.provider} calendar connected successfully`,
      });

      setShowIntegrationDialog(false);
      setNewIntegration({ provider: '' });

    } catch (error) {
      console.error('Error connecting calendar:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect calendar',
        variant: 'destructive',
      });
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const todaysEvents = events.filter(event => 
    new Date(event.start_time).toDateString() === new Date().toDateString()
  );

  const upcomingEvents = events.filter(event => 
    new Date(event.start_time) > new Date() && 
    new Date(event.start_time).toDateString() !== new Date().toDateString()
  ).slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">
            Manage events, meetings, and agent schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Integrations
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Calendar Integration</DialogTitle>
                <DialogDescription>
                  Connect external calendar providers for synchronization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Select 
                    value={newIntegration.provider} 
                    onValueChange={(value) => setNewIntegration({...newIntegration, provider: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Calendar</SelectItem>
                      <SelectItem value="outlook">Microsoft Outlook</SelectItem>
                      <SelectItem value="caldav">CalDAV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateIntegration}>
                  Add Integration
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Schedule a new meeting or event.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="Event title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_type">Type</Label>
                    <Select 
                      value={newEvent.event_type} 
                      onValueChange={(value) => setNewEvent({...newEvent, event_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Event description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent({...newEvent, start_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={newEvent.end_time}
                      onChange={(e) => setNewEvent({...newEvent, end_time: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateEvent}>
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">All Events</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todaysEvents.length}</div>
                <p className="text-xs text-muted-foreground">
                  Events scheduled for today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{integrations.filter(i => i.sync_enabled).length}</div>
                <p className="text-xs text-muted-foreground">
                  {integrations.length} total integrations
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaysEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events scheduled for today</p>
                  ) : (
                    todaysEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.start_time).toLocaleTimeString()} - {new Date(event.end_time).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="outline">{event.event_type}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                  ) : (
                    upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.start_time).toLocaleDateString()} at {new Date(event.start_time).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="outline">{event.event_type}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Events</CardTitle>
              <CardDescription>
                Manage all calendar events and meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{event.title}</h3>
                        <Badge variant="outline">{event.event_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.start_time).toLocaleDateString()} at {new Date(event.start_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Integrations</CardTitle>
              <CardDescription>
                Connected calendar providers and sync status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration) => (
                  <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium capitalize">{integration.provider} Calendar</h3>
                        <p className="text-sm text-muted-foreground">
                          Calendar ID: {integration.calendar_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.sync_enabled ? "default" : "secondary"}>
                        {integration.sync_status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {integrations.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No calendar integrations configured yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}