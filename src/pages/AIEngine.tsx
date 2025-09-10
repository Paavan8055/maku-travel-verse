import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Database, Network, Cpu, BarChart, Settings } from 'lucide-react';

const AIEngine = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Universal AI Engine - Powering Smart Travel | Maku.travel</title>
        <meta name="description" content="The core AI engine that powers Maku.travel's intelligent recommendations, pricing optimization, and personalized travel experiences." />
      </Helmet>
      
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <Zap className="h-20 w-20 mx-auto mb-6 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Universal AI Engine
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The intelligent core that powers every aspect of your travel experience with advanced machine learning algorithms.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <BarChart className="h-4 w-4 mr-2" />
              View Performance
            </Button>
          </div>
        </section>

        {/* Engine Components */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Engine Components</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Database,
                  title: "Data Processing",
                  description: "Real-time analysis of travel data, pricing trends, and user behavior patterns."
                },
                {
                  icon: Network,
                  title: "Neural Networks",
                  description: "Deep learning models that understand travel preferences and predict optimal choices."
                },
                {
                  icon: Cpu,
                  title: "Recommendation Engine",
                  description: "Advanced algorithms that generate personalized travel suggestions in real-time."
                },
                {
                  icon: BarChart,
                  title: "Price Optimization",
                  description: "Dynamic pricing models that find the best deals across thousands of providers."
                },
                {
                  icon: Settings,
                  title: "Adaptive Learning",
                  description: "Continuous improvement through user feedback and behavioral analysis."
                },
                {
                  icon: Zap,
                  title: "Real-time Processing",
                  description: "Lightning-fast responses powered by distributed computing infrastructure."
                }
              ].map((component, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <component.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-semibold mb-2">{component.title}</h3>
                    <p className="text-muted-foreground">{component.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Specs */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Technical Specifications</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">Performance Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Time</span>
                      <span className="font-semibold">&lt; 200ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accuracy Rate</span>
                      <span className="font-semibold">98.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Sources</span>
                      <span className="font-semibold">500+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily Processing</span>
                      <span className="font-semibold">10M+ queries</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-4">AI Capabilities</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Languages Supported</span>
                      <span className="font-semibold">25+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ML Models</span>
                      <span className="font-semibold">15 Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Training Data</span>
                      <span className="font-semibold">100TB+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Update Frequency</span>
                      <span className="font-semibold">Real-time</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AIEngine;