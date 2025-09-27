
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, User, Menu, X, Globe, LogOut, Plane, Gift, MapPin, Rocket, Users as UsersIcon, ChevronDown, Shield, Coins, Heart, Calendar, Route } from "lucide-react";
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

          {/* Desktop Navigation - Simplified */}
          <div className="hidden md:flex items-center space-x-6" role="menubar">
            {/* Primary Travel Services */}
            <Button variant="ghost" className="text-foreground hover:text-primary font-medium" onClick={() => navigate('/search/hotels')} role="menuitem">
              {t('navigation.hotels')}
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary font-medium flex items-center gap-2" onClick={() => navigate('/search/flights')} role="menuitem">
              <Plane className="h-4 w-4" aria-hidden="true" />
              {t('navigation.flights')}
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary font-medium flex items-center gap-2" onClick={() => navigate('/search/activities')} role="menuitem">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {t('navigation.activities')}
            </Button>
            
            {/* Trip Planning */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-foreground hover:text-primary font-medium flex items-center gap-1" role="menuitem">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>Plan Trip</span>
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/itinerary-generator')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Personalized Itinerary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/trip-planner')}>
                  <Route className="mr-2 h-4 w-4" />
                  Custom Trip Planner
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* More Services */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-foreground hover:text-primary font-medium flex items-center gap-1" role="menuitem">
                  <span>More</span>
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/travel-fund')}>
                  <Coins className="mr-2 h-4 w-4" />
                  Travel Fund
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/gift-cards')}>
                  <Gift className="mr-2 h-4 w-4" />
                  Gift Cards
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/partners')}>
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Partners
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/roadmap')}>
                  <Rocket className="mr-2 h-4 w-4" />
                  Roadmap
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/nft')}>
                  <Heart className="mr-2 h-4 w-4" />
                  NFT Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/airdrop')}>
                  <Gift className="mr-2 h-4 w-4" />
                  Airdrop
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {isAdmin && (
              <Button variant="ghost" className="text-foreground hover:text-primary font-medium flex items-center gap-2" onClick={() => navigate('/admin')} role="menuitem">
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>Admin</span>
              </Button>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* User Authentication - Prominent */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-primary/20 hover:border-primary/40" aria-label="Open user menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem className="flex-col items-start py-3">
                    <div className="font-medium text-base">{user.user_metadata?.first_name || 'User'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="py-2">
                    <User className="mr-2 h-4 w-4" />
                    {t('navigation.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="py-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    My Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/travel-fund')} className="py-2">
                    <Coins className="mr-2 h-4 w-4" />
                    Travel Funds
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="py-2 text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('navigation.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/auth')}
                  className="hidden sm:inline-flex border-primary/20 text-primary hover:bg-primary/5"
                >
                  Sign Up
                </Button>
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 font-medium"
                >
                  {t('navigation.login')}
                </Button>
              </div>
            )}

            {/* Secondary Actions */}
            <div className="hidden lg:flex items-center space-x-2 ml-4 pl-4 border-l border-border">
              <SystemHealthIndicator />
              <LanguageSwitcher />
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/help')}
              >
                {t('navigation.help')}
              </Button>
            </div>

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
          <div className="md:hidden border-t border-border py-4 animate-slideIn bg-background/95 backdrop-blur-sm">
            <div className="space-y-1">
              {/* Auth Actions for Mobile - Top Priority */}
              {!user && (
                <div className="pb-3 mb-3 border-b border-border">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-2" 
                    onClick={() => {
                      navigate('/auth');
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign In / Sign Up
                  </Button>
                </div>
              )}

              {/* Primary Services */}
              <div className="space-y-1">
                <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">Book Travel</div>
                <Button variant="ghost" className="w-full justify-start py-3" onClick={() => {
                  navigate('/search/hotels');
                  setIsMenuOpen(false);
                }}>
                  Hotels
                </Button>
                <Button variant="ghost" className="w-full justify-start py-3" onClick={() => {
                  navigate('/search/flights');
                  setIsMenuOpen(false);
                }}>
                  <Plane className="mr-2 h-4 w-4" />
                  Flights
                </Button>
                <Button variant="ghost" className="w-full justify-start py-3" onClick={() => {
                  navigate('/search/activities');
                  setIsMenuOpen(false);
                }}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Activities
                </Button>
              </div>

              {/* Trip Planning */}
              <div className="space-y-1 pt-2">
                <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">Plan Your Trip</div>
                <Button variant="ghost" className="w-full justify-start py-3" onClick={() => {
                  navigate('/itinerary-generator');
                  setIsMenuOpen(false);
                }}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Personalized Itinerary
                </Button>
                <Button variant="ghost" className="w-full justify-start py-3" onClick={() => {
                  navigate('/trip-planner');
                  setIsMenuOpen(false);
                }}>
                  <Route className="mr-2 h-4 w-4" />
                  Custom Trip Planner
                </Button>
              </div>

              {/* Additional Services */}
              <div className="space-y-1 pt-2">
                <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">More Services</div>
                <Button variant="ghost" className="w-full justify-start py-3" onClick={() => {
                  navigate('/travel-fund');
                  setIsMenuOpen(false);
                }}>
                  <Coins className="mr-2 h-4 w-4" />
                  Travel Fund
                </Button>
                <Button variant="ghost" className="w-full justify-start py-3" onClick={() => {
                  navigate('/gift-cards');
                  setIsMenuOpen(false);
                }}>
                  <Gift className="mr-2 h-4 w-4" />
                  Gift Cards
                </Button>
                <Button variant="ghost" className="w-full justify-start py-3" onClick={() => {
                  navigate('/help');
                  setIsMenuOpen(false);
                }}>
                  Help & Support
                </Button>
              </div>

              {/* Admin Access */}
              {isAdmin && (
                <div className="pt-2 mt-2 border-t border-border">
                  <Button variant="ghost" className="w-full justify-start py-3 text-primary" onClick={() => {
                    navigate('/admin');
                    setIsMenuOpen(false);
                  }}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
