import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Filter, SortAsc, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from "@/components/Navbar";
import { ActivityCard } from "@/features/search/components/ActivityCard";
import { useActivitySearch } from "@/features/search/hooks/useActivitySearch";
import { SearchResultsLayout } from "@/components/search/SearchResultsLayout";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";
import { ActivitySearchBar } from "@/components/search/ActivitySearchBar";
import { IntelligentActivityInfo } from "@/components/travel/IntelligentActivityInfo";
import { IntelligentActivitySearchForm } from "@/components/search/IntelligentActivitySearchForm";
import { useBackgroundPerformanceTracking } from "@/hooks/useBackgroundPerformanceTracking";
import { UnifiedTravelProvider } from "@/contexts/UnifiedTravelContext";
import { EnhancedSearchIntelligence } from "@/components/travel/EnhancedSearchIntelligence";
import { CrossModuleNavigator } from "@/components/travel/CrossModuleNavigator";

const ActivitySearchPage = () => {
  const [searchParams] = useSearchParams();
  const { measureInteraction } = useBackgroundPerformanceTracking('ActivitySearchPage');
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("price");
  const [priceRange, setPriceRange] = useState([0, 300]);
  const [filters, setFilters] = useState({
    category: [] as string[],
    duration: "any",
    difficulty: "any",
    ageGroup: "any",
    groupSize: "any",
    accessibility: [] as string[]
  });

  // State for search bar
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [checkIn, setCheckIn] = useState(() => {
    const dateStr = searchParams.get("checkIn");
    return dateStr ? new Date(dateStr) : new Date();
  });
  const [checkOut, setCheckOut] = useState(() => {
    const dateStr = searchParams.get("checkOut");
    return dateStr ? new Date(dateStr) : new Date();
  });
  const [adults, setAdults] = useState(parseInt(searchParams.get("adults") || "2"));
  const [children, setChildren] = useState(parseInt(searchParams.get("children") || "0"));

  const searchCriteria = {
    destination: destination || "",
    date: checkIn.toISOString().split('T')[0],
    participants: adults + children
  };

  const { activities, loading, error } = useActivitySearch(searchCriteria);

  const filteredAndSortedActivities = activities
    .filter(activity => {
      if (priceRange[0] > 0 && activity.price < priceRange[0]) return false;
      if (priceRange[1] < 300 && activity.price > priceRange[1]) return false;
      if (filters.category.length > 0 && !filters.category.includes(activity.category)) return false;
      if (filters.duration !== "any" && activity.duration !== filters.duration) return false;
      if (filters.difficulty !== "any" && activity.difficulty !== filters.difficulty) return false;
      if (filters.ageGroup !== "any" && activity.ageGroup !== filters.ageGroup) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "rating":
          return b.rating - a.rating;
        case "duration":
          return a.durationHours - b.durationHours;
        default:
          return 0;
      }
    });

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setFilters({...filters, category: [...filters.category, category]});
    } else {
      setFilters({...filters, category: filters.category.filter(c => c !== category)});
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("checkIn", checkIn.toISOString().split('T')[0]);
    if (checkOut) params.set("checkOut", checkOut.toISOString().split('T')[0]);
    if (adults > 0) params.set("adults", adults.toString());
    if (children > 0) params.set("children", children.toString());
    
    navigate(`/search/activities?${params.toString()}`);
  };

  return (
    <UnifiedTravelProvider>
      <PerformanceWrapper componentName="ActivitySearchPage">
        <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
        {/* Intelligent Activity Search Form */}
        <div className="mb-8">
          <IntelligentActivitySearchForm
            onSearch={(params) => {
              const searchParams = new URLSearchParams({
                destination: params.destination,
                checkIn: params.date,
                adults: params.adults.toString(),
                children: params.children.toString(),
                searched: 'true'
              });
              window.location.href = `/search/activities?${searchParams.toString()}`;
            }}
          />
        </div>

        {/* Show intelligent insights when search has been performed */}
        {destination && checkIn && (
          <div className="mb-6">
            <IntelligentActivityInfo
              destination={destination}
              date={checkIn.toISOString().split('T')[0]}
              participants={adults + children}
            />
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Activities in {destination || "your destination"}
          </h1>
          <p className="text-muted-foreground">
            {checkIn && `${checkIn.toLocaleDateString()} • `}{adults + children} participant(s)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Filters & Navigation */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cross-Module Navigator */}
            <CrossModuleNavigator currentModule="activities" />
            
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">Price Range</label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={300}
                    step={25}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Category</label>
                  <div className="space-y-2">
                    {["Adventure", "Cultural", "Food & Drink", "Nature", "Sightseeing", "Water Sports", "Wellness", "Photography", "Wildlife", "Historical", "Nightlife", "Shopping"].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={filters.category.includes(category)}
                          onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                        />
                        <label htmlFor={`category-${category}`} className="text-sm">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Duration</label>
                  <Select value={filters.duration} onValueChange={(value) => setFilters({...filters, duration: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any duration</SelectItem>
                      <SelectItem value="short">Up to 3 hours</SelectItem>
                      <SelectItem value="half-day">Half day (3-6 hours)</SelectItem>
                      <SelectItem value="full-day">Full day (6+ hours)</SelectItem>
                      <SelectItem value="multi-day">Multi-day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Difficulty</label>
                  <Select value={filters.difficulty} onValueChange={(value) => setFilters({...filters, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any difficulty</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="challenging">Challenging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Age Group</label>
                  <Select value={filters.ageGroup} onValueChange={(value) => setFilters({...filters, ageGroup: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any age</SelectItem>
                      <SelectItem value="family">Family Friendly</SelectItem>
                      <SelectItem value="adult">Adults Only</SelectItem>
                      <SelectItem value="senior">Senior Friendly</SelectItem>
                      <SelectItem value="kids">Kids Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Group Size</label>
                  <Select value={filters.groupSize} onValueChange={(value) => setFilters({...filters, groupSize: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any size</SelectItem>
                      <SelectItem value="small">Small (1-6 people)</SelectItem>
                      <SelectItem value="medium">Medium (7-15 people)</SelectItem>
                      <SelectItem value="large">Large (16+ people)</SelectItem>
                      <SelectItem value="private">Private Tour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <SortAsc className="h-5 w-5" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Best Price</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="secondary">
                {filteredAndSortedActivities.length} activities found
              </Badge>
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-40 bg-muted rounded mb-4"></div>
                      <div className="h-6 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-destructive">Error loading activities: {error}</p>
                </CardContent>
              </Card>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAndSortedActivities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
                
                {filteredAndSortedActivities.length === 0 && (
                  <div className="col-span-2">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No activities found matching your criteria</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      </PerformanceWrapper>
    </UnifiedTravelProvider>
  );
};

export default ActivitySearchPage;