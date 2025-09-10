import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, MessageCircle, Sparkles, Brain, Clock, Globe } from 'lucide-react';

const AIAssistant = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Maku AI Assistant - Intelligent Travel Planning | Maku.travel</title>
        <meta name="description" content="Meet your intelligent travel companion. Our AI assistant provides personalized recommendations, instant support, and seamless trip planning." />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <Bot className="h-20 w-20 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Maku AI Assistant
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your intelligent travel companion that understands your preferences and helps you plan the perfect trip.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Chatting
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">AI-Powered Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Sparkles,
                  title: "Personalized Recommendations",
                  description: "Get travel suggestions tailored to your preferences, budget, and travel style."
                },
                {
                  icon: Brain,
                  title: "Smart Planning",
                  description: "AI analyzes millions of data points to create optimal itineraries and bookings."
                },
                {
                  icon: Clock,
                  title: "24/7 Support",
                  description: "Get instant answers to your travel questions anytime, anywhere."
                },
                {
                  icon: Globe,
                  title: "Multi-language",
                  description: "Communicate in your preferred language with our global AI assistant."
                },
                {
                  icon: MessageCircle,
                  title: "Natural Conversation",
                  description: "Chat naturally about your travel needs - no complex forms or menus."
                },
                {
                  icon: Bot,
                  title: "Continuous Learning",
                  description: "Our AI learns from each interaction to provide better recommendations."
                }
              ].map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">See It In Action</h2>
            <Card className="p-8">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8">
                <MessageCircle className="h-16 w-16 mx-auto mb-6 text-primary" />
                <h3 className="text-2xl font-semibold mb-4">Interactive Demo</h3>
                <p className="text-muted-foreground mb-6">
                  Experience how our AI assistant can help you plan your next trip. Try asking about destinations, hotels, or activities.
                </p>
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Try Demo
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AIAssistant;