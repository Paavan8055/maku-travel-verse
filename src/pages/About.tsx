
import { Plane, Users, Heart, Shield, Award, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const About = () => {
  const stats = [
    { label: "Countries", value: "180+", icon: Globe },
    { label: "Happy Travelers", value: "2M+", icon: Users },
    { label: "Partner Hotels", value: "500K+", icon: Heart },
    { label: "Years of Excellence", value: "8+", icon: Award }
  ];

  const values = [
    {
      icon: Heart,
      title: "Personalized Travel",
      description: "We believe every journey should be unique. Our four specialized marketplaces - Family Adventures, Solo Journeys, Pet-Friendly Travel, and Spiritual Retreats - ensure you find exactly what your heart desires."
    },
    {
      icon: Shield,
      title: "Trust & Security",
      description: "Your safety is our priority. With verified reviews, secure booking systems, and 24/7 support, we've built a platform you can trust with your most precious memories."
    },
    {
      icon: Users,
      title: "Community-Driven",
      description: "Join a global community of travelers sharing authentic experiences. Our verified review system with Global-ID badges ensures you get real insights from fellow adventurers."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About Maku.travel
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Building the world's most personalized travel marketplace, one journey at a time
          </p>
          <div className="flex items-center justify-center gap-4 text-lg">
            <Plane className="h-6 w-6" />
            <span>Founded in 2016 • Based in Sydney, Australia</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-lg">
                <CardContent className="p-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                  <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Story</h2>
          <div className="prose prose-lg mx-auto text-muted-foreground">
            <p className="text-lg leading-relaxed mb-6">
              Maku.travel was born from a simple belief: travel should be as unique as the traveler. 
              Founded in 2016 by a team of passionate explorers in Sydney, Australia, we set out to 
              revolutionize how people discover and book their perfect getaways.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              What started as a small startup has grown into a global platform serving over 2 million 
              travelers across 180+ countries. Our innovative four-way marketplace approach recognizes 
              that a family vacation, solo adventure, pet-friendly trip, or spiritual retreat each 
              requires a completely different approach.
            </p>
            <p className="text-lg leading-relaxed">
              Today, we're proud to partner with over 500,000 hotels worldwide, offering everything 
              from boutique accommodations to luxury resorts, all carefully curated to match your 
              travel style and preferences.
            </p>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Drives Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <value.icon className="h-12 w-12 mx-auto mb-6 text-primary" />
                  <h3 className="text-xl font-semibold mb-4">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Our Mission</h2>
          <p className="text-xl leading-relaxed mb-8">
            To empower every traveler to build their life's travel story by connecting them with 
            personalized experiences that match their unique journey, whether they're seeking 
            family bonding, solo discovery, pet companionship, or spiritual growth.
          </p>
          <Button size="lg" variant="secondary" className="mt-4">
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Leadership Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-full mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold mb-2">Sarah Chen</h3>
                <p className="text-primary mb-3">CEO & Co-Founder</p>
                <p className="text-muted-foreground text-sm">Former Expedia executive with 15+ years in travel technology</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-secondary to-secondary/80 rounded-full mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold mb-2">Marcus Rodriguez</h3>
                <p className="text-primary mb-3">CTO & Co-Founder</p>
                <p className="text-muted-foreground text-sm">Tech visionary who built scalable platforms at Airbnb and Uber</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-accent to-accent/80 rounded-full mx-auto mb-6"></div>
                <h3 className="text-xl font-semibold mb-2">Dr. Priya Patel</h3>
                <p className="text-primary mb-3">Chief Experience Officer</p>
                <p className="text-muted-foreground text-sm">Travel psychologist specializing in personalized journey design</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
