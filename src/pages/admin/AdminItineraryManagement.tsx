import { useState } from 'react';
import { Calendar, Users, MapPin, Download, Settings, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const mockItineraries = [
  {
    id: 'ITN-001',
    clientName: 'Smith Travel Group',
    destination: 'South India Circuit',
    groupSize: 10,
    duration: '9 days',
    status: 'confirmed',
    createdAt: '2025-01-15',
    totalCost: 650000
  },
  {
    id: 'ITN-002',
    clientName: 'Johnson Family',
    destination: 'Golden Triangle',
    groupSize: 6,
    duration: '7 days',
    status: 'pending',
    createdAt: '2025-01-14',
    totalCost: 420000
  },
  {
    id: 'ITN-003',
    clientName: 'Corporate Retreat',
    destination: 'Kerala Backwaters',
    groupSize: 25,
    duration: '5 days',
    status: 'draft',
    createdAt: '2025-01-12',
    totalCost: 1250000
  }
];

export default function AdminItineraryManagement() {
  const [selectedItinerary, setSelectedItinerary] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Itinerary Management</h1>
          <p className="text-muted-foreground">Manage custom itineraries and client requests</p>
        </div>
        <Button onClick={() => window.open('/trip-planner', '_blank')}>
          <Calendar className="mr-2 h-4 w-4" />
          Create New Itinerary
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Itineraries</p>
                <p className="text-2xl font-bold">127</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">89</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">23</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Revenue (₹)</p>
                <p className="text-2xl font-bold">45.2L</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itineraries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Itineraries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Group Size</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Cost (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockItineraries.map((itinerary) => (
                <TableRow key={itinerary.id}>
                  <TableCell className="font-medium">{itinerary.id}</TableCell>
                  <TableCell>{itinerary.clientName}</TableCell>
                  <TableCell>{itinerary.destination}</TableCell>
                  <TableCell>{itinerary.groupSize} people</TableCell>
                  <TableCell>{itinerary.duration}</TableCell>
                  <TableCell>₹{itinerary.totalCost.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(itinerary.status)}>
                      {itinerary.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{itinerary.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Itinerary
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}