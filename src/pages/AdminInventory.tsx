import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminInventory() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: h } = await supabase.from('custom_hotels').select('*');
      setHotels(h || []);
      const { data: f } = await supabase.from('custom_flights').select('*');
      setFlights(f || []);
      const { data: a } = await supabase.from('custom_activities').select('*');
      setActivities(a || []);
    };
    load();
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4">Inventory Management</h2>
        <Tabs defaultValue="hotels" className="space-y-4">
          <TabsList>
            <TabsTrigger value="hotels">Hotels</TabsTrigger>
            <TabsTrigger value="flights">Flights</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
          <TabsContent value="hotels">
            {hotels.map((h) => (
              <Card key={h.id} className="mb-2">
                <CardHeader>
                  <CardTitle>{h.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>Property Code: {h.property_code}</div>
                  <div>Base Price: {h.currency} {h.base_price_cents ? (h.base_price_cents / 100).toFixed(2) : ''}</div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="flights">
            {flights.map((f) => (
              <Card key={f.id} className="mb-2">
                <CardHeader>
                  <CardTitle>{f.airline_iata} {f.flight_number}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>Route: {f.origin_iata} → {f.destination_iata}</div>
                  <div>Price: {f.currency} {f.price_cents ? (f.price_cents / 100).toFixed(2) : ''}</div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="activities">
            {activities.map((act) => (
              <Card key={act.id} className="mb-2">
                <CardHeader>
                  <CardTitle>{act.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>Activity Code: {act.activity_code}</div>
                  <div>Price: {act.currency} {act.price_cents ? (act.price_cents / 100).toFixed(2) : ''}</div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
