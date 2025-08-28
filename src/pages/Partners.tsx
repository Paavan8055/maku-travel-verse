import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, Building, MapPin, Star, Globe, Users, TrendingUp, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Partners = () => {
  const partnerCategories = [
    {
      title: 'Airlines',
      icon: <Plane className="w-8 h-8" />,
      description: 'Global airline partnerships for competitive flight pricing',
      partners: [
        { name: 'Qantas', logo: 'QF', region: 'Australia', tier: 'Premium' },
        { name: 'Emirates', logo: 'EK', region: 'Middle East', tier: 'Premium' },
        { name: 'Singapore Airlines', logo: 'SQ', region: 'Asia', tier: 'Premium' },
        { name: 'Lufthansa', logo: 'LH', region: 'Europe', tier: 'Premium' }
      ]
    },
    {
      title: 'Hotels',
      icon: <Building className="w-8 h-8" />,
      description: 'Premium hotel chains and boutique properties worldwide',
      partners: [
        { name: 'Marriott', logo: 'MAR', region: 'Global', tier: 'Premium' },
        { name: 'Hilton', logo: 'HIL', region: 'Global', tier: 'Premium' },
        { name: 'AccorHotels', logo: 'ACC', region: 'Global', tier: 'Standard' },
        { name: 'InterContinental', logo: 'IHG', region: 'Global', tier: 'Premium' }
      ]
    }
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Premium':
        return 'bg-gold/10 text-gold border-gold/20';
      case 'Standard':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Our Global Partners
            </h1>
            <p className="text-lg text-muted-foreground">
              Trusted partnerships delivering exceptional travel experiences worldwide
            </p>
          </div>

          <div className="space-y-8">
            {partnerCategories.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="text-primary">{category.icon}</div>
                    {category.title}
                  </CardTitle>
                  <p className="text-muted-foreground">{category.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    {category.partners.map((partner, pIndex) => (
                      <div key={pIndex} className="flex items-center justify-between p-4 rounded-lg border bg-background/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {partner.logo}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold">{partner.name}</h4>
                            <p className="text-xs text-muted-foreground">{partner.region}</p>
                          </div>
                        </div>
                        <Badge className={getTierColor(partner.tier)} variant="outline">
                          {partner.tier}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Partners;