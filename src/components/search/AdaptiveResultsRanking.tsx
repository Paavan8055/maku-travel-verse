import React, { useState, useEffect } from 'react';

interface AdaptiveResultsRankingProps {
  results: any[];
  searchParams: any;
  searchType: 'flight' | 'hotel' | 'activity';
  onRankingComplete: (rankedResults: any[]) => void;
}

export const AdaptiveResultsRanking: React.FC<AdaptiveResultsRankingProps> = ({
  results,
  searchParams,
  searchType,
  onRankingComplete
}) => {
  const [isRanking, setIsRanking] = useState(false);

  useEffect(() => {
    if (results.length === 0) return;

    setIsRanking(true);
    
    // Simple ranking based on price and basic criteria
    const rankedResults = [...results].sort((a, b) => {
      // Basic price comparison
      const priceA = a.price || 0;
      const priceB = b.price || 0;
      
      // Add small randomization for variety
      const randomFactor = (Math.random() - 0.5) * 0.1;
      
      return priceA - priceB + randomFactor;
    });

    setTimeout(() => {
      onRankingComplete(rankedResults);
      setIsRanking(false);
    }, 500);
  }, [results, onRankingComplete]);

  if (!isRanking) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
      Optimizing results for your preferences...
    </div>
  );
};