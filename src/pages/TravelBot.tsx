import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cpu, Zap, Route, Shield, Clock, Users } from 'lucide-react';

const TravelBot = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Agentic Travel Bot - Autonomous Travel Planning | Maku.travel</title>
        <meta name="description" content="Our autonomous travel bot handles complex multi-step bookings, monitors deals, and manages your travel needs independently." />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <Cpu className="h-20 w-20 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Agentic Travel Bot
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Advanced autonomous agent that handles complex travel planning, bookings, and monitoring on your behalf.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Zap className="h-4 w-4 mr-2" />
              Activate Bot
            </Button>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Autonomous Capabilities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Route,
                  title: "Multi-Step Planning",
                  description: "Handles complex itineraries with multiple destinations, transfers, and activities."
                },
                {
                  icon: Shield,
                  title: "Risk Management",
                  description: "Monitors weather, travel advisories, and automatically suggests alternatives."
                },
                {
                  icon: Clock,
                  title: "Deal Monitoring",
                  description: "Continuously scans for better prices and automatically applies discounts."
                },
                {
                  icon: Users,
                  title: "Group Coordination",
                  description: "Manages bookings for multiple travelers with different preferences."
                },
                {
                  icon: Zap,
                  title: "Instant Execution",
                  description: "Books flights, hotels, and activities in seconds across multiple providers."
                },
                {
                  icon: Cpu,
                  title: "Learning Algorithm",
                  description: "Adapts to your preferences and improves recommendations over time."
                }
              ].map((capability, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <capability.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">{capability.title}</h3>
                    <p className="text-muted-foreground">{capability.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Set Your Goals",
                  description: "Tell the bot your travel preferences, budget, and requirements."
                },
                {
                  step: "2", 
                  title: "Autonomous Planning",
                  description: "The bot analyzes options, compares prices, and creates optimal plans."
                },
                {
                  step: "3",
                  title: "Execution & Monitoring",
                  description: "Books your travel and continuously monitors for improvements."
                },
                {
                  step: "4",
                  title: "Real-time Updates",
                  description: "Provides notifications and handles changes automatically."
                }
              ].map((step, index) => (
                <Card key={index}>
                  <CardContent className="flex items-center p-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mr-6">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TravelBot;