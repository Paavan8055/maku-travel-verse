import { useState } from "react";
import { Search, User, ShoppingCart, Menu, X, Globe, Heart, Users, Dog, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const marketplaces = [
    { name: "Family", icon: Users, color: "text-travel-ocean", description: "Perfect family getaways" },
    { name: "Solo", icon: User, color: "text-travel-adventure", description: "Adventures for solo travelers" },
    { name: "Pet", icon: Dog, color: "text-travel-forest", description: "Pet-friendly destinations" },
    { name: "Spiritual", icon: Sparkles, color: "text-travel-gold", description: "Mindful travel experiences" }
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been successfully signed out"
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <nav className="floating-nav fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl mx-auto">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Globe className="h-8 w-8 text-primary animate-pulse-soft" />
          <span className="text-2xl font-bold hero-text font-['Playfair_Display']">Maku.travel</span>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Where do you want to go?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input pl-11 pr-4 py-3 text-lg w-full"
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-foreground hover:text-primary">
                  Explore
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-80">
                    {marketplaces.map((marketplace) => (
                      <div 
                        key={marketplace.name} 
                        className="group cursor-pointer"
                        onClick={() => navigate(`/search?vertical=${marketplace.name.toLowerCase()}`)}
                      >
                        <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-muted transition-colors">
                          <marketplace.icon className={`h-6 w-6 ${marketplace.color}`} />
                          <div>
                            <div className="font-semibold">{marketplace.name}</div>
                            <div className="text-sm text-muted-foreground">{marketplace.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Button 
            variant="ghost" 
            className="text-foreground hover:text-primary"
            onClick={() => navigate('/hotels')}
          >
            Deals
          </Button>
          
          <Button 
            variant="ghost" 
            className="text-foreground hover:text-primary"
            onClick={() => navigate('/dashboard')}
          >
            Travel Fund
          </Button>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-travel-coral text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                2
              </span>
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>My Bookings</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-foreground hover:text-primary"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border mt-4 pt-4 px-6 pb-6 animate-slideIn">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Where do you want to go?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input pl-11 pr-4 py-3 w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {marketplaces.map((marketplace) => (
                <div key={marketplace.name} className="flex items-center space-x-2 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                  <marketplace.icon className={`h-5 w-5 ${marketplace.color}`} />
                  <span className="font-medium">{marketplace.name}</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="ghost">Deals</Button>
              <Button variant="ghost">Travel Fund</Button>
              {user ? (
                <Button variant="ghost" onClick={handleSignOut}>
                  Sign Out
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;