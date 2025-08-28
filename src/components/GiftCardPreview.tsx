import React from 'react';
import { formatCurrency } from '@/utils/currency';

interface GiftCardPreviewProps {
  amount: number;
  theme: {
    name: string;
    image: string;
    gradient: string;
  };
}

const GiftCardPreview = ({ amount, theme }: GiftCardPreviewProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/50 p-6 shadow-floating">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${theme.image})` }}
        />
        
        
        {/* Gift card content */}
        <div className="relative flex h-full flex-col justify-between p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">maku.travel</h3>
              <p className="text-sm opacity-90">Gift Card</p>
            </div>
            <div className="rounded-lg bg-white/20 px-3 py-1 backdrop-blur-sm">
              <span className="text-xs font-medium">{theme.name}</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold">
              {formatCurrency(amount, 'AUD')}
            </div>
            <p className="mt-2 text-sm opacity-90">
              Give the gift of adventure
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-1 w-1 rounded-full bg-white/60" />
              ))}
            </div>
            <div className="text-xs text-black font-medium">
              Never expires
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCardPreview;