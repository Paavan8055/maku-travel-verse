
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PiggyBank, 
  Users, 
  Target, 
  Calendar, 
  Plus, 
  Sparkles,
  Trophy,
  Gift,
  ArrowRight,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TravelFundPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [fundName, setFundName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");
  const [fundType, setFundType] = useState("");
  const [activeTab, setActiveTab] = useState("create");

  const handleCreateFund = () => {
    if (!fundName || !targetAmount || !targetDate || !fundType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to create your travel fund.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Fund Created!",
      description: `Your "${fundName}" travel fund has been created successfully.`,
    });

    // Navigate to dashboard after creation
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const existingFunds = [
    {
      id: 1,
      name: "Bali Family Trip 2025",
      target: 4500,
      current: 2850,
      members: 4,
      deadline: "2025-07-15",
      type: "Family"
    },
    {
      id: 2,
      name: "Solo Japan Adventure",
      target: 3200,
      current: 1200,
      members: 1,
      deadline: "2025-09-01",
      type: "Solo"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-6 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-['Playfair_Display']">
              Travel Fund Manager
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Save together, travel together. Create collaborative savings goals with family and friends.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="travel-card">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 text-travel-gold mx-auto mb-2" />
                <div className="text-2xl font-bold">AUD 1.2M</div>
                <div className="text-sm text-muted-foreground">Total Deposited</div>
              </CardContent>
            </Card>
            <Card className="travel-card">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-travel-ocean mx-auto mb-2" />
                <div className="text-2xl font-bold">3,200</div>
                <div className="text-sm text-muted-foreground">Active Groups</div>
              </CardContent>
            </Card>
            <Card className="travel-card">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-travel-adventure mx-auto mb-2" />
                <div className="text-2xl font-bold">AUD 750</div>
                <div className="text-sm text-muted-foreground">Avg. Fund Size</div>
              </CardContent>
            </Card>
            <Card className="travel-card">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 text-travel-coral mx-auto mb-2" />
                <div className="text-2xl font-bold">89%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create New Fund</TabsTrigger>
            <TabsTrigger value="existing">My Funds</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <Card className="travel-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Create Your Travel Fund
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fundName">Fund Name *</Label>
                      <Input
                        id="fundName"
                        placeholder="e.g., Bali Family Adventure 2025"
                        value={fundName}
                        onChange={(e) => setFundName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="targetAmount">Target Amount (AUD) *</Label>
                      <Input
                        id="targetAmount"
                        type="number"
                        placeholder="5000"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="targetDate">Target Date *</Label>
                      <Input
                        id="targetDate"
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="fundType">Fund Type *</Label>
                      <Select value={fundType} onValueChange={setFundType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fund type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="family">Family Adventures</SelectItem>
                          <SelectItem value="solo">Solo Journeys</SelectItem>
                          <SelectItem value="pet">Pet-Friendly Travel</SelectItem>
                          <SelectItem value="spiritual">Spiritual Retreats</SelectItem>
                          <SelectItem value="group">Group Travel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell us about your dream trip..."
                        rows={8}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Fund Benefits
                  </h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Collaborative saving with family and friends</li>
                    <li>• Milestone rewards and achievement badges</li>
                    <li>• Progress tracking and goal visualization</li>
                    <li>• Exclusive deals when you reach your target</li>
                    <li>• Secure savings with 2.5% annual interest</li>
                  </ul>
                </div>

                <Button 
                  className="w-full btn-primary" 
                  size="lg"
                  onClick={handleCreateFund}
                >
                  Create Travel Fund
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="existing" className="space-y-6">
            {existingFunds.length > 0 ? (
              <div className="grid gap-6">
                {existingFunds.map((fund) => (
                  <Card key={fund.id} className="travel-card">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{fund.name}</h3>
                          <Badge variant="secondary">{fund.type}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-travel-ocean">
                            AUD {fund.current.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            of AUD {fund.target.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <Progress 
                        value={(fund.current / fund.target) * 100} 
                        className="mb-4"
                      />

                      <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {fund.members} member{fund.members > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {new Date(fund.deadline).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button size="sm" className="btn-primary">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Money
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="travel-card">
                <CardContent className="p-12 text-center">
                  <PiggyBank className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Travel Funds Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first travel fund to start saving for your dream trip.
                  </p>
                  <Button 
                    onClick={() => setActiveTab("create")}
                    className="btn-primary"
                  >
                    Create Your First Fund
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TravelFundPage;
