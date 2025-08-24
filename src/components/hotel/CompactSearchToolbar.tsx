
import { useState } from "react";
import { Mic, MapPin, Accessibility, Calendar, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VoiceSearchInterface } from "./VoiceSearchInterface";
import { SmartLocationSearch } from "./SmartLocationSearch";
import { AccessibilityFilters } from "./AccessibilityFilters";
import { DateFlexibilityMatrix } from "./DateFlexibilityMatrix";
import { RevenueAnalyticsDashboard } from "./RevenueAnalyticsDashboard";
import { ABTestDashboard } from "@/components/testing/ABTestingFramework";

interface CompactSearchToolbarProps {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  onDestinationChange?: (destination: string) => void;
  onLocationSelect?: (location: string) => void;
  selectedAccessibility?: string[];
  onAccessibilityChange?: (accessibility: string[]) => void;
  className?: string;
}

export function CompactSearchToolbar({
  destination,
  checkIn,
  checkOut,
  guests,
  onDestinationChange,
  onLocationSelect,
  selectedAccessibility = [],
  onAccessibilityChange,
  className = ""
}: CompactSearchToolbarProps) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [dateFlexOpen, setDateFlexOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [abTestingOpen, setAbTestingOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 p-3 bg-card border rounded-lg shadow-sm ${className}`}>
        
        {/* Voice Search */}
        <Popover open={voiceOpen} onOpenChange={setVoiceOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <Mic className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Voice Search</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80" align="start">
            <VoiceSearchInterface
              onVoiceResult={(text) => {
                console.log("Voice result:", text);
                setVoiceOpen(false);
              }}
              onDestinationChange={onDestinationChange}
            />
          </PopoverContent>
        </Popover>

        {/* Smart Location Search */}
        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <MapPin className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Hotels Near Me</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80" align="start">
            <SmartLocationSearch
              onLocationSelect={(location) => {
                onLocationSelect?.(location);
                setLocationOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Accessibility Filters */}
        <Popover open={accessibilityOpen} onOpenChange={setAccessibilityOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <Accessibility className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Accessibility Options</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-96" align="start">
            <AccessibilityFilters
              selectedAccessibility={selectedAccessibility}
              onAccessibilityChange={onAccessibilityChange}
            />
          </PopoverContent>
        </Popover>

        {/* Date Flexibility */}
        <Popover open={dateFlexOpen} onOpenChange={setDateFlexOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Flexible Dates</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-96" align="start">
            <DateFlexibilityMatrix
              currentCheckIn={checkIn}
              currentCheckOut={checkOut}
              currentPrice={250}
              onDateSelect={(dates) => {
                console.log("Date selected:", dates);
                setDateFlexOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Analytics Dashboard */}
        <Popover open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Analytics</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-[600px]" align="end">
            <RevenueAnalyticsDashboard />
          </PopoverContent>
        </Popover>

        {/* A/B Testing */}
        <Popover open={abTestingOpen} onOpenChange={setAbTestingOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>A/B Testing</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-96" align="end">
            <ABTestDashboard />
          </PopoverContent>
        </Popover>

      </div>
    </TooltipProvider>
  );
}
