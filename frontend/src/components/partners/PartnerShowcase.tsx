import React, { useState, useEffect } from 'react';
import { MakuCard, MakuButton, MakuColors } from '@/components/branding/MakuBrandSystem';
import { Badge } from "@/components/ui/badge";
import { 
  Plane, 
  Building2, 
  MapPin, 
  Star, 
  Shield, 
  Zap, 
  Award, 
  TrendingUp,
  Globe,
  Users,
  Clock,
  CheckCircle2
} from "lucide-react";

interface Partner {
  name: string;
  type: 'flight' | 'hotel' | 'activity';
  status: 'production' | 'demo';
  performance: number;
  specialties: string[];
  integration_date: string;
  demo_label?: string;
}

interface PartnerShowcaseProps {
  className?: string;
  showTitle?: boolean;
  variant?: 'full' | 'compact' | 'cards';
}

const PARTNER_ICONS = {
  flight: Plane,
  hotel: Building2,
  activity: MapPin
};

const PARTNER_COLORS = {
  flight: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    accent: 'bg-blue-100 text-blue-800'
  },
  hotel: {
    bg: 'bg-gradient-to-br from-green-50 to-emerald-100', 
    border: 'border-green-200',
    icon: 'text-green-600',
    accent: 'bg-green-100 text-green-800'
  },
  activity: {
    bg: 'bg-gradient-to-br from-orange-50 to-amber-100',
    border: 'border-orange-200', 
    icon: 'text-orange-600',
    accent: 'bg-orange-100 text-orange-800'
  }
};

const MOCK_PARTNERS: Partner[] = [
  {
    name: "Amadeus",
    type: "flight",
    status: "production",
    performance: 92.5,
    specialties: ["Global Network", "Corporate Travel", "NDC Technology"],
    integration_date: "2018-03-15"
  },
  {
    name: "Sabre", 
    type: "hotel",
    status: "production",
    performance: 88.2,
    specialties: ["Hotel Chain Partnerships", "Corporate Rates", "GDS Integration"],
    integration_date: "2019-07-22"
  },
  {
    name: "Viator",
    type: "activity", 
    status: "production",
    performance: 85.7,
    specialties: ["Tours", "Experiences", "Local Activities", "Skip-the-line"],
    integration_date: "2020-01-10"
  },
  {
    name: "Duffle",
    type: "flight",
    status: "demo", 
    performance: 94.8,
    specialties: ["Direct Airlines", "Modern API", "Ancillary Services", "Real-time Pricing"],
    integration_date: "2025-01-15",
    demo_label: "✨ DEMO"
  },
  {
    name: "RateHawk",
    type: "hotel",
    status: "demo",
    performance: 91.3, 
    specialties: ["2.9M Properties", "280+ Suppliers", "Real-time Booking", "Global Coverage"],
    integration_date: "2025-01-15",
    demo_label: "✨ DEMO"
  }
];

export const PartnerShowcase: React.FC<PartnerShowcaseProps> = ({ 
  className = '', 
  showTitle = true,
  variant = 'full' 
}) => {
  const [partners] = useState<Partner[]>(MOCK_PARTNERS);
  const [activePartner, setActivePartner] = useState<Partner | null>(null);

  const renderPerformanceScore = (score: number) => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-600 bg-green-100';
      if (score >= 80) return 'text-orange-600 bg-orange-100';
      return 'text-red-600 bg-red-100';
    };

    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${getScoreColor(score)}`}>
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-semibold">{score}%</span>
      </div>
    );
  };

  const renderPartnerCard = (partner: Partner, index: number) => {
    const Icon = PARTNER_ICONS[partner.type];
    const colors = PARTNER_COLORS[partner.type];
    
    return (
      <MakuCard 
        key={partner.name}
        variant="elevated"
        className={`${colors.bg} ${colors.border} border-2 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative overflow-hidden group`}
        onClick={() => setActivePartner(partner)}
      >
        {/* Demo Badge */}
        {partner.demo_label && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs border-0">
            {partner.demo_label}
          </Badge>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${colors.accent} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{partner.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{partner.type} Provider</p>
            </div>
          </div>
          {renderPerformanceScore(partner.performance)}
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-gray-700">
            {partner.status === 'production' ? 'Live & Active' : 'Demo Integration'}
          </span>
        </div>

        {/* Specialties */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Specialties</h4>
          <div className="flex flex-wrap gap-1.5">
            {partner.specialties.slice(0, 3).map((specialty) => (
              <Badge 
                key={specialty}
                variant="secondary"
                className="text-xs bg-white/70 text-gray-700 border-gray-200"
              >
                {specialty}
              </Badge>
            ))}
            {partner.specialties.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-white/70 text-gray-500">
                +{partner.specialties.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Integration Date */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Integrated {new Date(partner.integration_date).getFullYear()}</span>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </MakuCard>
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