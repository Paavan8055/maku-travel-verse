import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Plane, 
  Hotel, 
  MapPin, 
  Car,
  Shield, 
  Clock, 
  Star, 
  TrendingUp, 
  Zap,
  Award,
  ExternalLink
} from 'lucide-react';
import ExpediaShowcase from './ExpediaShowcase';

interface Partner {
  id: string;
  name: string;
  type: string;
  performance_score: number;
  specialties: string[];
  features: string[];
  demo_label?: string;
  status: string;
  health_status: string;
}

interface PartnerShowcaseProps {
  variant?: 'full' | 'compact' | 'cards';
}

const PartnerShowcase: React.FC<PartnerShowcaseProps> = ({ variant = 'full' }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpediaDetails, setShowExpediaDetails] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const backendUrl = import.meta.env.VITE_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/smart-dreams/providers`);
      const data = await response.json();
      
      if (data.providers) {
        // Filter for key partners including Expedia
        const keyPartners = data.providers.filter((p: Partner) => 
          ['Amadeus', 'Sabre', 'Viator', 'Duffle', 'RateHawk', 'Expedia Group'].includes(p.name)
        );
        setPartners(keyPartners);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      // Fallback to mock data including Expedia
      setPartners([
        {
          id: 'amadeus-001',
          name: 'Amadeus',
          type: 'hotel',
          performance_score: 92.5,
          specialties: ['Global hotel inventory', 'Real-time availability', 'Corporate rates'],
          features: ['Price matching', 'Instant confirmation', '24/7 support'],
          status: 'active',
          health_status: 'healthy'
        },
        {
          id: 'sabre-001', 
          name: 'Sabre',
          type: 'flight',
          performance_score: 88.7,
          specialties: ['Flight booking', 'Airline partnerships', 'Route optimization'],
          features: ['Multi-city booking', 'Seat selection', 'Meal preferences'],
          status: 'active',
          health_status: 'healthy'
        },
        {
          id: 'viator-001',
          name: 'Viator',
          type: 'activity', 
          performance_score: 85.2,
          specialties: ['Tours and activities', 'Local experiences', 'Skip-the-line tickets'],
          features: ['Expert guides', 'Small groups', 'Cultural immersion'],
          status: 'active',
          health_status: 'healthy'
        },
        {
          id: 'duffle-001',
          name: 'Duffle',
          type: 'flight',
          performance_score: 94.8,
          specialties: ['Modern flight booking', 'Direct airline connectivity', 'Ancillary services'],
          features: ['Real-time availability', 'Dynamic pricing', 'Seat maps'],
          demo_label: '✨ DEMO DATA',
          status: 'active',
          health_status: 'healthy'
        },
        {
          id: 'ratehawk-001',
          name: 'RateHawk',
          type: 'hotel',
          performance_score: 91.3,
          specialties: ['Hotel inventory', 'Competitive rates', 'Global coverage'],
          features: ['Best price guarantee', 'Instant booking', 'Multi-language support'],
          demo_label: '✨ DEMO DATA',
          status: 'active',
          health_status: 'healthy'
        },
        {
          id: 'expedia-001',
          name: 'Expedia Group',
          type: 'comprehensive',
          performance_score: 96.2,
          specialties: ['Complete travel ecosystem', 'Hotels & flights', 'Cars & activities', 'Package deals'],
          features: ['EPS Rapid API', 'Multi-service booking', 'Global inventory', 'Loyalty rewards'],
          status: 'active',
          health_status: 'healthy'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (type: string, name: string) => {
    if (name === 'Expedia Group') return Globe;
    switch (type) {
      case 'flight': return Plane;
      case 'hotel': return Hotel;
      case 'activity': return MapPin;
      case 'car': return Car;
      case 'comprehensive': return Globe;
      default: return Globe;
    }
  };

  const getProviderColor = (score: number, name: string) => {
    if (name === 'Expedia Group') return 'from-blue-600 via-purple-600 to-orange-600';
    if (score >= 95) return 'from-green-500 to-emerald-600';
    if (score >= 90) return 'from-blue-500 to-cyan-600';
    if (score >= 85) return 'from-purple-500 to-violet-600';
    return 'from-gray-500 to-slate-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  };

  if (variant === 'compact') {
    return (
      <div className={`space-y-4 ${className}`}>
        {showTitle && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trusted Partners</h2>
            <p className="text-gray-600">Powering your travel dreams with industry leaders</p>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          {partners.map((partner) => (
            <div key={partner.name} className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-md border">
              <div className={`p-1.5 rounded-full ${PARTNER_COLORS[partner.type].accent}`}>
                {React.createElement(PARTNER_ICONS[partner.type], { className: `h-4 w-4 ${PARTNER_COLORS[partner.type].icon}` })}
              </div>
              <span className="font-medium text-gray-900">{partner.name}</span>
              {partner.demo_label && (
                <Badge className="bg-purple-100 text-purple-800 text-xs border-0">Demo</Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showTitle && (
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-orange-500" />
            <Award className="h-8 w-8 text-green-500" />
            <Globe className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent mb-3">
            Trusted Travel Partners
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We partner with industry leaders to bring you the best travel experiences worldwide
          </p>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>5 Key Partners</span>
            </div>
            <div className="flex items-center space-x-1">
              <Globe className="h-4 w-4" />
              <span>Global Coverage</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4" />
              <span>Real-time Integration</span>
            </div>
          </div>
        </div>
      )}

      {/* Partner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {partners.map((partner, index) => renderPartnerCard(partner, index))}
      </div>

      {/* Partner Detail Modal/Popup */}
      {activePartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <MakuCard className="bg-white max-w-md w-full p-6 relative">
            <button
              onClick={() => setActivePartner(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${PARTNER_COLORS[activePartner.type].accent}`}>
                  {React.createElement(PARTNER_ICONS[activePartner.type], { 
                    className: `h-6 w-6 ${PARTNER_COLORS[activePartner.type].icon}` 
                  })}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{activePartner.name}</h3>
                  <p className="text-gray-600 capitalize">{activePartner.type} Provider</p>
                </div>
              </div>
              
              {renderPerformanceScore(activePartner.performance)}
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">All Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {activePartner.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Status:</strong> {activePartner.status === 'production' ? 'Live & Active' : 'Demo Integration'}</p>
                <p><strong>Integrated:</strong> {new Date(activePartner.integration_date).toLocaleDateString()}</p>
              </div>
            </div>
          </MakuCard>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="bg-gradient-to-r from-orange-50 to-green-50 rounded-2xl p-6 border border-orange-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-orange-600">99.9%</div>
            <div className="text-sm text-gray-600">Uptime Guarantee</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-600">24/7</div>
            <div className="text-sm text-gray-600">Partner Support</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-600">Global</div>
            <div className="text-sm text-gray-600">Coverage Network</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerShowcase;