
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, User, Menu, X, Globe, LogOut, Plane, Gift, MapPin, Rocket, Users as UsersIcon, ChevronDown, Shield, Coins, Heart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast, toast } from "@/hooks/use-toast";
import { useApiHealth } from "@/hooks/useApiHealth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SystemHealthIndicator } from "@/components/SystemHealthIndicator";
import { useHealthMonitor } from "@/hooks/useHealthMonitor";


const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();
  const { apiHealth, isActivitiesAvailable } = useApiHealth();
  const { health, isUnhealthy } = useHealthMonitor({ 
    enableAutoCheck: true,
    onStatusChange: (status) => {
      if (status.status === 'unhealthy') {
        toast({
          title: "Service Issues Detected",
          description: "Some services may be temporarily unavailable",
          variant: "destructive",
        });
      }
    }
  });
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const { toast: toastFn } = useToast();

  const handleSignOut = async () => {
    try {
      const {
        error
      } = await signOut();
      if (error) {
        toastFn({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive"
        });
      } else {
        toastFn({
          title: "Signed out",
          description: "You have been successfully signed out"
        });
        navigate('/');
      }
    } catch (error) {
      toastFn({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border w-full" role="navigation" aria-label="Main navigation">
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/')}>
            <div className="text-4xl font-black font-cursive text-orange-400" aria-label="Maku Travel - Go to homepage">maku</div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8" role="menubar">
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/search/hotels')} role="menuitem">
              <span>{t('navigation.hotels')}</span>
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/search/flights')} role="menuitem">
              <Plane className="h-4 w-4" aria-hidden="true" />
              <span>{t('navigation.flights')}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary flex items-center space-x-1" 
              onClick={() => navigate('/search/activities')}
              role="menuitem"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>{t('navigation.activities')}</span>
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/travel-fund')} role="menuitem">
              <Coins className="h-4 w-4" aria-hidden="true" />
              <span>Travel Fund</span>
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/gift-cards')} role="menuitem">
              <Gift className="h-4 w-4" aria-hidden="true" />
              <span>Gift Cards</span>
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/roadmap')} role="menuitem">
              <Rocket className="h-4 w-4" aria-hidden="true" />
              <span>Roadmap</span>
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/partners')} role="menuitem">
              <UsersIcon className="h-4 w-4" aria-hidden="true" />
              <span>Partners</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" role="menuitem">
                  <span>Web3</span>
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/nft')}>NFT Collection</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/airdrop')}>Airdrop</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Environment Manager - Development Tool */}
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/environment-manager')} role="menuitem">
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span>Environment</span>
            </Button>

            {isAdmin && (
              <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/admin')} role="menuitem">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>Admin</span>
              </Button>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* System Health */}
            <SystemHealthIndicator />
            
            {/* Language Selector */}
            <LanguageSwitcher />

            {/* Help Link */}
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary text-sm flex items-center space-x-1"
              onClick={() => navigate('/help')}
            >
              <span>{t('navigation.help')}</span>
            </Button>

            {/* User Authentication */}
            {user ? <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Open user menu">
                     <Avatar className="h-8 w-8">
                       <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                       <AvatarFallback>
                         {user.email?.charAt(0).toUpperCase() || 'U'}
                       </AvatarFallback>
                     </Avatar>
                   </Button>
                 </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem className="flex-col items-start">
                    <div className="font-medium">{user.user_metadata?.first_name || 'User'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>{t('navigation.profile')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>My Bookings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/travel-fund')}>Travel Funds</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t('navigation.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : <Button onClick={() => navigate('/auth')} className="bg-travel-ocean hover:bg-travel-ocean/90 text-white px-6">
                {t('navigation.login')}
              </Button>}

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={t('accessibility.menuToggle')}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4 animate-slideIn">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                navigate('/search/hotels');
                setIsMenuOpen(false);
              }}>
                Hotels
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                navigate('/search/flights');
                setIsMenuOpen(false);
              }}>
                <Plane className="mr-2 h-4 w-4" />
                Flights
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => {
                  navigate('/search/activities');
                  setIsMenuOpen(false);
                }}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Activities
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                navigate('/travel-fund');
                setIsMenuOpen(false);
              }}>
                <Coins className="mr-2 h-4 w-4" />
                Travel Fund
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                navigate('/gift-cards');
                setIsMenuOpen(false);
              }}>
                <Gift className="mr-2 h-4 w-4" />
                Gift Cards
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                navigate('/roadmap');
                setIsMenuOpen(false);
              }}>
                <Rocket className="mr-2 h-4 w-4" />
                Roadmap
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                navigate('/partners');
                setIsMenuOpen(false);
              }}>
                <UsersIcon className="mr-2 h-4 w-4" />
                Partners
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                navigate('/nft');
                setIsMenuOpen(false);
              }}>
                NFT Collection
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                navigate('/airdrop');
                setIsMenuOpen(false);
              }}>
                Airdrop
              </Button>
              
              {/* Environment Manager - Development Tool */}
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                navigate('/environment-manager');
                setIsMenuOpen(false);
              }}>
                <Settings className="mr-2 h-4 w-4" />
                Environment
              </Button>

              {isAdmin && (
                <Button variant="ghost" className="w-full justify-start" onClick={() => {
                  navigate('/admin');
                  setIsMenuOpen(false);
                }}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
