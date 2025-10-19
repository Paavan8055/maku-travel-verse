"""
Yield Optimizer v1 - Full Scoring Algorithm
Implements 5-factor scoring system for matching dreams with campaigns
"""

from typing import List, Dict
from datetime import datetime, date

class YieldOptimizer:
    """
    Off-Season Yield Optimizer with 5-factor scoring
    Score range: 0-100
    """
    
    # Weight constants
    SEASONALITY_WEIGHT = 30
    DISCOUNT_WEIGHT = 25
    DREAM_MATCH_WEIGHT = 35
    WALLET_TIER_WEIGHT = 10
    BLACKOUT_PENALTY_MAX = 20
    
    # Tier bonuses
    TIER_BONUSES = {
        'platinum': 10,
        'gold': 7,
        'silver': 4,
        'bronze': 0
    }
    
    @classmethod
    def calculate_seasonality_score(cls, occupancy_rate: float) -> float:
        """
        Calculate seasonality gap weight (0-30 points)
        Lower occupancy = higher score (we want to fill empty rooms)
        
        Args:
            occupancy_rate: Current occupancy rate (0-100)
        
        Returns:
            Score from 0-30
        """
        if occupancy_rate < 20:
            return 30
        elif occupancy_rate < 40:
            return 20
        elif occupancy_rate < 60:
            return 10
        else:
            return 0
    
    @classmethod
    def calculate_discount_score(cls, discount_pct: float) -> float:
        """
        Calculate discount weight (0-25 points)
        Higher discount = higher score
        
        Args:
            discount_pct: Discount percentage (0-100)
        
        Returns:
            Score from 0-25
        """
        return (discount_pct / 100) * cls.DISCOUNT_WEIGHT
    
    @classmethod
    def calculate_dream_match_score(cls, dream_tags: List[str], 
                                    campaign_tags: List[str],
                                    dream_budget: float,
                                    campaign_price: float) -> float:
        """
        Calculate dream match weight (0-35 points)
        Based on tag overlap (20 pts) and budget fit (15 pts)
        
        Args:
            dream_tags: User's dream preference tags
            campaign_tags: Campaign's audience tags
            dream_budget: User's maximum budget
            campaign_price: Campaign's price after discount
        
        Returns:
            Score from 0-35
        """
        # Tag overlap score (0-20 points)
        if not dream_tags or not campaign_tags:
            tag_score = 0
        else:
            dream_set = set(tag.lower() for tag in dream_tags)
            campaign_set = set(tag.lower() for tag in campaign_tags)
            overlap = len(dream_set & campaign_set)
            total = len(dream_set)
            tag_overlap_ratio = overlap / total if total > 0 else 0
            tag_score = tag_overlap_ratio * 20
        
        # Budget fit score (0-15 points)
        if dream_budget == 0:
            budget_score = 0
        else:
            price_ratio = campaign_price / dream_budget
            if price_ratio <= 1.0:
                # Price is within or under budget
                budget_fit = 1 - abs(1 - price_ratio)
            else:
                # Price exceeds budget - penalize
                budget_fit = max(0, 1 - (price_ratio - 1))
            budget_score = budget_fit * 15
        
        return tag_score + budget_score
    
    @classmethod
    def calculate_wallet_tier_score(cls, tier: str) -> float:
        """
        Calculate wallet tier weight (0-10 points)
        Higher tier = higher score (encourages wallet usage)
        
        Args:
            tier: Wallet tier (bronze/silver/gold/platinum)
        
        Returns:
            Score from 0-10
        """
        return cls.TIER_BONUSES.get(tier.lower(), 0)
    
    @classmethod
    def calculate_blackout_penalty(cls, blackout_dates: List[str],
                                   campaign_start: date,
                                   campaign_end: date) -> float:
        """
        Calculate blackout penalty (0-20 points deduction)
        More blackout dates = higher penalty
        
        Args:
            blackout_dates: List of blackout dates (ISO format strings)
            campaign_start: Campaign start date
            campaign_end: Campaign end date
        
        Returns:
            Penalty from 0-20
        """
        if not blackout_dates:
            return 0
        
        total_days = (campaign_end - campaign_start).days + 1
        if total_days <= 0:
            return 0
        
        blackout_ratio = len(blackout_dates) / total_days
        penalty = min(blackout_ratio * cls.BLACKOUT_PENALTY_MAX, cls.BLACKOUT_PENALTY_MAX)
        
        return penalty
    
    @classmethod
    def calculate_score(cls, 
                       dream_tags: List[str],
                       dream_budget: float,
                       campaign_discount: float,
                       campaign_price: float,
                       campaign_tags: List[str],
                       wallet_tier: str,
                       blackout_dates: List[str],
                       campaign_start: date,
                       campaign_end: date,
                       occupancy_rate: float = None) -> Dict:
        """
        Calculate total yield optimization score (0-100)
        
        Returns dict with score and breakdown
        """
        # Calculate all factors
        seasonality = cls.calculate_seasonality_score(occupancy_rate or 50)
        discount = cls.calculate_discount_score(campaign_discount)
        dream_match = cls.calculate_dream_match_score(
            dream_tags, campaign_tags, dream_budget, campaign_price
        )
        wallet_tier_score = cls.calculate_wallet_tier_score(wallet_tier)
        blackout = cls.calculate_blackout_penalty(
            blackout_dates, campaign_start, campaign_end
        )
        
        # Calculate total score
        total = seasonality + discount + dream_match + wallet_tier_score - blackout
        total = max(0, min(total, 100))  # Clamp to 0-100
        
        return {
            'total_score': round(total, 2),
            'breakdown': {
                'seasonality_score': round(seasonality, 2),
                'discount_score': round(discount, 2),
                'dream_match_score': round(dream_match, 2),
                'wallet_tier_score': round(wallet_tier_score, 2),
                'blackout_penalty': round(blackout, 2)
            }
        }


