import React from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MemberPriceBannerProps {
  destination?: string;
}

const MemberPriceBanner: React.FC<MemberPriceBannerProps> = ({ destination }) => {
  return (
    <Card className="bg-card text-card-foreground border">
      <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-semibold">Unlock member prices</p>
            <p className="text-sm text-muted-foreground">Save more in {destination || "thousands of properties"}</p>
          </div>
        </div>
        {/* Placeholder for action (login/cta) if needed later */}
      </CardContent>
    </Card>
  );
};

export default MemberPriceBanner;
