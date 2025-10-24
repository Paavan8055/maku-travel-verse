/**
 * Trust & Social Proof Section
 * Modern trust badges and statistics
 */

import { Shield, Users, Globe, Award, CheckCircle, TrendingUp, Star, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TrustSection = () => {
  const stats = [
    {
      icon: Users,
      value: '2M+',
      label: 'Happy Travelers',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Globe,
      value: '150+',
      label: 'Countries Covered',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Award,
      value: '50K+',
      label: 'Five-Star Reviews',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: TrendingUp,
      value: '$3.2B',
      label: 'Total Bookings',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const trustBadges = [
    {
      icon: Shield,
      title: 'Secure Booking',
      description: '256-bit SSL encryption for all transactions'
    },
    {
      icon: CheckCircle,
      title: 'Best Price Guarantee',
      description: 'Find it cheaper? We\'ll match it + 10% off'
    },
    {
      icon: Heart,
      title: '24/7 Support',
      description: 'Real humans ready to help anytime'
    },
    {
      icon: Star,
      title: 'Verified Reviews',
      description: 'Only real travelers, no fake reviews'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index}
                className="text-center transform hover:scale-105 transition-all duration-300"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </h3>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
            Why 2 Million+ Travelers Trust Us
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Your peace of mind is our priority
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <Card 
                  key={index}
                  className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-100 hover:border-orange-200"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">
                    {badge.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {badge.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Customer Testimonial */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-br from-orange-50 to-pink-50 border-2 border-orange-100 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                  S
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-lg italic mb-4">
                  "Maku.Travel made planning our dream honeymoon to the Maldives incredibly easy. 
                  The AI recommendations were spot-on, and we saved over $800 compared to other booking sites!"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">Sarah & Michael</p>
                  <p className="text-sm text-gray-600">Honeymooners to Maldives</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
