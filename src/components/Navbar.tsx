import { useState } from "react";
import { Search, User, Menu, X, Globe, LogOut, Plane, Car, MapPin, Gift, Users as UsersIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState("EN");
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleSignOut = async () => {
    try {
      const {
        error
      } = await signOut();
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
  return <nav className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="text-2xl font-bold font-cursive text-orange-400">maku</div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/search/hotels')}>
              <span>Hotels</span>
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/search/flights')}>
              <Plane className="h-4 w-4" />
              <span>Flights</span>
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/search/activities')}>
              <MapPin className="h-4 w-4" />
              <span>Activities</span>
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/car-rental')}>
              <Car className="h-4 w-4" />
              <span>Car Rental</span>
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/deals')}>
              <Gift className="h-4 w-4" />
              <span>Deals</span>
            </Button>
            
            <Button variant="ghost" className="text-foreground hover:text-primary flex items-center space-x-1" onClick={() => navigate('/partners')}>
              <UsersIcon className="h-4 w-4" />
              <span>Partners</span>
            </Button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-16 h-8 border-none bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EN">EN</SelectItem>
                <SelectItem value="ES">ES</SelectItem>
                <SelectItem value="FR">FR</SelectItem>
                <SelectItem value="DE">DE</SelectItem>
              </SelectContent>
            </Select>

            {/* Help Link */}
            <Button variant="ghost" className="text-foreground hover:text-primary text-sm">
              Help
            </Button>

            {/* User Authentication */}
            {user ? <DropdownMenu>
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
              </DropdownMenu> : <Button onClick={() => navigate('/auth')} className="bg-travel-ocean hover:bg-travel-ocean/90 text-white px-6">
                Sign In
              </Button>}

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && <div className="md:hidden border-t border-border py-4 animate-slideIn">
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
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
            navigate('/search/activities');
            setIsMenuOpen(false);
          }}>
                <MapPin className="mr-2 h-4 w-4" />
                Activities
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
            navigate('/car-rental');
            setIsMenuOpen(false);
          }}>
                <Car className="mr-2 h-4 w-4" />
                Car Rental
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
            navigate('/deals');
            setIsMenuOpen(false);
          }}>
                <Gift className="mr-2 h-4 w-4" />
                Deals
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => {
            navigate('/partners');
            setIsMenuOpen(false);
          }}>
                <UsersIcon className="mr-2 h-4 w-4" />
                Partners
              </Button>
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navbar;