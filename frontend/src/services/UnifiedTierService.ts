// Unified Tier and Rewards Service
// Eliminates duplication across NFT, Airdrop, and Loyalty components

export interface TierInfo {
  name: string;
  min_points: number;
  max_points: number;
  benefits: string[];
  icon: string;
  color: string;
  multiplier: number;
}

export interface UserTierStatus {
  current_tier: TierInfo;
  next_tier: TierInfo | null;
  progress_percentage: number;
  points_to_next: number;
  total_points: number;
}

export interface RewardCalculation {
  base_credits: number;
  tier_bonus: number;
  provider_bonus: number;
  total_credits: number;
  nft_eligible: boolean;
  tier_progress_gained: number;
}

class UnifiedTierService {
  private static instance: UnifiedTierService;
  
  private readonly TIER_DEFINITIONS: TierInfo[] = [
    {
      name: 'Wanderer',
      min_points: 0,
      max_points: 199,
      benefits: ['Basic airdrop eligibility', '5% platform credits', 'Welcome NFT collection'],
      icon: 'Target',
      color: 'from-gray-400 to-gray-500',
      multiplier: 1.0
    },
    {
      name: 'Explorer',
      min_points: 200,
      max_points: 499,
      benefits: ['Enhanced airdrop weight', '10% platform credits', 'Priority support', 'Rare NFT access'],
      icon: 'Star',
      color: 'from-blue-400 to-cyan-500',
      multiplier: 1.5
    },
    {
      name: 'Adventurer',
      min_points: 500,
      max_points: 999,
      benefits: ['High airdrop multiplier', '15% platform credits', 'Exclusive offers', 'Epic NFT access'],
      icon: 'Trophy',
      color: 'from-purple-400 to-pink-500',
      multiplier: 2.0
    },
    {
      name: 'Legend',
      min_points: 1000,
      max_points: 9999,
      benefits: ['Maximum airdrop allocation', '25% platform credits', 'VIP treatment', 'Legendary NFT access'],
      icon: 'Crown',
      color: 'from-yellow-400 to-orange-500',
      multiplier: 2.5
    }
  ];

  private readonly PROVIDER_BONUSES = {
    expedia: 0.15,
    amadeus: 0.10,
    viator: 0.12,
    duffle: 0.10,
    ratehawk: 0.10,
    sabre: 0.10
  };

  public static getInstance(): UnifiedTierService {
    if (!UnifiedTierService.instance) {
      UnifiedTierService.instance = new UnifiedTierService();
    }
    return UnifiedTierService.instance;
  }

  /**
   * Calculate user's current tier based on total points
   */
  public calculateUserTier(totalPoints: number): TierInfo {
    return this.TIER_DEFINITIONS.find(tier => 
      totalPoints >= tier.min_points && totalPoints <= tier.max_points
    ) || this.TIER_DEFINITIONS[0];
  }

  /**
   * Get next tier information
   */
  public getNextTier(currentTier: TierInfo): TierInfo | null {
    const currentIndex = this.TIER_DEFINITIONS.findIndex(tier => tier.name === currentTier.name);
    return currentIndex < this.TIER_DEFINITIONS.length - 1 
      ? this.TIER_DEFINITIONS[currentIndex + 1] 
      : null;
  }

  /**
   * Calculate complete tier status for user
   */
  public calculateTierStatus(totalPoints: number): UserTierStatus {
    const currentTier = this.calculateUserTier(totalPoints);
    const nextTier = this.getNextTier(currentTier);
    
    let progressPercentage = 100;
    let pointsToNext = 0;
    
    if (nextTier) {
      const tierRange = nextTier.min_points - currentTier.min_points;
      const userProgress = totalPoints - currentTier.min_points;
      progressPercentage = Math.round((userProgress / tierRange) * 100);
      pointsToNext = nextTier.min_points - totalPoints;
    }

    return {
      current_tier: currentTier,
      next_tier: nextTier,
      progress_percentage: Math.max(0, progressPercentage),
      points_to_next: Math.max(0, pointsToNext),
      total_points: totalPoints
    };
  }

  /**
   * Calculate comprehensive rewards for a booking
   */
  public calculateBookingRewards(
    bookingValue: number,
    provider: string,
    userTier: TierInfo,
    experienceType: string = 'standard'
  ): RewardCalculation {
    // Base credits calculation (10% of booking value)
    const baseCredits = Math.round(bookingValue * 0.1);
    
    // Tier bonus
    const tierBonus = Math.round(baseCredits * (userTier.multiplier - 1.0));
    
    // Provider bonus
    const providerMultiplier = this.PROVIDER_BONUSES[provider.toLowerCase()] || 0.05;
    const providerBonus = Math.round(baseCredits * providerMultiplier);
    
    // Total credits
    const totalCredits = baseCredits + tierBonus + providerBonus;
    
    // NFT eligibility
    const nftEligible = this.isNFTEligible(bookingValue, provider, experienceType);
    
    // Tier progress points (1 point per $10 spent)
    const tierProgressGained = Math.floor(bookingValue / 10);

    return {
      base_credits: baseCredits,
      tier_bonus: tierBonus,
      provider_bonus: providerBonus,
      total_credits: totalCredits,
      nft_eligible: nftEligible,
      tier_progress_gained: tierProgressGained
    };
  }

