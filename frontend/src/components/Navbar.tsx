
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, User, Menu, X, Globe, LogOut, Plane, Gift, MapPin, Rocket, Users as UsersIcon, ChevronDown, Shield, Coins, Heart, Settings, Sparkles, Brain, Calendar, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast, toast } from "@/hooks/use-toast";
import { useApiHealth } from "@/hooks/useApiHealth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SystemHealthIndicator } from "@/components/SystemHealthIndicator";
import { useHealthMonitor } from "@/hooks/useHealthMonitor";
import { useAIIntelligence } from "@/hooks/useAIIntelligence";


const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSmartDreamDropdownOpen, setIsSmartDreamDropdownOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const { t } = useTranslation();
  const location = useLocation();
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

  // AI Intelligence integration for Smart Dreams status
  const { travelDNA, loading: aiLoading, error: aiError } = useAIIntelligence();

  // Viewport monitoring for responsive behavior  
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Check if Smart Dreams is active
  const isSmartDreamActive = location.pathname.includes('/smart-dreams');

  // Get AI status for Smart Dreams indicator
  const getAIStatus = () => {
    if (aiError) return { color: '#ff6b6b', text: '0%', description: 'AI Offline' };
    if (aiLoading) return { color: '#ffd93d', text: '...', description: 'AI Loading' };
    if (travelDNA) return { 
      color: '#51cf66', 
      text: `${Math.round(travelDNA.confidence_score * 100)}%`, 
      description: `${Math.round(travelDNA.confidence_score * 100)}% AI Match`
    };
    return { color: '#868e96', text: '0%', description: 'AI Ready' };
  };

  const aiStatus = getAIStatus();

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
    <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border w-full transition-all duration-300 ${isSmartDreamActive ? 'smart-dream-active' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="w-full px-6">
        <div className={`flex items-center justify-between transition-all duration-300 ${viewportWidth < 768 ? 'h-14' : viewportWidth < 1024 ? 'h-16' : 'h-18'}`}>
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/')}>
            <div className={`font-black font-cursive text-orange-400 transition-all duration-300 ${viewportWidth < 768 ? 'text-3xl' : 'text-4xl'}`} aria-label="Maku Travel - Go to homepage">maku</div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-4xl mx-8" role="menubar">
            <div className="flex items-center space-x-6">
              <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-orange-50 transition-all duration-200" onClick={() => navigate('/search/hotels')} role="menuitem">
                <span>Hotels</span>
              </Button>
              
              <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-orange-50 transition-all duration-200 flex items-center space-x-1" onClick={() => navigate('/search/flights')} role="menuitem">
                <Plane className="h-4 w-4" aria-hidden="true" />
                <span>Flights</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="text-foreground hover:text-primary hover:bg-orange-50 transition-all duration-200 flex items-center space-x-1" 
                onClick={() => navigate('/search/activities')}
                role="menuitem"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>Activities</span>
              </Button>
              
              {/* Smart Dreams - Enhanced with Dropdown */}
              <div className="relative">
                <DropdownMenu open={isSmartDreamDropdownOpen} onOpenChange={setIsSmartDreamDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`text-foreground hover:text-primary transition-all duration-200 flex items-center space-x-2 px-4 py-2 rounded-lg group ${
                        isSmartDreamActive 
                          ? 'bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600' 
                          : 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50'
                      }`}
                      role="menuitem"
                    >
                      <Sparkles className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
                      <span className="font-medium">Smart Dreams</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5">
                        New
                      </Badge>
                      <ChevronDown className="h-3 w-3 transition-transform duration-200" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-80 p-4 bg-white/95 backdrop-blur-md border border-orange-200 shadow-xl rounded-xl">
                    <div className="space-y-4">
                      {/* Header with AI Status */}
                      <div className="flex items-center justify-between pb-2 border-b border-orange-100">
                        <h3 className="font-semibold text-gray-900">Your Smart Journey</h3>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-2 h-2 rounded-full transition-colors duration-300" 
                              style={{ backgroundColor: aiStatus.color }}
                            />
                            <span className="text-xs text-gray-600">{aiStatus.description}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            navigate('/smart-dreams?tab=journey');
                            setIsSmartDreamDropdownOpen(false);
                          }}
                          className="flex flex-col items-center p-3 rounded-lg hover:bg-orange-50 transition-colors duration-200 group"
                        >
                          <MapPin className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-sm font-medium text-gray-900 mt-1">Start Journey</span>
                          <span className="text-xs text-gray-500 text-center">Plan your dream trip</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigate('/smart-dreams?tab=ai-dna');
                            setIsSmartDreamDropdownOpen(false);
                          }}
                          className="flex flex-col items-center p-3 rounded-lg hover:bg-purple-50 transition-colors duration-200 group"
                        >
                          <Brain className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-sm font-medium text-gray-900 mt-1">Travel DNA</span>
                          <span className="text-xs text-gray-500 text-center">Discover your style</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigate('/smart-dreams?tab=dreams');
                            setIsSmartDreamDropdownOpen(false);
                          }}
                          className="flex flex-col items-center p-3 rounded-lg hover:bg-pink-50 transition-colors duration-200 group"
                        >
                          <Sparkles className="h-5 w-5 text-pink-500 group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-sm font-medium text-gray-900 mt-1">Dream Places</span>
                          <span className="text-xs text-gray-500 text-center">Explore destinations</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigate('/smart-dreams?tab=planner');
                            setIsSmartDreamDropdownOpen(false);
                          }}
                          className="flex flex-col items-center p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 group"
                        >
                          <Calendar className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-sm font-medium text-gray-900 mt-1">AI Planner</span>
                          <span className="text-xs text-gray-500 text-center">Smart itinerary</span>
                        </button>
                      </div>
                      
                      {/* Main CTA */}
                      <button
                        onClick={() => {
                          navigate('/smart-dreams');
                          setIsSmartDreamDropdownOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                      >
                        <Zap className="h-4 w-4" />
                        <span>Open Smart Dreams</span>
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-orange-50 transition-all duration-200 flex items-center space-x-1" onClick={() => navigate('/travel-fund')} role="menuitem">
                <Coins className="h-4 w-4" aria-hidden="true" />
                <span>Travel Fund</span>
              </Button>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Secondary Navigation - Compact */}
            <div className="hidden lg:flex items-center space-x-2">
              {/* More Menu for Secondary Items */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-foreground hover:text-primary flex items-center space-x-1">
                    <span className="text-sm">More</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/gift-cards')}>
                    <Gift className="mr-2 h-4 w-4" />
                    Gift Cards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/roadmap')}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Roadmap
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/partners')}>
                    <UsersIcon className="mr-2 h-4 w-4" />
                    Partners
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/nft')}>NFT Collection</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/airdrop')}>Airdrop</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/environment-manager')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Environment
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* System Health */}
            <SystemHealthIndicator />
            
            {/* Language Selector */}
            <LanguageSwitcher />

            {/* Help Link */}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-foreground hover:text-primary text-sm hidden sm:flex"
              onClick={() => navigate('/help')}
            >
              <span>Help</span>
            </Button>

            {/* User Authentication */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Open user menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
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
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <Calendar className="mr-2 h-4 w-4" />
                    My Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/travel-fund')}>
                    <Coins className="mr-2 h-4 w-4" />
                    Travel Funds
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/smart-dreams')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Smart Dreams
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/auth')} className="bg-orange-500 hover:bg-orange-600 text-white px-6 transition-colors duration-200">
                Sign In
              </Button>
            )}

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
          <div className="md:hidden border-t border-border py-4 animate-slideIn bg-white/95 backdrop-blur-md">
            <div className="space-y-1">
              {/* Main Navigation */}
              <div className="space-y-1 pb-3 border-b border-gray-100">
                <Button variant="ghost" className="w-full justify-start hover:bg-orange-50" onClick={() => {
                  navigate('/search/hotels');
                  setIsMenuOpen(false);
                }}>
                  Hotels
                </Button>
                <Button variant="ghost" className="w-full justify-start hover:bg-orange-50" onClick={() => {
                  navigate('/search/flights');
                  setIsMenuOpen(false);
                }}>
                  <Plane className="mr-2 h-4 w-4" />
                  Flights
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start hover:bg-orange-50" 
                  onClick={() => {
                    navigate('/search/activities');
                    setIsMenuOpen(false);
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Activities
                </Button>
                
                {/* Smart Dreams - Enhanced Mobile */}
                <div className="space-y-2 py-2">
                  <Button 
                    variant="ghost" 
                    className={`w-full justify-start ${isSmartDreamActive ? 'bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600' : 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50'}`}
                    onClick={() => {
                      navigate('/smart-dreams');
                      setIsMenuOpen(false);
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span className="font-medium">Smart Dreams</span>
                    <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-600 text-xs">
                      New
                    </Badge>
                  </Button>
                  
                  {/* Smart Dreams Sub-menu */}
                  <div className="ml-4 space-y-1 pl-4 border-l border-orange-200">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start text-sm hover:bg-orange-50" 
                      onClick={() => {
                        navigate('/smart-dreams?tab=journey');
                        setIsMenuOpen(false);
                      }}
                    >
                      <MapPin className="mr-2 h-3 w-3" />
                      Start Journey
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start text-sm hover:bg-purple-50" 
                      onClick={() => {
                        navigate('/smart-dreams?tab=ai-dna');
                        setIsMenuOpen(false);
                      }}
                    >
                      <Brain className="mr-2 h-3 w-3" />
                      Travel DNA
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start text-sm hover:bg-pink-50" 
                      onClick={() => {
                        navigate('/smart-dreams?tab=dreams');
                        setIsMenuOpen(false);
                      }}
                    >
                      <Sparkles className="mr-2 h-3 w-3" />
                      Dream Places
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start text-sm hover:bg-blue-50" 
                      onClick={() => {
                        navigate('/smart-dreams?tab=planner');
                        setIsMenuOpen(false);
                      }}
                    >
                      <Calendar className="mr-2 h-3 w-3" />
                      AI Planner
                    </Button>
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full justify-start hover:bg-orange-50" onClick={() => {
                  navigate('/travel-fund');
                  setIsMenuOpen(false);
                }}>
                  <Coins className="mr-2 h-4 w-4" />
                  Travel Fund
                </Button>
              </div>
              
              {/* Secondary Navigation */}
              <div className="space-y-1 pt-3">
                <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => {
                  navigate('/gift-cards');
                  setIsMenuOpen(false);
                }}>
                  <Gift className="mr-2 h-4 w-4" />
                  Gift Cards
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => {
                  navigate('/roadmap');
                  setIsMenuOpen(false);
                }}>
                  <Rocket className="mr-2 h-4 w-4" />
                  Roadmap
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => {
                  navigate('/partners');
                  setIsMenuOpen(false);
                }}>
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Partners
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => {
                  navigate('/help');
                  setIsMenuOpen(false);
                }}>
                  Help
                </Button>
                
                {/* Admin/Dev Tools */}
                <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => {
                  navigate('/environment-manager');
                  setIsMenuOpen(false);
                }}>
                  <Settings className="mr-2 h-4 w-4" />
                  Environment
                </Button>

                {isAdmin && (
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => {
                    navigate('/admin');
                    setIsMenuOpen(false);
                  }}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
