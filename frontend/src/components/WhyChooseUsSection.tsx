/**
 * Why Choose Us Section
 * Modern feature highlights with animations
 */

import { Sparkles, Wallet, Shield, Zap, Globe2, HeartHandshake } from 'lucide-react';
import { Card } from '@/components/ui/card';

const WhyChooseUsSection = () => {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Recommendations',
      description: 'Our smart AI learns your preferences and suggests the perfect trips tailored just for you',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      icon: Wallet,
      title: 'Best Price Guarantee',
      description: 'Find a better price elsewhere? We\'ll match it and give you 10% of the difference back',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      icon: Shield,
      title: 'Secure & Protected',
      description: 'Bank-level encryption and fraud protection. Your data and payments are always safe',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      icon: Zap,
      title: 'Instant Confirmation',
      description: 'Get confirmed in seconds, not hours. Real-time booking with immediate tickets',
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-50'
    },
    {
      icon: Globe2,
      title: 'Global Coverage',
      description: 'Access to 2M+ hotels, flights, and activities in 150+ countries worldwide',
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-50 to-purple-50'
    },
    {
      icon: HeartHandshake,
      title: '24/7 Human Support',
      description: 'Real people, real help. Our travel experts are always here for you, day or night',
      gradient: 'from-red-500 to-pink-500',
      bgGradient: 'from-red-50 to-pink-50'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Why Millions Choose Maku.Travel
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're not just another booking platform. We're your AI-powered travel companion, 
            committed to making your journey unforgettable
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-gray-100 hover:border-transparent relative overflow-hidden"
                style={{
                  animation: `fadeInScale 0.6s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Background Gradient on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Decorative Element */}
                  <div className={`mt-6 h-1 w-16 rounded-full bg-gradient-to-r ${feature.gradient} group-hover:w-full transition-all duration-500`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className="mt-16 p-10 rounded-3xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 shadow-2xl">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-white/90 text-lg mb-6">
              Join 2 million+ travelers who trust Maku.Travel for their adventures
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-orange-600 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200">
                Start Planning Now
              </button>
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors">
                Watch How It Works
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add animation keyframes */}
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
};

export default WhyChooseUsSection;