  /**
   * Determine if booking qualifies for NFT minting
   */
  private isNFTEligible(
    bookingValue: number,
    provider: string,
    experienceType: string
  ): boolean {
    // High-value bookings always qualify
    if (bookingValue >= 500) return true;
    
    // Provider-specific thresholds
    const providerThresholds = {
      expedia: 200,  // Lower threshold for new integration
      amadeus: 300,
      viator: 250,   // Activities can be lower value
      duffle: 400,
      ratehawk: 300,
      sabre: 350
    };
    
    const threshold = providerThresholds[provider.toLowerCase()] || 400;
    if (bookingValue >= threshold) return true;
    
    // Special experience types
    if (['luxury', 'package', 'exclusive'].includes(experienceType.toLowerCase())) {
      return bookingValue >= 200;
    }
    
    return false;
  }

  /**
   * Calculate NFT rarity based on booking characteristics
   */
  public calculateNFTRarity(
    bookingValue: number,
    provider: string,
    destination: string,
    experienceType: string
  ): { rarity: string; score: number } {
    let score = 50; // Base score
    
    // Booking value impact
    if (bookingValue >= 3000) score += 30;
    else if (bookingValue >= 2000) score += 25;
    else if (bookingValue >= 1000) score += 20;
    else if (bookingValue >= 500) score += 10;
    
    // Provider bonus
    if (provider === 'expedia') score += 15; // New integration bonus
    else if (['amadeus', 'viator'].includes(provider)) score += 10;
    else score += 5;
    
    // Experience type bonus
    const experienceBonus = {
      luxury: 20,
      package: 15,
      exclusive: 15,
      cultural: 10,
      adventure: 10,
      standard: 0
    };
    score += experienceBonus[experienceType.toLowerCase()] || 0;
    
    // Destination rarity (mock - in production, use real data)
    const rareDesti nations = ['socotra', 'bhutan', 'antarctica', 'north_korea'];
    if (rareDestinations.some(rare => destination.toLowerCase().includes(rare))) {
      score += 25;
    }
    
    // Determine rarity tier
    const finalScore = Math.min(100, score);
    let rarity = 'common';
    
    if (finalScore >= 90) rarity = 'legendary';
    else if (finalScore >= 75) rarity = 'epic';
    else if (finalScore >= 60) rarity = 'rare';
    
    return { rarity, score: finalScore };
  }

  /**
   * Get provider bonus percentage
   */
  public getProviderBonus(provider: string): number {
    return this.PROVIDER_BONUSES[provider.toLowerCase()] || 0.05;
  }

  /**
   * Get all tier definitions
   */
  public getAllTiers(): TierInfo[] {
    return [...this.TIER_DEFINITIONS];
  }

  /**
   * Calculate airdrop allocation based on tier and points
   */
  public calculateAirdropAllocation(
    totalPoints: number,
    tierStatus: UserTierStatus,
    questMultiplier: number = 2.5
  ): number {
    const baseAllocation = totalPoints * questMultiplier;
    const tierMultiplier = tierStatus.current_tier.multiplier;
    return Math.round(baseAllocation * tierMultiplier);
  }

  /**
   * Generate tier comparison data for UI
   */
  public generateTierComparison(userTier: TierInfo): Array<{
    tier: TierInfo;
    isCurrent: boolean;
    isNext: boolean;
    isAchieved: boolean;
  }> {
    const currentIndex = this.TIER_DEFINITIONS.findIndex(t => t.name === userTier.name);
    
    return this.TIER_DEFINITIONS.map((tier, index) => ({
      tier,
      isCurrent: index === currentIndex,
      isNext: index === currentIndex + 1,
      isAchieved: index < currentIndex
    }));
  }
}

// Export singleton instance
export const tierService = UnifiedTierService.getInstance();

// Export utility functions for backward compatibility
export const calculateUserTier = (points: number) => tierService.calculateUserTier(points);
export const calculateTierStatus = (points: number) => tierService.calculateTierStatus(points);
export const calculateBookingRewards = (value: number, provider: string, tier: TierInfo) => 
  tierService.calculateBookingRewards(value, provider, tier);
export const calculateNFTRarity = (value: number, provider: string, destination: string, type: string) =>
  tierService.calculateNFTRarity(value, provider, destination, type);

export default tierService;