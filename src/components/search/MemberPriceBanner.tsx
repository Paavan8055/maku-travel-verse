import React from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MemberPriceBannerProps {
  destination?: string;
}

const MemberPriceBanner: React.FC<MemberPriceBannerProps> = ({ destination }) => {
  return (
    <Card className="border-primary/20 shadow-soft bg-gradient-to-r from-primary/10 via-background to-accent/10">
      <CardContent className="p-4 md:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Member deal</p>
            <p className="text-base md:text-lg font-semibold text-foreground">
              Save up to 15% on stays{destination ? ` in ${destination}` : ""}
            </p>
          </div>
        </div>
        <a href="/auth" className="text-sm font-medium text-primary hover:underline whitespace-nowrap">Sign in to unlock</a>
      </CardContent>
    </Card>
  );
};

export default MemberPriceBanner;
