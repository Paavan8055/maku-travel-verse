"""
MAKU Travel Rewards Cashback Calculator
Implements 1-10% tiered cashback system for travel bookings
"""

from typing import Dict, Optional
from enum import Enum
from datetime import datetime
import uuid


class TierLevel(str, Enum):
    """NFT Membership Tiers with cashback rates"""
    BRONZE = "bronze"      # 1% cashback
    SILVER = "silver"      # 3% cashback
    GOLD = "gold"          # 6% cashback
    PLATINUM = "platinum"  # 10% cashback (maximum)


class CashbackCalculator:
    """
    Calculates MAKU token cashback rewards based on:
    - Booking amount
    - User tier (Bronze/Silver/Gold/Platinum)
    - NFT multiplier (if user holds multiple NFTs)
    - Provider bonuses
    """
    
    # Base cashback rates (1% - 10% range)
    TIER_RATES = {
        TierLevel.BRONZE: 0.01,    # 1%
        TierLevel.SILVER: 0.03,    # 3%
        TierLevel.GOLD: 0.06,      # 6%
        TierLevel.PLATINUM: 0.10   # 10% maximum
    }
    
    # Provider-specific bonuses
    PROVIDER_BONUSES = {
        "expedia": 0.05,      # +5% for Expedia bookings
        "amadeus": 0.03,      # +3% for Amadeus
        "viator": 0.03,       # +3% for Viator
        "duffle": 0.02,       # +2% for Duffle
        "ratehawk": 0.02,     # +2% for RateHawk
        "sabre": 0.02         # +2% for Sabre
    }
    
    # Maximum cashback cap
    MAX_CASHBACK_RATE = 0.10  # 10% is the absolute maximum
    
    @classmethod
    def calculate_cashback(
        cls,
        booking_amount: float,
        tier: str,
        nft_multiplier: float = 1.0,
        provider: Optional[str] = None
    ) -> Dict:
        """
        Calculate cashback for a booking
        
        Args:
            booking_amount: Total booking amount in USD
            tier: User tier (bronze/silver/gold/platinum)
            nft_multiplier: Additional multiplier from NFT ownership (default 1.0)
            provider: Booking provider (optional, for provider bonuses)
        
        Returns:
            Dict with cashback details including amount, rate, and breakdown
        """
        # Convert tier to enum
        try:
            tier_enum = TierLevel(tier.lower())
        except ValueError:
            tier_enum = TierLevel.BRONZE  # Default to Bronze
        
        # Get base rate
        base_rate = cls.TIER_RATES[tier_enum]
        
        # Apply NFT multiplier (capped at 1.5x)
        nft_multiplier = min(nft_multiplier, 1.5)
        rate_with_nft = base_rate * nft_multiplier
        
        # Apply provider bonus if applicable
        provider_bonus = 0.0
        if provider and provider.lower() in cls.PROVIDER_BONUSES:
            provider_bonus = cls.PROVIDER_BONUSES[provider.lower()]
        
        # Calculate total rate
        total_rate = rate_with_nft + provider_bonus
        
        # Apply maximum cap (10%)
        final_rate = min(total_rate, cls.MAX_CASHBACK_RATE)
        capped = total_rate > cls.MAX_CASHBACK_RATE
        
        # Calculate cashback amount
        cashback_amount = booking_amount * final_rate
        
        # Calculate breakdown
        breakdown = {
            "base_cashback": booking_amount * base_rate,
            "nft_bonus": booking_amount * (rate_with_nft - base_rate) if nft_multiplier > 1.0 else 0,
            "provider_bonus": booking_amount * provider_bonus if provider_bonus > 0 else 0,
            "total_before_cap": booking_amount * total_rate,
            "cap_reduction": booking_amount * (total_rate - final_rate) if capped else 0
        }
        
        return {
            "cashback_amount": round(cashback_amount, 2),
            "cashback_rate": round(final_rate * 100, 2),  # As percentage
            "tier": tier_enum.value,
            "booking_amount": booking_amount,
            "nft_multiplier": nft_multiplier,
            "provider": provider,
            "provider_bonus_rate": round(provider_bonus * 100, 2) if provider_bonus > 0 else 0,
            "capped": capped,
            "breakdown": {
                "base_cashback": round(breakdown["base_cashback"], 2),
                "nft_bonus": round(breakdown["nft_bonus"], 2),
                "provider_bonus": round(breakdown["provider_bonus"], 2),
                "total_before_cap": round(breakdown["total_before_cap"], 2),
                "cap_reduction": round(breakdown["cap_reduction"], 2)
            },
            "calculation_timestamp": datetime.utcnow().isoformat()
        }
    
    @classmethod
    def get_tier_requirements(cls) -> Dict:
        """Get requirements for each tier"""
        return {
            "bronze": {
                "name": "Bronze",
                "cashback_rate": "1%",
                "bookings_required": 1,
                "vip_perks": ["Basic rewards", "Travel NFTs"],
                "cost": "FREE (earned through bookings)"
            },
            "silver": {
                "name": "Silver",
                "cashback_rate": "3%",
                "bookings_required": 10,
                "vip_perks": ["Priority support", "Enhanced collection"],
                "cost": "$99 one-time or earn via 10 bookings"
            },
            "gold": {
                "name": "Gold",
                "cashback_rate": "6%",
                "bookings_required": 50,
                "vip_perks": ["Exclusive invitation-only stays", "Premium support"],
                "cost": "$299 one-time or earn via 50 bookings"
            },
            "platinum": {
                "name": "Platinum",
                "cashback_rate": "10%",
                "bookings_required": 100,
                "vip_perks": [
                    "VIP exclusive stays",
                    "Free Hugging Face LLM AI assistant",
                    "Maximum cashback rewards",
                    "Dedicated account manager"
                ],
                "cost": "$999 one-time or earn via 100 bookings"
            }
        }
    
    @classmethod
    def calculate_tier_progression(cls, current_bookings: int) -> Dict:
        """Calculate user's tier progression"""
        tiers = [
            ("bronze", 1),
            ("silver", 10),
            ("gold", 50),
            ("platinum", 100)
        ]
        
        # Determine current tier
        current_tier = "bronze"
        for tier, required in reversed(tiers):
            if current_bookings >= required:
                current_tier = tier
                break
        
        # Find next tier
        next_tier = None
        bookings_to_next = 0
        for tier, required in tiers:
            if current_bookings < required:
                next_tier = tier
                bookings_to_next = required - current_bookings
                break
        
        return {
            "current_tier": current_tier,
            "current_tier_cashback": f"{cls.TIER_RATES[TierLevel(current_tier)] * 100}%",
            "total_bookings": current_bookings,
            "next_tier": next_tier,
            "bookings_to_next_tier": bookings_to_next,
            "progress_percentage": (current_bookings / (current_bookings + bookings_to_next) * 100) if next_tier else 100
        }
    
    @classmethod
    def estimate_annual_cashback(cls, estimated_annual_spend: float, tier: str) -> Dict:
        """Estimate annual cashback based on spending"""
        tier_enum = TierLevel(tier.lower())
        base_rate = cls.TIER_RATES[tier_enum]
        
        # Calculate cashback for different scenarios
        scenarios = {
            "minimum": estimated_annual_spend * base_rate,
            "with_nft": estimated_annual_spend * base_rate * 1.25,  # 1.25x NFT multiplier
            "with_provider_bonuses": estimated_annual_spend * (base_rate + 0.03),  # Avg 3% provider bonus
            "maximum": estimated_annual_spend * cls.MAX_CASHBACK_RATE  # 10% cap
        }
        
        return {
            "estimated_annual_spend": estimated_annual_spend,
            "tier": tier,
            "base_cashback_rate": f"{base_rate * 100}%",
            "estimated_cashback": {
                "minimum": round(scenarios["minimum"], 2),
                "with_nft_multiplier": round(scenarios["with_nft"], 2),
                "with_provider_bonuses": round(scenarios["with_provider_bonuses"], 2),
                "maximum_possible": round(scenarios["maximum"], 2)
            }
        }


