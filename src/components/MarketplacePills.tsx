import React from "react";
import { Pill, PawPrint, Users, HeartHandshake, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const items = [
  { label: "Family", icon: Users, href: "/search/hotels?vertical=family" },
  { label: "Solo", icon: Pill, href: "/search/hotels?vertical=solo" },
  { label: "Pet", icon: PawPrint, href: "/search/hotels?vertical=pet" },
  { label: "Spiritual", icon: Sparkles, href: "/search/hotels?vertical=spiritual" },
  { label: "Travel Fund", icon: HeartHandshake, href: "/partners?tab=fund" },
];

const MarketplacePills: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-center gap-3">
          {items.map((item) => (
            <Button
              key={item.label}
              onClick={() => navigate(item.href)}
              variant="secondary"
              className="rounded-full px-4 py-2 text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-soft hover:shadow-floating hover:opacity-95 hover:-translate-y-0.5 transition-transform"
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePills;
