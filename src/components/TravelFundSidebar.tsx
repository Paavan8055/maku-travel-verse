import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  Plus, 
  Minus, 
  TrendingUp, 
  MapPin, 
  Star, 
  Menu,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

interface Profile {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email?: string;
  trips_booked?: number;
  total_distance?: number;
  points?: number;
}

interface FundBalance {
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: 'top-up' | 'withdrawal';
  amount: number;
  status: string;
  created_at: string;
}

export const TravelFundSidebar: React.FC = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [balance, setBalance] = useState<FundBalance>({ balance: 0, currency: 'AUD' });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, email, trips_booked, total_distance, points')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_fund_balance', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      setBalance((data as unknown as FundBalance) || { balance: 0, currency: 'AUD' });
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_fund_transactions', {
        p_user_id: user.id,
        p_limit: 5
      });
      
      if (error) throw error;
      setTransactions((data as unknown as Transaction[]) || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to add to your fund.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-fund-topup', {
        body: { amount: parseFloat(topUpAmount) },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in new tab
      if (data.url) {
        window.open(data.url, '_blank');
        setIsTopUpOpen(false);
        setTopUpAmount('');
        
        toast({
          title: "Redirecting to Payment",
          description: "You'll be redirected to Stripe to complete your payment.",
        });
      }
    } catch (error) {
      console.error('Top-up error:', error);
      toast({
        title: "Top-up Failed",
        description: "Unable to process your top-up request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fund-withdrawal', {
        body: { amount: parseFloat(withdrawAmount) },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Withdrawal Requested",
          description: "Your withdrawal request has been submitted and will be processed within 2-3 business days.",
        });
        
        setIsWithdrawOpen(false);
        setWithdrawAmount('');
        
        // Refresh data
        await Promise.all([fetchBalance(), fetchTransactions()]);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Unable to process your withdrawal request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchProfile(), fetchBalance(), fetchTransactions()]);
    }
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const balanceChannel = supabase
      .channel('fund_balance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fund_balances',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchBalance();
        }
      )
      .subscribe();

    const transactionChannel = supabase
      .channel('fund_transaction_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fund_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(balanceChannel);
      supabase.removeChannel(transactionChannel);
    };
  }, [user]);

  if (!user) {
    return null;
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col space-y-6 p-6 bg-background border-r border-border">
      {/* Profile Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.email}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
              <span className="text-xs font-medium">{profile?.trips_booked || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Trips</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <TrendingUp className="h-3 w-3 text-muted-foreground mr-1" />
              <span className="text-xs font-medium">{profile?.total_distance || 0}km</span>
            </div>
            <p className="text-xs text-muted-foreground">Distance</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Star className="h-3 w-3 text-muted-foreground mr-1" />
              <span className="text-xs font-medium">{profile?.points || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Fund Balance */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm">
            <Wallet className="h-4 w-4 mr-2 text-primary" />
            Travel Fund Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(balance.balance)}
            </p>
            <p className="text-xs text-muted-foreground">Available Balance</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Funds
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Funds to Travel Fund</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="topup-amount">Amount (AUD)</Label>
                    <Input
                      id="topup-amount"
                      type="number"
                      placeholder="0.00"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <Button 
                    onClick={handleTopUp} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Processing...' : 'Add Funds'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Minus className="h-3 w-3 mr-1" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Withdraw from Travel Fund</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="withdraw-amount">Amount (AUD)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="1"
                      max={balance.balance}
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum: {formatCurrency(balance.balance)}
                    </p>
                  </div>
                  <Button 
                    onClick={handleWithdraw} 
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Minus className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Processing...' : 'Request Withdrawal'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No transactions yet
            </p>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  {transaction.type === 'top-up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownLeft className="h-3 w-3 text-red-500" />
                  )}
                  <div>
                    <p className="text-xs font-medium capitalize">
                      {transaction.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${
                    transaction.type === 'top-up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'top-up' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <Badge 
                    variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 fixed left-0 top-0 h-full z-40">
        <SidebarContent />
      </div>

      {/* Mobile Trigger */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="fixed top-4 left-4 z-50 bg-background/95 backdrop-blur-sm"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};