# Convenience functions for API endpoints
def calculate_booking_cashback(
    booking_amount: float,
    user_tier: str,
    nft_multiplier: float = 1.0,
    provider: Optional[str] = None
) -> Dict:
    """Calculate cashback for a single booking"""
    return CashbackCalculator.calculate_cashback(
        booking_amount=booking_amount,
        tier=user_tier,
        nft_multiplier=nft_multiplier,
        provider=provider
    )


def get_user_tier_info(bookings_count: int) -> Dict:
    """Get user's tier info based on booking count"""
    return CashbackCalculator.calculate_tier_progression(bookings_count)


def preview_tier_benefits(tier: str) -> Dict:
    """Get preview of tier benefits"""
    requirements = CashbackCalculator.get_tier_requirements()
    return requirements.get(tier.lower(), requirements["bronze"])


# Example usage
if __name__ == "__main__":
    print("="*80)
    print("MAKU TRAVEL CASHBACK CALCULATOR - TEST")
    print("="*80)
    
    # Test calculations
    test_cases = [
        {"booking_amount": 500, "user_tier": "bronze", "provider": None},
        {"booking_amount": 500, "user_tier": "silver", "provider": "amadeus"},
        {"booking_amount": 1000, "user_tier": "gold", "provider": "expedia"},
        {"booking_amount": 2000, "user_tier": "platinum", "provider": "expedia", "nft_multiplier": 1.3},
    ]
    
    for test in test_cases:
        print(f"\nTest: ${test['booking_amount']} booking - {test['user_tier'].upper()} tier")
        result = calculate_booking_cashback(**test)
        print(f"Cashback: ${result['cashback_amount']} ({result['cashback_rate']}%)")
        print(f"Breakdown: Base=${result['breakdown']['base_cashback']}, "
              f"NFT Bonus=${result['breakdown']['nft_bonus']}, "
              f"Provider=${result['breakdown']['provider_bonus']}")
        if result['capped']:
            print(f"⚠️  Capped at 10% maximum (would have been ${result['breakdown']['total_before_cap']})")
    
    print("\n" + "="*80)
    print("Tier Requirements:")
    print("="*80)
    for tier, info in CashbackCalculator.get_tier_requirements().items():
        print(f"\n{info['name']}: {info['cashback_rate']} cashback")
        print(f"  Bookings Required: {info['bookings_required']}")
        print(f"  Cost: {info['cost']}")
    
    print("\n" + "="*80)
    print("Tier Progression Example:")
    print("="*80)
    progression = get_user_tier_info(25)
    print(f"Current: {progression['current_tier'].upper()} ({progression['current_tier_cashback']})")
    print(f"Bookings: {progression['total_bookings']}")
    print(f"Next Tier: {progression['next_tier'].upper() if progression['next_tier'] else 'MAX TIER'}")
    print(f"Progress: {progression['progress_percentage']:.1f}%")
