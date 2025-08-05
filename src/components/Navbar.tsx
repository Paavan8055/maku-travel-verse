import { useState } from "react";
import { Search, User, ShoppingCart, Menu, X, Globe, Heart, Users, Dog, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const marketplaces = [
    { name: "Family", icon: Users, color: "text-travel-ocean", description: "Perfect family getaways" },
    { name: "Solo", icon: User, color: "text-travel-adventure", description: "Adventures for solo travelers" },
    { name: "Pet", icon: Dog, color: "text-travel-forest", description: "Pet-friendly destinations" },
    { name: "Spiritual", icon: Sparkles, color: "text-travel-gold", description: "Mindful travel experiences" }
  ];

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
                      <div key={marketplace.name} className="group cursor-pointer">
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

          <Button variant="ghost" className="text-foreground hover:text-primary">
            Deals
          </Button>
          
          <Button variant="ghost" className="text-foreground hover:text-primary">
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
            
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
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
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;