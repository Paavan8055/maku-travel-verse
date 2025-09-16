import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const ComingSoon = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Activities Coming Soon
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              We're working hard to bring you amazing activity booking experiences. 
              Check back soon for tours, experiences, and adventures around the world.
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary mr-2" />
                <span className="font-semibold">What's Coming</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <div className="font-medium text-foreground mb-1">Tours & Experiences</div>
                  <div>City tours, food tours, cultural experiences</div>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">Adventure Activities</div>
                  <div>Hiking, water sports, outdoor adventures</div>
                </div>
                <div>
                  <div className="font-medium text-foreground mb-1">Local Experiences</div>
                  <div>Workshops, classes, local immersion</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg">
              <Link to="/search/hotels">
                Explore Hotels Instead
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;