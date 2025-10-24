import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  MapPin, 
  Calendar,
  DollarSign,
  Send,
  UserPlus,
  Vote,
  CheckCircle,
  Clock,
  Heart,
  MessageCircle,
  TrendingUp
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  avatar?: string;
  contribution?: number;
}

interface Destination {
  id: string;
  name: string;
  country: string;
  votes: number;
  votedBy: string[];
  addedBy: string;
}

interface TripPlan {
  id: string;
  name: string;
  participants: Participant[];
  destinations: Destination[];
  budget: {
    total: number;
    contributions: { [key: string]: number };
  };
  dates: {
    start: string;
    end: string;
  };
  status: 'planning' | 'voting' | 'confirmed';
}

export const CollaborativePlanning: React.FC = () => {
  const { toast } = useToast();
  const [tripName, setTripName] = useState('');
  const [activePlan, setActivePlan] = useState<TripPlan | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [myContribution, setMyContribution] = useState('');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Create new collaborative trip
  const createTrip = () => {
    if (!tripName.trim()) {
      toast({
        title: "Trip Name Required",
        description: "Please enter a name for your trip",
        variant: "destructive"
      });
      return;
    }

    const newPlan: TripPlan = {
      id: `trip_${Date.now()}`,
      name: tripName,
      participants: [{
        id: 'user_1',
        name: 'You',
        email: 'you@example.com',
        role: 'owner',
        contribution: 0
      }],
      destinations: [],
      budget: {
        total: 0,
        contributions: {}
      },
      dates: {
        start: '',
        end: ''
      },
      status: 'planning'
    };

    setActivePlan(newPlan);
    setTripName('');

    toast({
      title: "Trip Created! 🎉",
      description: `${newPlan.name} is ready for collaborative planning`,
    });
  };

  // Invite participant
  const inviteParticipant = () => {
    if (!inviteEmail.trim() || !activePlan) return;

    const newParticipant: Participant = {
      id: `user_${activePlan.participants.length + 1}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: 'editor',
      contribution: 0
    };

    setActivePlan({
      ...activePlan,
      participants: [...activePlan.participants, newParticipant]
    });

    setInviteEmail('');

    toast({
      title: "Invitation Sent! 📧",
      description: `Invited ${inviteEmail} to collaborate`,
    });
  };

  // Add destination
  const addDestination = () => {
    if (!newDestination.trim() || !activePlan) return;

    const destination: Destination = {
      id: `dest_${Date.now()}`,
      name: newDestination,
      country: 'TBD',
      votes: 1,
      votedBy: ['user_1'],
      addedBy: 'You'
    };

    setActivePlan({
      ...activePlan,
      destinations: [...activePlan.destinations, destination]
    });

    setNewDestination('');

    toast({
      title: "Destination Added! 📍",
      description: `${destination.name} added to the trip`,
    });
  };

  // Vote for destination
  const voteDestination = (destId: string) => {
    if (!activePlan) return;

    const updated = activePlan.destinations.map(dest => {
      if (dest.id === destId) {
        const alreadyVoted = dest.votedBy.includes('user_1');
        return {
          ...dest,
          votes: alreadyVoted ? dest.votes - 1 : dest.votes + 1,
          votedBy: alreadyVoted 
            ? dest.votedBy.filter(id => id !== 'user_1')
            : [...dest.votedBy, 'user_1']
        };
      }
      return dest;
    });

    setActivePlan({
      ...activePlan,
      destinations: updated
    });
  };

  // Add budget contribution
  const addContribution = () => {
    if (!myContribution.trim() || !activePlan) return;

    const amount = parseFloat(myContribution);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid contribution amount",
        variant: "destructive"
      });
      return;
    }

    setActivePlan({
      ...activePlan,
      budget: {
        total: activePlan.budget.total + amount,
        contributions: {
          ...activePlan.budget.contributions,
          'user_1': (activePlan.budget.contributions['user_1'] || 0) + amount
        }
      }
    });

    setMyContribution('');

    toast({
      title: "Contribution Added! 💰",
      description: `$${amount} added to trip budget`,
    });
  };

  if (!activePlan) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
            Collaborative Trip Planning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <Users className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Plan Your Next Adventure Together
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Create a collaborative trip plan, invite friends, vote on destinations, and pool your travel funds.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trip Name
              </label>
              <Input
                type="text"
                placeholder="e.g., Summer Europe Adventure 2025"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createTrip()}
                className="text-base"
              />
            </div>

            <Button
              onClick={createTrip}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Collaborative Trip
            </Button>
          </div>

          {/* Features Preview */}
          <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t">
            <div className="p-4 bg-blue-50 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600 mb-2" />
              <h4 className="font-semibold text-blue-900 text-sm">Invite Friends</h4>
              <p className="text-xs text-blue-700 mt-1">
                Collaborate with travel companions
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <Vote className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-semibold text-green-900 text-sm">Vote Together</h4>
              <p className="text-xs text-green-700 mt-1">
                Decide on destinations democratically
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
              <h4 className="font-semibold text-purple-900 text-sm">Pool Budget</h4>
              <p className="text-xs text-purple-700 mt-1">
                Track contributions and expenses
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600 mb-2" />
              <h4 className="font-semibold text-orange-900 text-sm">Real-time Sync</h4>
              <p className="text-xs text-orange-700 mt-1">
                Everyone sees updates instantly
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trip Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">{activePlan.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {activePlan.participants.length} collaborator{activePlan.participants.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Badge className="self-start sm:self-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2">
              {activePlan.status === 'planning' ? '📝 Planning' : 
               activePlan.status === 'voting' ? '🗳️ Voting' : '✅ Confirmed'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-orange-500" />
                Collaborators ({activePlan.participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Participant List */}
              <div className="space-y-2">
                {activePlan.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                        {participant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{participant.name}</p>
                        <p className="text-xs text-gray-600">{participant.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {participant.role}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Invite Input */}
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  type="email"
                  placeholder="friend@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && inviteParticipant()}
                  className="flex-1"
                />
                <Button onClick={inviteParticipant} size="sm" className="bg-orange-500 hover:bg-orange-600">
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
                Trip Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                <p className="text-sm text-green-700 mb-2">Total Pool</p>
                <p className="text-4xl font-bold text-green-600">
                  ${activePlan.budget.total.toFixed(2)}
                </p>
              </div>

              {/* Add Contribution */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount (USD)"
                  value={myContribution}
                  onChange={(e) => setMyContribution(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addContribution()}
                  className="flex-1"
                />
                <Button onClick={addContribution} size="sm" className="bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Contributions Breakdown */}
              {Object.keys(activePlan.budget.contributions).length > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">Contributions:</p>
                  {Object.entries(activePlan.budget.contributions).map(([userId, amount]) => (
                    <div key={userId} className="flex justify-between text-sm">
                      <span className="text-gray-600">You</span>
                      <span className="font-semibold text-green-600">${amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Destinations */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-blue-500" />
                Destination Voting ({activePlan.destinations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Destination */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Suggest a destination..."
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDestination()}
                  className="flex-1"
                />
                <Button onClick={addDestination} size="sm" className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Destinations List */}
              {activePlan.destinations.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {activePlan.destinations
                    .sort((a, b) => b.votes - a.votes)
                    .map((dest) => {
                      const hasVoted = dest.votedBy.includes('user_1');
                      return (
                        <div 
                          key={dest.id}
                          className="p-4 bg-white rounded-lg border-2 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{dest.name}</h4>
                              <p className="text-xs text-gray-600 mt-1">
                                Suggested by {dest.addedBy}
                              </p>
                            </div>
                            <Button
                              onClick={() => voteDestination(dest.id)}
                              variant={hasVoted ? "default" : "outline"}
                              size="sm"
                              className={hasVoted ? "bg-blue-500 hover:bg-blue-600" : ""}
                            >
                              <Heart className={`w-4 h-4 mr-1 ${hasVoted ? 'fill-current' : ''}`} />
                              {dest.votes}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No destinations yet</p>
                  <p className="text-xs mt-1">Be the first to suggest one!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