# Unit tests
def test_perfect_match():
    """Test perfect match scenario"""
    result = YieldOptimizer.calculate_score(
        dream_tags=['family', 'beach', 'summer'],
        dream_budget=2000,
        campaign_discount=65,
        campaign_price=1300,  # 65% off from 3714
        campaign_tags=['family', 'beach', 'summer'],
        wallet_tier='platinum',
        blackout_dates=[],
        campaign_start=date(2025, 6, 1),
        campaign_end=date(2025, 8, 31),
        occupancy_rate=15  # Very low occupancy
    )
    
    print("Test 1: Perfect Match")
    print(f"Score: {result['total_score']}")
    print(f"Breakdown: {result['breakdown']}")
    assert result['total_score'] >= 85, "Perfect match should score >= 85"
    print("✅ PASS\n")


def test_no_match():
    """Test no match scenario"""
    result = YieldOptimizer.calculate_score(
        dream_tags=['adventure', 'mountains'],
        dream_budget=1000,
        campaign_discount=20,
        campaign_price=2500,  # Way over budget
        campaign_tags=['luxury', 'beach'],  # No overlap
        wallet_tier='bronze',
        blackout_dates=[f'2025-06-{i:02d}' for i in range(1, 21)],  # Many blackouts
        campaign_start=date(2025, 6, 1),
        campaign_end=date(2025, 6, 30),
        occupancy_rate=75  # High occupancy
    )
    
    print("Test 2: No Match")
    print(f"Score: {result['total_score']}")
    print(f"Breakdown: {result['breakdown']}")
    assert result['total_score'] < 20, "No match should score < 20"
    print("✅ PASS\n")


def test_discount_impact():
    """Test that higher discount increases score"""
    result_40 = YieldOptimizer.calculate_score(
        dream_tags=['family'],
        dream_budget=2000,
        campaign_discount=40,
        campaign_price=1200,
        campaign_tags=['family'],
        wallet_tier='silver',
        blackout_dates=[],
        campaign_start=date(2025, 6, 1),
        campaign_end=date(2025, 8, 31),
        occupancy_rate=40
    )
    
    result_65 = YieldOptimizer.calculate_score(
        dream_tags=['family'],
        dream_budget=2000,
        campaign_discount=65,
        campaign_price=700,
        campaign_tags=['family'],
        wallet_tier='silver',
        blackout_dates=[],
        campaign_start=date(2025, 6, 1),
        campaign_end=date(2025, 8, 31),
        occupancy_rate=40
    )
    
    print("Test 3: Discount Impact")
    print(f"40% discount score: {result_40['total_score']}")
    print(f"65% discount score: {result_65['total_score']}")
    assert result_65['total_score'] > result_40['total_score'], "Higher discount should score higher"
    print("✅ PASS\n")


def test_wallet_tier_impact():
    """Test wallet tier bonus"""
    tiers = ['bronze', 'silver', 'gold', 'platinum']
    scores = []
    
    print("Test 4: Wallet Tier Impact")
    for tier in tiers:
        result = YieldOptimizer.calculate_score(
            dream_tags=['family'],
            dream_budget=2000,
            campaign_discount=40,
            campaign_price=1200,
            campaign_tags=['family'],
            wallet_tier=tier,
            blackout_dates=[],
            campaign_start=date(2025, 6, 1),
            campaign_end=date(2025, 8, 31),
            occupancy_rate=40
        )
        scores.append(result['total_score'])
        print(f"{tier}: {result['total_score']}")
    
    # Ensure scores increase with tier
    for i in range(len(scores) - 1):
        assert scores[i] <= scores[i+1], f"Score should increase from {tiers[i]} to {tiers[i+1]}"
    
    print("✅ PASS\n")


if __name__ == "__main__":
    print("=" * 70)
    print("YIELD OPTIMIZER V1 - UNIT TESTS")
    print("=" * 70 + "\n")
    
    test_perfect_match()
    test_no_match()
    test_discount_impact()
    test_wallet_tier_impact()
    
    print("=" * 70)
    print("ALL TESTS PASSED ✅")
    print("=" * 70)
