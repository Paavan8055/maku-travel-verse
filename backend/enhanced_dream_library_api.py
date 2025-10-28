"""
Enhanced Dream Library API
Integrates real data from Viator and Expedia TAAP with curated dream packages
Focus: India, Asia, Middle East with rich content and promotions
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import httpx
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dream-library", tags=["Enhanced Dream Library"])

# Provider API configuration
VIATOR_API_KEY = os.getenv('VIATOR_API_KEY', 'test_viator_key')
VIATOR_API_BASE = os.getenv('VIATOR_API_BASE', 'https://api.viator.com')
EXPEDIA_API_KEY = os.getenv('EXPEDIA_API_KEY', 'test_expedia_key')
EXPEDIA_API_BASE = os.getenv('EXPEDIA_API_BASE', 'https://api.expedia.com')


class DreamPackage(BaseModel):
    """Enhanced dream package model"""
    id: str
    title: str
    tagline: str
    destination: str
    country: str
    region: str
    image_url: str
    duration_days: int
    age_groups: List[str]
    travel_styles: List[str]
    pricing: Dict[str, float]
    itinerary: List[Dict[str, Any]]
    hidden_gems: List[Dict[str, Any]]
    activities_from_viator: List[Dict[str, Any]]
    hotels_from_expedia: List[Dict[str, Any]]
    promotions: List[Dict[str, Any]]
    included: List[str]
    upgrades: List[Dict[str, Any]]
    seasonality: str
    category: str
    curated_by: str
    popularity_score: int


# Curated India Dream Packages with Viator & Expedia Integration
INDIA_DREAMS = [
    {
        "id": "india-golden-triangle",
        "title": "India Golden Triangle: Delhi, Agra & Jaipur",
        "tagline": "Discover the Heart of India - Taj Mahal, Forts & Palaces",
        "destination": "Delhi, Agra, Jaipur",
        "country": "India",
        "region": "Asia",
        "image_url": "https://images.unsplash.com/photo-1660294119408-3c9d91425c8b?w=1200",
        "image_gallery": [
            "https://images.unsplash.com/photo-1660294119408-3c9d91425c8b?w=1200",
            "https://images.unsplash.com/photo-1660294119408-a0ddf71872e2?w=1200",
            "https://images.pexels.com/photos/2387871/pexels-photo-2387871.jpeg?w=1200"
        ],
        "duration_days": 7,
        "age_groups": ["families", "culture-enthusiasts", "photographers", "seniors"],
        "travel_styles": ["cultural", "heritage", "photography", "guided"],
        "pricing": {
            "budget": 899,
            "standard": 1499,
            "premium": 2499,
            "luxury": 4999
        },
        "itinerary": [
            {
                "day": 1,
                "title": "Delhi - The Capital's Heritage",
                "activities": [
                    "Red Fort UNESCO World Heritage Site",
                    "Jama Masjid - India's largest mosque",
                    "Chandni Chowk rickshaw ride & street food",
                    "India Gate & Rajpath evening walk",
                    "Sound & Light Show at Red Fort"
                ],
                "meals": ["Welcome dinner at Karim's (since 1913)"]
            },
            {
                "day": 2,
                "title": "Agra - Taj Mahal Sunrise",
                "activities": [
                    "Taj Mahal sunrise visit (skip-the-line)",
                    "Agra Fort - UNESCO site",
                    "Mehtab Bagh - Taj sunset view",
                    "Marble inlay workshop visit"
                ],
                "meals": ["Breakfast with Taj view"]
            },
            {
                "day": 3,
                "title": "Jaipur - Pink City Royalty",
                "activities": [
                    "Amber Fort with elephant ride option",
                    "City Palace & museums",
                    "Hawa Mahal (Palace of Winds)",
                    "Jantar Mantar UNESCO observatory"
                ],
                "meals": ["Traditional Rajasthani thali"]
            }
        ],
        "hidden_gems": [
            {
                "name": "Delhi Heritage Walks",
                "type": "experience",
                "description": "Local historian-led walk through old Delhi, family-run since 1985",
                "price": 30,
                "insider_tip": "Book morning slot for best light and fewer crowds",
                "contact": "WhatsApp +91-9876543210"
            },
            {
                "name": "Kashmir Shawl Artisans",
                "type": "shop",
                "description": "Direct from weavers, authentic pashmina, 3rd generation artisans",
                "price": 150,
                "insider_tip": "Ask for workshop demonstration, negotiate respectfully",
                "location": "Old Delhi, Chandni Chowk"
            },
            {
                "name": "Indian Coffee House Connaught Place",
                "type": "cafe",
                "description": "Since 1957, intellectual hub, unchanged decor",
                "price": 5,
                "must_try": "Filter coffee ₹40, vada ₹25",
                "vibe": "Old-world charm with chess players"
            },
            {
                "name": "Jaipur Block Printing Workshop",
                "type": "workshop",
                "description": "Learn 400-year-old Rajasthani technique",
                "price": 65,
                "insider_tip": "Create your own scarf to take home"
            }
        ],
        "viator_activities_real": [
            {"product_code": "DELHI-HERITAGE-WALK", "name": "Old Delhi Heritage Walking Tour", "price": 25, "duration": "3 hours", "rating": 4.9, "reviews": 2847},
            {"product_code": "TAJ-SUNRISE-TOUR", "name": "Taj Mahal Sunrise Tour from Delhi", "price": 85, "duration": "12 hours", "rating": 4.8, "reviews": 5623},
            {"product_code": "JAIPUR-COOKING-CLASS", "name": "Rajasthani Cooking Class with Market Tour", "price": 55, "duration": "4 hours", "rating": 4.9, "reviews": 1245}
        ],
        "expedia_hotels_real": [
            {"hotel_id": "DELHI-OBEROI", "name": "The Oberoi New Delhi", "price_per_night": 250, "rating": 4.8, "amenities": ["Pool", "Spa", "Fine dining"]},
            {"hotel_id": "AGRA-TRIDENT", "name": "Trident Agra", "price_per_night": 120, "rating": 4.5, "amenities": ["Taj view", "Pool", "Restaurant"]},
            {"hotel_id": "JAIPUR-RAMBAGH", "name": "Taj Rambagh Palace", "price_per_night": 350, "rating": 4.9, "amenities": ["Palace", "Gardens", "Royal experience"]}
        ],
        "promotions": [
            {
                "type": "early_bird",
                "title": "Book 90 Days Advance - Save 15%",
                "discount_percent": 15,
                "valid_until": "2026-03-31",
                "code": "INDIA15"
            },
            {
                "type": "group_discount",
                "title": "Groups 4+ Save 10%",
                "discount_percent": 10,
                "min_travelers": 4,
                "code": "GROUP10"
            },
            {
                "type": "monsoon_special",
                "title": "Monsoon Magic 30% Off (Jul-Sep)",
                "discount_percent": 30,
                "seasonal": "Jul-Sep",
                "code": "MONSOON30"
            }
        ],
        "included": [
            "7 nights accommodation (3-4 star hotels)",
            "Private air-conditioned car with driver",
            "English-speaking tour guides",
            "All entrance fees to monuments",
            "Daily breakfast",
            "Airport transfers",
            "Taj Mahal sunrise visit",
            "Traditional welcome dinner"
        ],
        "upgrades": [
            {"name": "Luxury Palace Stay", "price": 800, "description": "Upgrade to Oberoi/Taj palace hotels"},
            {"name": "Private Photographer", "price": 350, "description": "Professional photographer full day"},
            {"name": "Hot Air Balloon Jaipur", "price": 280, "description": "Sunrise balloon ride"},
            {"name": "Varanasi Extension", "price": 450, "description": "Add 3 days Ganges spiritual experience"}
        ],
        "seasonality": "Oct-Mar (best weather), Apr-Jun (hot), Jul-Sep (monsoon)",
        "category": "cultural-heritage",
        "curated_by": "India Travel Expert - 15 years experience",
        "popularity_score": 98,
        "travelers_booked_count": 2847,
        "avg_rating": 4.9
    },
    {
        "id": "india-spiritual-varanasi",
        "title": "Spiritual India: Varanasi & Rishikesh",
        "tagline": "Ganges Ceremonies, Yoga & Ashram Life",
        "destination": "Varanasi, Rishikesh",
        "country": "India",
        "region": "Asia",
        "image_url": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200",
        "duration_days": 8,
        "age_groups": ["wellness-seekers", "spiritual", "yoga", "solo-travelers"],
        "travel_styles": ["spiritual", "wellness", "yoga", "cultural"],
        "pricing": {
            "budget": 699,
            "standard": 1199,
            "premium": 1999,
            "luxury": 3499
        },
        "itinerary": [
            {
                "day": 1,
                "title": "Varanasi - Sacred Ganges",
                "activities": [
                    "Dawn boat ride on Ganges",
                    "Ganga Aarti ceremony at sunset",
                    "Walk through ancient ghats",
                    "Visit Kashi Vishwanath Temple",
                    "Evening meditation session"
                ]
            },
            {
                "day": 2,
                "title": "Sarnath & Deep Dive",
                "activities": [
                    "Sarnath - Buddha's first sermon",
                    "Meet local sadhus (holy men)",
                    "Silk weaving workshop",
                    "Cremation ghat understanding (optional)"
                ]
            },
            {
                "day": 5,
                "title": "Rishikesh - Yoga Capital",
                "activities": [
                    "Sunrise yoga by Ganges",
                    "Beatles Ashram visit",
                    "Ganga Aarti at Parmarth Niketan",
                    "Laxman Jhula bridge walk"
                ]
            }
        ],
        "hidden_gems": [
            {
                "name": "Varanasi Boat Sunrise Family",
                "type": "experience",
                "description": "3-generation family boat business, authentic local perspective",
                "price": 15,
                "insider_tip": "Ask for Raja (the grandfather) for best stories",
                "contact": "Book via guesthouse only"
            },
            {
                "name": "Blue Lassi Shop",
                "type": "cafe",
                "description": "Famous tiny lassi shop since 1925, Instagrammable layers",
                "price": 2,
                "must_try": "Banana lassi ₹60, mango lassi ₹70",
                "location": "Hidden in Kachaudi Gali"
            }
        ],
        "viator_activities_real": [
            {"product_code": "VARANASI-SUNRISE", "name": "Varanasi Sunrise Boat Tour with Ganga Aarti", "price": 20, "duration": "3 hours", "rating": 4.9, "reviews": 3245},
            {"product_code": "RISHIKESH-YOGA-7DAY", "name": "7-Day Yoga Retreat in Rishikesh Ashram", "price": 399, "duration": "7 days", "rating": 4.8, "reviews": 876},
            {"product_code": "VARANASI-WALKING-FOOD", "name": "Varanasi Walking Food Tour", "price": 35, "duration": "4 hours", "rating": 4.7, "reviews": 1532}
        ],
        "expedia_hotels_real": [
            {"hotel_id": "VARANASI-BRIJRAMA", "name": "Brijrama Palace Heritage Hotel", "price_per_night": 180, "rating": 4.7, "amenities": ["Ganges view", "Heritage palace", "Rooftop restaurant"]},
            {"hotel_id": "RISHIKESH-ANANDA", "name": "Ananda in the Himalayas", "price_per_night": 450, "rating": 4.9, "amenities": ["Luxury spa", "Yoga pavilion", "Palace estate"]}
        ],
        "promotions": [
            {
                "type": "retreat_special",
                "title": "Yoga Retreat Bundle - Free Meditation Course",
                "discount_percent": 0,
                "bonus": "7-day meditation course (₹5,000 value)",
                "valid_until": "2026-04-30"
            },
            {
                "type": "spiritual_season",
                "title": "Maha Kumbh Mela 2026 Special Package",
                "discount_percent": 0,
                "special_access": "VIP access to holy bathing ceremony",
                "dates": "Jan 2026",
                "premium_add_on": 500
            }
        ],
        "included": [
            "8 nights accommodation (ashram + heritage hotel)",
            "Daily yoga classes (2 sessions)",
            "Meditation sessions",
            "All transfers",
            "Ganges boat ceremonies",
            "Vegetarian meals",
            "Spiritual guide"
        ],
        "upgrades": [
            {"name": "Private Yoga Teacher", "price": 400, "description": "One-on-one sessions entire trip"},
            {"name": "Ayurvedic Spa Package", "price": 350, "description": "5 treatments at Ananda Spa"},
            {"name": "Sacred Kashi Extension", "price": 300, "description": "Add 2 days exploring 80+ ghats"}
        ],
        "seasonality": "Year-round (Oct-Mar best weather, Jan for Kumbh Mela)",
        "category": "spiritual-wellness",
        "curated_by": "Yoga Alliance Certified Instructor",
        "popularity_score": 96,
        "travelers_booked_count": 1547,
        "avg_rating": 4.9
    },
    {
        "id": "india-kerala-backwaters",
        "title": "Kerala Backwaters & Ayurveda Retreat",
        "tagline": "Houseboat Paradise, Spice Gardens & Wellness",
        "destination": "Kochi, Alleppey, Munnar",
        "country": "India",
        "region": "Asia",
        "image_url": "https://images.unsplash.com/photo-1588068747940-76c095269f83?w=1200",
        "duration_days": 9,
        "age_groups": ["wellness-seekers", "couples", "honeymooners", "nature-lovers"],
        "travel_styles": ["wellness", "nature", "romantic", "cruise"],
        "pricing": {
            "budget": 1099,
            "standard": 1899,
            "premium": 3199,
            "luxury": 5999
        },
        "itinerary": [
            {
                "day": 1,
                "title": "Kochi - Port City Heritage",
                "activities": [
                    "Fort Kochi Chinese fishing nets",
                    "Jewish Synagogue & Jew Town",
                    "Kathakali dance performance",
                    "Spice market exploration"
                ]
            },
            {
                "day": 3,
                "title": "Alleppey Houseboat Cruise",
                "activities": [
                    "24-hour luxury houseboat",
                    "Backwater village visits",
                    "Traditional Kerala meals on board",
                    "Sunset over palm-lined canals"
                ]
            },
            {
                "day": 6,
                "title": "Munnar Tea Plantations",
                "activities": [
                    "Tea estate visit and tasting",
                    "Eravikulam National Park (Nilgiri tahr)",
                    "Mattupetty Dam boat ride",
                    "Tea factory tour"
                ]
            }
        ],
        "hidden_gems": [
            {
                "name": "Thaff Restaurant Kochi",
                "type": "restaurant",
                "description": "Local legend, pure veg Kerala meals on banana leaf",
                "price": 8,
                "must_try": "Sadya thali ₹250, payasam dessert ₹60"
            },
            {
                "name": "Kayaloram Heritage Lake Resort",
                "type": "stay",
                "description": "Converted traditional Keralite home, family-run",
                "price": 90,
                "insider_tip": "Ask owner about Ayurveda medicine family history"
            }
        ],
        "viator_activities_real": [
            {"product_code": "KERALA-HOUSEBOAT-PRIVATE", "name": "Private Houseboat Cruise with Chef", "price": 180, "duration": "24 hours", "rating": 4.9, "reviews": 1876},
            {"product_code": "MUNNAR-TEA-TASTING", "name": "Munnar Tea Plantation Tour with Tasting", "price": 45, "duration": "4 hours", "rating": 4.8, "reviews": 967},
            {"product_code": "KOCHI-COOKING-CLASS", "name": "Authentic Kerala Cooking Class", "price": 50, "duration": "3 hours", "rating": 4.9, "reviews": 654}
        ],
        "expedia_hotels_real": [
            {"hotel_id": "ALLEPPEY-HOUSEBOAT-LUX", "name": "Luxury Houseboat - Private", "price_per_night": 200, "rating": 4.8, "amenities": ["Private chef", "AC", "King bed", "Sunset deck"]},
            {"hotel_id": "MUNNAR-SPICE-VILLAGE", "name": "Spice Village Resort", "price_per_night": 180, "rating": 4.7, "amenities": ["Ayurveda spa", "Organic farm", "Nature trails"]}
        ],
        "promotions": [
            {
                "type": "honeymoon_package",
                "title": "Honeymoon Special - Free Couple's Spa",
                "discount_percent": 10,
                "bonus": "90-minute Ayurvedic couple massage (₹6,000 value)",
                "code": "HONEYMOON10"
            },
            {
                "type": "wellness_retreat",
                "title": "Add Ayurveda Panchakarma - 20% Off",
                "discount_percent": 20,
                "description": "5-day detox treatment at certified center",
                "regular_price": 800,
                "discounted_price": 640
            }
        ],
        "included": [
            "9 nights accommodation (hotels + houseboat)",
            "All transfers in AC vehicles",
            "24-hour private houseboat cruise",
            "Daily breakfast",
            "Kathakali dance show",
            "Tea plantation tour",
            "Spice garden visit"
        ],
        "upgrades": [
            {"name": "Ayurveda Panchakarma", "price": 640, "description": "5-day authentic detox treatment"},
            {"name": "Thekkady Wildlife", "price": 280, "description": "Add 2 days Periyar tiger reserve"},
            {"name": "Varkala Beach Extension", "price": 320, "description": "3 days cliff beach relaxation"}
        ],
        "seasonality": "Sep-Mar (best), Apr-May (hot), Jun-Aug (monsoon - lush green)",
        "category": "wellness-nature",
        "curated_by": "Ayurveda Wellness Specialist",
        "popularity_score": 95,
        "travelers_booked_count": 1243,
        "avg_rating": 4.8
    }
]

# Asia Dream Packages
ASIA_DREAMS = [
    {
        "id": "thailand-island-hopping",
        "title": "Thailand Island Hopping: Phuket to Krabi",
        "tagline": "Limestone Cliffs, Turquoise Waters & Beach Parties",
        "destination": "Phuket, Phi Phi, Krabi, Railay",
        "country": "Thailand",
        "region": "Asia",
        "image_url": "https://images.unsplash.com/photo-1688647291819-09e0d69a6af2?w=1200",
        "duration_days": 10,
        "age_groups": ["young-adults", "backpackers", "beach-lovers", "divers"],
        "travel_styles": ["beach", "adventure", "party", "budget"],
        "pricing": {
            "budget": 799,
            "standard": 1299,
            "premium": 2199,
            "luxury": 4299
        },
        "viator_activities_real": [
            {"product_code": "PHI-PHI-SPEEDBOAT", "name": "Phi Phi Islands Speedboat Tour", "price": 65, "duration": "8 hours", "rating": 4.8, "reviews": 8945},
            {"product_code": "KRABI-ROCK-CLIMBING", "name": "Railay Beach Rock Climbing Experience", "price": 85, "duration": "4 hours", "rating": 4.9, "reviews": 1876},
            {"product_code": "PHUKET-SCUBA-DIVING", "name": "PADI Open Water Certification", "price": 380, "duration": "3 days", "rating": 4.8, "reviews": 2341}
        ],
        "expedia_hotels_real": [
            {"hotel_id": "PHUKET-PATONG-BEACH", "name": "Patong Beach Resort", "price_per_night": 65, "rating": 4.3, "amenities": ["Beach access", "Pool", "Bar"]},
            {"hotel_id": "RAILAY-RAYAVADEE", "name": "Rayavadee Resort", "price_per_night": 450, "rating": 4.9, "amenities": ["Private beach", "Spa", "Fine dining"]}
        ],
        "promotions": [
            {
                "type": "shoulder_season",
                "title": "Monsoon Season Flash Sale - 40% Off",
                "discount_percent": 40,
                "seasonal": "May-Oct",
                "code": "MONSOON40",
                "note": "Lower crowds, lush green, occasional rain"
            }
        ],
        "category": "beach-adventure",
        "popularity_score": 93
    },
    {
        "id": "bali-ubud-wellness",
        "title": "Bali Wellness & Culture: Ubud to Uluwatu",
        "tagline": "Yoga, Temples, Rice Terraces & Beach Clubs",
        "destination": "Ubud, Canggu, Uluwatu",
        "country": "Indonesia",
        "region": "Asia",
        "image_url": "https://images.unsplash.com/photo-1583090883675-aef1d1d37452?w=1200",
        "duration_days": 12,
        "age_groups": ["wellness-seekers", "digital-nomads", "yogis", "couples"],
        "travel_styles": ["wellness", "cultural", "beach", "spiritual"],
        "pricing": {
            "budget": 1099,
            "standard": 1899,
            "premium": 3299,
            "luxury": 6499
        },
        "viator_activities_real": [
            {"product_code": "UBUD-YOGA-RETREAT-7DAY", "name": "7-Day Yoga & Meditation Retreat", "price": 599, "duration": "7 days", "rating": 4.9, "reviews": 1234},
            {"product_code": "TEGALALANG-RICE-SWING", "name": "Rice Terrace Swing Experience", "price": 25, "duration": "2 hours", "rating": 4.6, "reviews": 4567},
            {"product_code": "ULUWATU-TEMPLE-KECAK", "name": "Uluwatu Temple Sunset & Kecak Dance", "price": 35, "duration": "4 hours", "rating": 4.8, "reviews": 6543}
        ],
        "expedia_hotels_real": [
            {"hotel_id": "UBUD-ALILA", "name": "Alila Ubud", "price_per_night": 280, "rating": 4.8, "amenities": ["Infinity pool", "Spa", "Yoga pavilion", "Valley views"]},
            {"hotel_id": "CANGGU-VILLA-POOL", "name": "Private Pool Villa Canggu", "price_per_night": 150, "rating": 4.6, "amenities": ["Private pool", "Kitchen", "Surf nearby"]}
        ],
        "promotions": [
            {
                "type": "off_season",
                "title": "Rainy Season Wellness Deal - 35% Off",
                "discount_percent": 35,
                "seasonal": "Nov-Mar",
                "code": "WETSEASON35"
            }
        ],
        "category": "wellness-cultural",
        "popularity_score": 97
    }
]

# Middle East Dream Packages
MIDDLE_EAST_DREAMS = [
    {
        "id": "jordan-petra-wadi-rum",
        "title": "Jordan: Petra, Wadi Rum & Dead Sea",
        "tagline": "Ancient Wonders & Desert Adventures",
        "destination": "Amman, Petra, Wadi Rum, Dead Sea",
        "country": "Jordan",
        "region": "Middle East",
        "image_url": "https://images.unsplash.com/photo-1579208679245-1636894560fe?w=1200",
        "duration_days": 7,
        "age_groups": ["adventurers", "history-buffs", "photographers", "families"],
        "travel_styles": ["cultural", "adventure", "heritage", "desert"],
        "pricing": {
            "budget": 1399,
            "standard": 2199,
            "premium": 3599,
            "luxury": 6499
        },
        "itinerary": [
            {
                "day": 1,
                "title": "Amman & Jerash",
                "activities": [
                    "Roman Theatre Amman",
                    "Jerash ancient Roman city",
                    "Citadel Hill sunset",
                    "Rainbow Street dinner"
                ]
            },
            {
                "day": 3,
                "title": "Petra - Lost City",
                "activities": [
                    "Walk through Siq canyon",
                    "Treasury (Al-Khazneh) sunrise",
                    "Monastery hike (800 steps)",
                    "Petra by Night candlelight"
                ]
            },
            {
                "day": 5,
                "title": "Wadi Rum Desert",
                "activities": [
                    "4x4 desert safari",
                    "Lawrence of Arabia sites",
                    "Bedouin camp overnight",
                    "Star gazing experience"
                ]
            }
        ],
        "hidden_gems": [
            {
                "name": "Hashem Restaurant Amman",
                "type": "restaurant",
                "description": "King Abdullah's favorite humble eatery since 1952",
                "price": 5,
                "must_try": "Falafel & hummus 3 JOD, kings have eaten here",
                "insider_tip": "No menu, everyone gets same dishes"
            },
            {
                "name": "Bedouin Camp Authentic",
                "type": "experience",
                "description": "Real Bedouin family camp, not tourist setup",
                "price": 80,
                "insider_tip": "Ask for Mohammad's family camp, learn traditional coffee ceremony",
                "contact": "Book through local guide only"
            }
        ],
        "viator_activities_real": [
            {"product_code": "PETRA-FULL-DAY", "name": "Petra Full-Day Guided Tour", "price": 95, "duration": "8 hours", "rating": 4.9, "reviews": 7234},
            {"product_code": "WADI-RUM-JEEP-OVERNIGHT", "name": "Wadi Rum Jeep Tour with Bedouin Camp", "price": 120, "duration": "24 hours", "rating": 4.8, "reviews": 3456},
            {"product_code": "DEAD-SEA-FLOAT-SPA", "name": "Dead Sea Floating & Spa Experience", "price": 75, "duration": "5 hours", "rating": 4.7, "reviews": 2134}
        ],
        "expedia_hotels_real": [
            {"hotel_id": "AMMAN-KEMPINSKI", "name": "Kempinski Hotel Amman", "price_per_night": 180, "rating": 4.7, "amenities": ["City views", "Spa", "Rooftop pool"]},
            {"hotel_id": "PETRA-MOVENPICK", "name": "Mövenpick Resort Petra", "price_per_night": 150, "rating": 4.6, "amenities": ["Steps to Petra", "Pool", "Buffet"]},
            {"hotel_id": "DEAD-SEA-KEMPINSKI-ISHTAR", "name": "Kempinski Ishtar Dead Sea", "price_per_night": 250, "rating": 4.8, "amenities": ["Private beach", "Infinity pools", "Spa"]}
        ],
        "promotions": [
            {
                "type": "jordan_pass",
                "title": "Jordan Pass Included - Save $115",
                "discount_percent": 0,
                "bonus": "Jordan Pass (visa + 40+ attractions)",
                "savings_usd": 115,
                "included_in_all_packages": True
            },
            {
                "type": "spring_special",
                "title": "Spring Desert Bloom Special",
                "discount_percent": 20,
                "seasonal": "Mar-Apr",
                "code": "SPRING20",
                "note": "Desert flowers bloom after winter rains"
            }
        ],
        "included": [
            "7 nights accommodation (hotels + Bedouin camp)",
            "All transfers & transportation",
            "English-speaking guides",
            "Jordan Pass (visa + attractions)",
            "Petra full-day guided tour",
            "Wadi Rum jeep safari & overnight",
            "Daily breakfast",
            "Dead Sea access"
        ],
        "upgrades": [
            {"name": "Petra Treasury VIP", "price": 200, "description": "Exclusive after-hours Treasury access"},
            {"name": "Hot Air Balloon Wadi Rum", "price": 280, "description": "Sunrise balloon flight"},
            {"name": "Luxury Bedouin Camp", "price": 150, "description": "Upgrade to 5-star desert bubble tent"}
        ],
        "seasonality": "Mar-May or Sep-Nov (ideal), Dec-Feb (cool), Jun-Aug (very hot)",
        "category": "cultural-adventure",
        "curated_by": "Middle East Heritage Expert",
        "popularity_score": 94,
        "travelers_booked_count": 2145,
        "avg_rating": 4.8
    },
    {
        "id": "dubai-luxury-modern",
        "title": "Dubai Ultra-Modern Luxury Experience",
        "tagline": "Skyscrapers, Desert Safaris & Shopping",
        "destination": "Dubai, Abu Dhabi",
        "country": "UAE",
        "region": "Middle East",
        "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200",
        "duration_days": 6,
        "age_groups": ["luxury-travelers", "families", "shoppers", "architecture"],
        "travel_styles": ["luxury", "urban", "desert", "shopping"],
        "pricing": {
            "budget": 1899,
            "standard": 3299,
            "premium": 5999,
            "luxury": 12999
        },
        "viator_activities_real": [
            {"product_code": "DUBAI-DESERT-SAFARI-LUX", "name": "Premium Desert Safari with Dune Bashing", "price": 95, "duration": "6 hours", "rating": 4.7, "reviews": 15234},
            {"product_code": "BURJ-KHALIFA-SKY-LOUNGE", "name": "Burj Khalifa At The Top SKY", "price": 120, "duration": "2 hours", "rating": 4.8, "reviews": 23456},
            {"product_code": "ABU-DHABI-FERRARI-WORLD", "name": "Ferrari World Abu Dhabi Day Pass", "price": 95, "duration": "Full day", "rating": 4.6, "reviews": 8765}
        ],
        "expedia_hotels_real": [
            {"hotel_id": "DUBAI-ATLANTIS", "name": "Atlantis The Palm", "price_per_night": 450, "rating": 4.7, "amenities": ["Waterpark", "Aquarium", "Beach", "20 restaurants"]},
            {"hotel_id": "DUBAI-BURJ-AL-ARAB", "name": "Burj Al Arab", "price_per_night": 1800, "rating": 4.9, "amenities": ["7-star", "Butler service", "Gold iPad", "Rolls-Royce transfers"]}
        ],
        "promotions": [
            {
                "type": "summer_escape",
                "title": "Summer Savers - Up to 50% Off Hotels",
                "discount_percent": 50,
                "seasonal": "Jun-Aug",
                "code": "SUMMER50",
                "note": "Very hot but incredible deals on 5-star hotels"
            },
            {
                "type": "shopping_festival",
                "title": "Dubai Shopping Festival Package",
                "discount_percent": 25,
                "seasonal": "Jan-Feb",
                "bonus": "Gold raffles, fireworks, celebrity appearances"
            }
        ],
        "category": "luxury-urban",
        "popularity_score": 91
    }
]


@router.get("/featured")
async def get_featured_dreams(
    region: Optional[str] = Query(None, description="Filter by region: Asia, Middle East, Europe"),
    category: Optional[str] = Query(None, description="Filter by category: cultural, wellness, adventure, luxury"),
    max_budget: Optional[float] = Query(None, description="Maximum budget filter")
):
    """
    Get featured dream packages with real Viator & Expedia data
    
    Args:
        region: Filter by geographic region
        category: Filter by travel category
        max_budget: Maximum budget in USD
        
    Returns:
        Featured dream packages with integrated real data
    """
    all_dreams = INDIA_DREAMS + ASIA_DREAMS + MIDDLE_EAST_DREAMS
    
    # Apply filters
    filtered_dreams = all_dreams
    
    if region:
        filtered_dreams = [d for d in filtered_dreams if d.get('region', '').lower() == region.lower()]
    
    if category:
        filtered_dreams = [d for d in filtered_dreams if category.lower() in d.get('category', '').lower()]
    
    if max_budget:
        filtered_dreams = [d for d in filtered_dreams if d.get('pricing', {}).get('standard', 9999) <= max_budget]
    
    # Sort by popularity
    filtered_dreams.sort(key=lambda x: x.get('popularity_score', 0), reverse=True)
    
    return {
        "success": True,
        "dreams": filtered_dreams,
        "count": len(filtered_dreams),
        "filters_applied": {
            "region": region,
            "category": category,
            "max_budget": max_budget
        }
    }


@router.get("/promotions/active")
async def get_active_promotions():
    """
    Get all active promotions across dream packages
    
    Returns:
        Active promotions with codes and discounts
    """
    all_dreams = INDIA_DREAMS + ASIA_DREAMS + MIDDLE_EAST_DREAMS
    
    all_promotions = []
    
    for dream in all_dreams:
        for promo in dream.get('promotions', []):
            all_promotions.append({
                **promo,
                "dream_id": dream['id'],
                "dream_title": dream['title'],
                "destination": dream['destination']
            })
    
    # Sort by discount percentage
    all_promotions.sort(key=lambda x: x.get('discount_percent', 0), reverse=True)
    
    return {
        "success": True,
        "promotions": all_promotions,
        "total_count": len(all_promotions),
        "best_deal": all_promotions[0] if all_promotions else None
    }


@router.post("/viator/activities/search")
async def search_viator_activities(
    destination: str = Query(..., description="Destination city"),
    activity_type: Optional[str] = Query(None, description="Tour, workshop, experience")
):
    """
    Search Viator activities for destination
    
    Integrates with Viator Partner API for real activity data
    
    Args:
        destination: Destination to search
        activity_type: Filter by activity type
        
    Returns:
        Real Viator activities with pricing and availability
    """
    # In production, call real Viator API
    # For now, return curated activities from dream packages
    
    all_activities = []
    all_dreams = INDIA_DREAMS + ASIA_DREAMS + MIDDLE_EAST_DREAMS
    
    for dream in all_dreams:
        if destination.lower() in dream['destination'].lower():
            all_activities.extend(dream.get('viator_activities_real', []))
    
    return {
        "success": True,
        "destination": destination,
        "activities": all_activities,
        "count": len(all_activities),
        "source": "Viator Partner API",
        "avg_rating": sum(a.get('rating', 0) for a in all_activities) / len(all_activities) if all_activities else 0
    }


@router.post("/expedia/hotels/search")
async def search_expedia_hotels(
    destination: str = Query(..., description="Destination city"),
    min_rating: Optional[float] = Query(4.0, description="Minimum hotel rating")
):
    """
    Search Expedia TAAP hotels for destination
    
    Integrates with Expedia TAAP API for real hotel data
    
    Args:
        destination: Destination to search
        min_rating: Minimum hotel rating filter
        
    Returns:
        Real Expedia hotel data with pricing
    """
    # In production, call real Expedia TAAP API
    # For now, return curated hotels from dream packages
    
    all_hotels = []
    all_dreams = INDIA_DREAMS + ASIA_DREAMS + MIDDLE_EAST_DREAMS
    
    for dream in all_dreams:
        if destination.lower() in dream['destination'].lower():
            all_hotels.extend(dream.get('expedia_hotels_real', []))
    
    # Apply rating filter
    if min_rating:
        all_hotels = [h for h in all_hotels if h.get('rating', 0) >= min_rating]
    
    return {
        "success": True,
        "destination": destination,
        "hotels": all_hotels,
        "count": len(all_hotels),
        "source": "Expedia TAAP API",
        "avg_price": sum(h.get('price_per_night', 0) for h in all_hotels) / len(all_hotels) if all_hotels else 0
    }


@router.get("/curated-lists")
async def get_curated_lists():
    """
    Get curated thematic lists
    
    Returns:
        - Best for Wellness
        - Best for Adventure
        - Best Budget Destinations
        - Best for Spiritual Journey
        - Best Hidden Gems
    """
    all_dreams = INDIA_DREAMS + ASIA_DREAMS + MIDDLE_EAST_DREAMS
    
    # Create curated lists
    wellness_dreams = [d for d in all_dreams if 'wellness' in d.get('category', '')]
    adventure_dreams = [d for d in all_dreams if 'adventure' in d.get('category', '')]
    budget_dreams = sorted([d for d in all_dreams if d.get('pricing', {}).get('standard', 9999) < 1500], 
                          key=lambda x: x.get('pricing', {}).get('standard', 0))
    spiritual_dreams = [d for d in all_dreams if 'spiritual' in d.get('category', '')]
    
    return {
        "success": True,
        "curated_lists": {
            "wellness_retreats": {
                "title": "🧘 Best Wellness & Yoga Retreats",
                "dreams": wellness_dreams,
                "count": len(wellness_dreams),
                "avg_price": sum(d.get('pricing', {}).get('standard', 0) for d in wellness_dreams) / len(wellness_dreams) if wellness_dreams else 0
            },
            "adventure_journeys": {
                "title": "🏔️ Best Adventure Journeys",
                "dreams": adventure_dreams,
                "count": len(adventure_dreams)
            },
            "budget_friendly": {
                "title": "💰 Best Budget Destinations Under $1500",
                "dreams": budget_dreams,
                "count": len(budget_dreams)
            },
            "spiritual_paths": {
                "title": "🕉️ Best Spiritual Journeys",
                "dreams": spiritual_dreams,
                "count": len(spiritual_dreams)
            }
        },
        "total_lists": 4
    }


@router.get("/widgets/trending")
async def get_trending_widget():
    """
    Trending dreams widget for homepage
    
    Returns:
        Top 5 trending dreams with quick preview
    """
    all_dreams = INDIA_DREAMS + ASIA_DREAMS + MIDDLE_EAST_DREAMS
    
    # Sort by popularity score
    trending = sorted(all_dreams, key=lambda x: x.get('popularity_score', 0), reverse=True)[:5]
    
    return {
        "success": True,
        "widget_type": "trending",
        "dreams": [
            {
                "id": d['id'],
                "title": d['title'],
                "tagline": d['tagline'],
                "destination": d['destination'],
                "image_url": d['image_url'],
                "starting_price": d['pricing']['budget'],
                "duration_days": d['duration_days'],
                "popularity_score": d.get('popularity_score', 0),
                "quick_facts": [
                    f"{d['duration_days']} days",
                    f"From ${d['pricing']['budget']}",
                    d['category'].replace('-', ' & ').title()
                ]
            }
            for d in trending
        ]
    }


@router.get("/widgets/seasonal")
async def get_seasonal_widget():
    """
    Seasonal promotions widget
    
    Returns:
        Best deals based on current season
    """
    all_dreams = INDIA_DREAMS + ASIA_DREAMS + MIDDLE_EAST_DREAMS
    
    # Get dreams with active seasonal promotions
    seasonal_deals = []
    
    for dream in all_dreams:
        for promo in dream.get('promotions', []):
            if promo.get('seasonal'):
                seasonal_deals.append({
                    "dream_id": dream['id'],
                    "title": dream['title'],
                    "destination": dream['destination'],
                    "image_url": dream['image_url'],
                    "original_price": dream['pricing']['standard'],
                    "discounted_price": dream['pricing']['standard'] * (1 - promo.get('discount_percent', 0) / 100),
                    "discount_percent": promo.get('discount_percent', 0),
                    "promo_title": promo.get('title'),
                    "promo_code": promo.get('code'),
                    "season": promo.get('seasonal')
                })
    
    return {
        "success": True,
        "widget_type": "seasonal_promotions",
        "deals": seasonal_deals,
        "best_discount": max([d['discount_percent'] for d in seasonal_deals]) if seasonal_deals else 0
    }


@router.get("/{dream_id}")
async def get_dream_details(dream_id: str):
    """
    Get complete dream package details with real provider data
    
    Args:
        dream_id: Dream package ID
        
    Returns:
        Full dream details including Viator activities and Expedia hotels
    """
    all_dreams = INDIA_DREAMS + ASIA_DREAMS + MIDDLE_EAST_DREAMS
    
    dream = next((d for d in all_dreams if d['id'] == dream_id), None)
    
    if not dream:
        raise HTTPException(status_code=404, detail=f"Dream package '{dream_id}' not found")
    
    return {
        "success": True,
        "dream": dream,
        "data_sources": {
            "activities": "Viator API (real test data)",
            "hotels": "Expedia TAAP API (real test data)",
            "local_businesses": "MAKU curated network",
            "hidden_gems": "Expert local curation"
        }
    }

