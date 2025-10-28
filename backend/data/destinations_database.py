"""
Expanded Destination Content Database
40+ destinations with spiritual sites, hidden gems, and local businesses
"""

DESTINATIONS_EXPANDED = {
    # ASIA (15 destinations)
    'India': {
        'country_code': 'IN', 'region': 'Asia', 'currency': 'INR',
        'spiritual_sites': [
            {'name': 'Varanasi Ghats', 'type': 'spiritual', 'significance': 'Oldest living city, Ganges ceremonies', 'best_time': 'Oct-Mar'},
            {'name': 'Golden Temple Amritsar', 'type': 'spiritual', 'significance': 'Sikh holy shrine', 'best_time': 'Year-round'},
            {'name': 'Rishikesh Yoga Ashrams', 'type': 'spiritual', 'significance': 'Yoga capital, Ganga Aarti', 'best_time': 'Sep-Apr'},
            {'name': 'Bodh Gaya', 'type': 'spiritual', 'significance': 'Buddha enlightenment site', 'best_time': 'Oct-Mar'},
        ],
        'hidden_gems': [
            {'name': 'Hampi Ruins', 'description': 'Vijayanagar Empire capital', 'crowd_level': 'low'},
            {'name': 'Spiti Valley', 'description': 'High-altitude desert monasteries', 'crowd_level': 'very_low'},
            {'name': 'Ziro Valley', 'description': 'Apatani tribal villages', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Delhi Heritage Walks', 'type': 'guide', 'price': 30, 'verified': True},
            {'name': 'Kashmir Shawl Artisans', 'type': 'shop', 'price': 150, 'verified': True},
            {'name': 'Varanasi Boat Sunrise', 'type': 'experience', 'price': 15, 'verified': True},
        ]
    },
    
    'Thailand': {
        'country_code': 'TH', 'region': 'Asia', 'currency': 'THB',
        'spiritual_sites': [
            {'name': 'Wat Phra Kaew Bangkok', 'type': 'spiritual', 'significance': 'Emerald Buddha temple', 'best_time': 'Nov-Feb'},
            {'name': 'Doi Suthep Chiang Mai', 'type': 'spiritual', 'significance': 'Mountain golden temple', 'best_time': 'Nov-Feb'},
            {'name': 'Ayutthaya Ancient City', 'type': 'spiritual', 'significance': 'UNESCO temple complex', 'best_time': 'Nov-Feb'},
        ],
        'hidden_gems': [
            {'name': 'Pai Canyon', 'description': 'Sunset viewpoint, hippie vibe', 'crowd_level': 'medium'},
            {'name': 'Koh Lipe', 'description': 'Maldives of Thailand', 'crowd_level': 'low'},
            {'name': 'Sangkhlaburi', 'description': 'Wooden bridge, Mon culture', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Chiang Mai Cooking Class', 'type': 'experience', 'price': 40, 'verified': True},
            {'name': 'Bangkok Street Food Tours', 'type': 'guide', 'price': 35, 'verified': True},
        ]
    },
    
    'Japan': {
        'country_code': 'JP', 'region': 'Asia', 'currency': 'JPY',
        'spiritual_sites': [
            {'name': 'Fushimi Inari Shrine', 'type': 'spiritual', 'significance': '10,000 torii gates', 'best_time': 'Mar-May'},
            {'name': 'Mount Koya', 'type': 'spiritual', 'significance': 'Buddhist temple town', 'best_time': 'Year-round'},
            {'name': 'Ise Grand Shrine', 'type': 'spiritual', 'significance': 'Most sacred Shinto shrine', 'best_time': 'Year-round'},
        ],
        'hidden_gems': [
            {'name': 'Naoshima Art Island', 'description': 'Contemporary art museums', 'crowd_level': 'low'},
            {'name': 'Takayama Old Town', 'description': 'Edo-period streets', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Tokyo Ramen Class', 'type': 'workshop', 'price': 80, 'verified': True},
            {'name': 'Kyoto Tea Ceremony', 'type': 'experience', 'price': 50, 'verified': True},
        ]
    },
    
    'Bali': {
        'country_code': 'ID', 'region': 'Asia', 'currency': 'IDR',
        'spiritual_sites': [
            {'name': 'Tirta Empul Temple', 'type': 'spiritual', 'significance': 'Holy spring purification', 'best_time': 'Apr-Sep'},
            {'name': 'Uluwatu Temple', 'type': 'spiritual', 'significance': 'Clifftop Kecak dance', 'best_time': 'Sunset'},
        ],
        'hidden_gems': [
            {'name': 'Sidemen Valley', 'description': 'Rice terraces, weaving', 'crowd_level': 'very_low'},
            {'name': 'Nusa Penida Beaches', 'description': 'Kelingking Beach', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Ubud Traditional Spa', 'type': 'wellness', 'price': 45, 'verified': True},
            {'name': 'Balinese Cooking School', 'type': 'workshop', 'price': 55, 'verified': True},
        ]
    },
    
    'Vietnam': {
        'country_code': 'VN', 'region': 'Asia', 'currency': 'VND',
        'spiritual_sites': [
            {'name': 'Perfume Pagoda', 'type': 'spiritual', 'significance': 'Cave temple complex', 'best_time': 'Feb-Apr'},
            {'name': 'Thien Mu Pagoda', 'type': 'spiritual', 'significance': 'Historic Hue temple', 'best_time': 'Year-round'},
        ],
        'hidden_gems': [
            {'name': 'Phong Nha Caves', 'description': 'Worlds largest caves', 'crowd_level': 'low'},
            {'name': 'Ha Giang Loop', 'description': 'Mountain motorbike route', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Hanoi Street Food Walk', 'type': 'guide', 'price': 25, 'verified': True},
            {'name': 'Hoi An Lantern Making', 'type': 'workshop', 'price': 30, 'verified': True},
        ]
    },
    
    'Cambodia': {
        'country_code': 'KH', 'region': 'Asia', 'currency': 'USD',
        'spiritual_sites': [
            {'name': 'Angkor Wat', 'type': 'spiritual', 'significance': 'Largest temple complex', 'best_time': 'Nov-Mar'},
            {'name': 'Ta Prohm Temple', 'type': 'spiritual', 'significance': 'Tree-covered ruins', 'best_time': 'Nov-Mar'},
        ],
        'hidden_gems': [
            {'name': 'Koh Rong Island', 'description': 'Bioluminescent plankton', 'crowd_level': 'low'},
            {'name': 'Kampot Pepper Farms', 'description': 'Worlds best pepper', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Siem Reap Cooking Class', 'type': 'workshop', 'price': 35, 'verified': True},
        ]
    },
    
    'Nepal': {
        'country_code': 'NP', 'region': 'Asia', 'currency': 'NPR',
        'spiritual_sites': [
            {'name': 'Pashupatinath Temple', 'type': 'spiritual', 'significance': 'Hindu cremation ghats', 'best_time': 'Oct-Apr'},
            {'name': 'Swayambhunath Stupa', 'type': 'spiritual', 'significance': 'Monkey Temple', 'best_time': 'Oct-Apr'},
        ],
        'hidden_gems': [
            {'name': 'Poon Hill Trek', 'description': 'Annapurna sunrise views', 'crowd_level': 'medium'},
            {'name': 'Chitwan National Park', 'description': 'Bengal tiger habitat', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Kathmandu Valley Guide', 'type': 'guide', 'price': 40, 'verified': True},
        ]
    },
    
    'Sri Lanka': {
        'country_code': 'LK', 'region': 'Asia', 'currency': 'LKR',
        'spiritual_sites': [
            {'name': 'Temple of the Tooth', 'type': 'spiritual', 'significance': 'Buddha tooth relic', 'best_time': 'Dec-Mar'},
            {'name': 'Sigiriya Rock Fortress', 'type': 'spiritual', 'significance': 'Ancient palace ruins', 'best_time': 'Dec-Mar'},
        ],
        'hidden_gems': [
            {'name': 'Ella Nine Arch Bridge', 'description': 'Colonial railway', 'crowd_level': 'medium'},
            {'name': 'Mirissa Whale Watching', 'description': 'Blue whales', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Ceylon Tea Plantation Tour', 'type': 'experience', 'price': 25, 'verified': True},
        ]
    },
    
    'South Korea': {
        'country_code': 'KR', 'region': 'Asia', 'currency': 'KRW',
        'spiritual_sites': [
            {'name': 'Bulguksa Temple', 'type': 'spiritual', 'significance': 'UNESCO Buddhist temple', 'best_time': 'Spring/Fall'},
            {'name': 'Jogyesa Temple', 'type': 'spiritual', 'significance': 'Seoul lantern festival', 'best_time': 'May'},
        ],
        'hidden_gems': [
            {'name': 'Jeju Olle Trail', 'description': 'Coastal hiking paths', 'crowd_level': 'low'},
            {'name': 'Jeonju Hanok Village', 'description': 'Traditional houses', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Seoul Kimchi Making Class', 'type': 'workshop', 'price': 45, 'verified': True},
        ]
    },
    
    'Malaysia': {
        'country_code': 'MY', 'region': 'Asia', 'currency': 'MYR',
        'spiritual_sites': [
            {'name': 'Batu Caves', 'type': 'spiritual', 'significance': 'Hindu limestone cave temple', 'best_time': 'Jan-Feb'},
        ],
        'hidden_gems': [
            {'name': 'Cameron Highlands', 'description': 'Tea plantations, cooler climate', 'crowd_level': 'medium'},
            {'name': 'Perhentian Islands', 'description': 'Snorkeling paradise', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Penang Street Food Tour', 'type': 'guide', 'price': 30, 'verified': True},
        ]
    },
    
    # EUROPE (10 destinations)
    'Italy': {
        'country_code': 'IT', 'region': 'Europe', 'currency': 'EUR',
        'spiritual_sites': [
            {'name': 'Vatican City', 'type': 'spiritual', 'significance': 'Catholic holy site', 'best_time': 'Apr-Jun'},
            {'name': 'Assisi Basilica', 'type': 'spiritual', 'significance': 'St. Francis birthplace', 'best_time': 'Apr-Jun'},
        ],
        'hidden_gems': [
            {'name': 'Cinque Terre', 'description': 'Five coastal villages', 'crowd_level': 'high'},
            {'name': 'Matera Cave Dwellings', 'description': '9,000-year-old city', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Tuscan Cooking Class', 'type': 'workshop', 'price': 120, 'verified': True},
            {'name': 'Rome Colosseum Guide', 'type': 'guide', 'price': 60, 'verified': True},
        ]
    },
    
    'Spain': {
        'country_code': 'ES', 'region': 'Europe', 'currency': 'EUR',
        'spiritual_sites': [
            {'name': 'Sagrada Familia', 'type': 'spiritual', 'significance': 'Gaudi masterpiece', 'best_time': 'Apr-Jun'},
            {'name': 'Santiago de Compostela', 'type': 'spiritual', 'significance': 'Pilgrimage route end', 'best_time': 'May-Sep'},
        ],
        'hidden_gems': [
            {'name': 'Ronda White Villages', 'description': 'Cliffside towns', 'crowd_level': 'medium'},
            {'name': 'Camino de Santiago', 'description': 'Pilgrimage trail', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Barcelona Tapas Tour', 'type': 'guide', 'price': 75, 'verified': True},
            {'name': 'Flamenco Dance Class', 'type': 'workshop', 'price': 50, 'verified': True},
        ]
    },
    
    'France': {
        'country_code': 'FR', 'region': 'Europe', 'currency': 'EUR',
        'spiritual_sites': [
            {'name': 'Notre-Dame Cathedral', 'type': 'spiritual', 'significance': 'Gothic masterpiece', 'best_time': 'Apr-Jun'},
            {'name': 'Mont Saint-Michel', 'type': 'spiritual', 'significance': 'Island abbey', 'best_time': 'Apr-Oct'},
        ],
        'hidden_gems': [
            {'name': 'Provence Lavender Fields', 'description': 'Purple landscapes', 'crowd_level': 'high'},
            {'name': 'Colmar Fairy Tale Town', 'description': 'Half-timbered houses', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Paris Pastry Workshop', 'type': 'workshop', 'price': 95, 'verified': True},
            {'name': 'Loire Valley Wine Tour', 'type': 'experience', 'price': 110, 'verified': True},
        ]
    },
    
    'Greece': {
        'country_code': 'GR', 'region': 'Europe', 'currency': 'EUR',
        'spiritual_sites': [
            {'name': 'Delphi Oracle', 'type': 'spiritual', 'significance': 'Ancient prophecy site', 'best_time': 'Apr-Jun'},
            {'name': 'Meteora Monasteries', 'type': 'spiritual', 'significance': 'Clifftop monasteries', 'best_time': 'Apr-Jun'},
        ],
        'hidden_gems': [
            {'name': 'Navagio Beach Zakynthos', 'description': 'Shipwreck Beach', 'crowd_level': 'high'},
            {'name': 'Monemvasia', 'description': 'Medieval castle town', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Athens Food Tour', 'type': 'guide', 'price': 65, 'verified': True},
        ]
    },
    
    'Portugal': {
        'country_code': 'PT', 'region': 'Europe', 'currency': 'EUR',
        'spiritual_sites': [
            {'name': 'Fatima Sanctuary', 'type': 'spiritual', 'significance': 'Marian apparition site', 'best_time': 'May-Oct'},
        ],
        'hidden_gems': [
            {'name': 'Benagil Sea Cave', 'description': 'Natural skylight cave', 'crowd_level': 'high'},
            {'name': 'Douro Valley', 'description': 'Port wine region', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Lisbon Fado Dinner', 'type': 'experience', 'price': 85, 'verified': True},
        ]
    },
    
    'Turkey': {
        'country_code': 'TR', 'region': 'Europe', 'currency': 'TRY',
        'spiritual_sites': [
            {'name': 'Hagia Sophia', 'type': 'spiritual', 'significance': 'Byzantine cathedral', 'best_time': 'Apr-Oct'},
            {'name': 'Rumi Mausoleum', 'type': 'spiritual', 'significance': 'Sufi mystic shrine', 'best_time': 'Year-round'},
        ],
        'hidden_gems': [
            {'name': 'Cappadocia Fairy Chimneys', 'description': 'Hot air balloon rides', 'crowd_level': 'high'},
            {'name': 'Pamukkale Terraces', 'description': 'White travertine pools', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Istanbul Spice Market Tour', 'type': 'guide', 'price': 40, 'verified': True},
        ]
    },
    
    'Croatia': {
        'country_code': 'HR', 'region': 'Europe', 'currency': 'EUR',
        'hidden_gems': [
            {'name': 'Plitvice Lakes', 'description': '16 terraced lakes', 'crowd_level': 'high'},
            {'name': 'Kornati Islands', 'description': 'Sailing archipelago', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Dubrovnik Walking Tour', 'type': 'guide', 'price': 55, 'verified': True},
        ]
    },
    
    'Iceland': {
        'country_code': 'IS', 'region': 'Europe', 'currency': 'ISK',
        'hidden_gems': [
            {'name': 'Landmannalaugar', 'description': 'Rainbow mountains', 'crowd_level': 'low'},
            {'name': 'Jokulsarlon Glacier Lagoon', 'description': 'Icebergs', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Reykjavik Northern Lights Tour', 'type': 'experience', 'price': 95, 'verified': True},
        ]
    },
    
    'Scotland': {
        'country_code': 'GB', 'region': 'Europe', 'currency': 'GBP',
        'hidden_gems': [
            {'name': 'Isle of Skye', 'description': 'Fairy Pools, Old Man', 'crowd_level': 'medium'},
            {'name': 'Glencoe Valley', 'description': 'Highland dramatic scenery', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Edinburgh Ghost Tour', 'type': 'guide', 'price': 45, 'verified': True},
            {'name': 'Whisky Distillery Tour', 'type': 'experience', 'price': 70, 'verified': True},
        ]
    },
    
    'Norway': {
        'country_code': 'NO', 'region': 'Europe', 'currency': 'NOK',
        'hidden_gems': [
            {'name': 'Lofoten Islands', 'description': 'Arctic fishing villages', 'crowd_level': 'low'},
            {'name': 'Geirangerfjord', 'description': 'UNESCO fjord', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Bergen Fjord Cruise', 'type': 'experience', 'price': 120, 'verified': True},
        ]
    },
    
    # AMERICAS (10 destinations)
    'Peru': {
        'country_code': 'PE', 'region': 'South America', 'currency': 'PEN',
        'spiritual_sites': [
            {'name': 'Machu Picchu', 'type': 'spiritual', 'significance': 'Incan citadel', 'best_time': 'Apr-Oct'},
            {'name': 'Sacred Valley', 'type': 'spiritual', 'significance': 'Incan ceremonial sites', 'best_time': 'Apr-Oct'},
        ],
        'hidden_gems': [
            {'name': 'Rainbow Mountain', 'description': 'Vinicunca colored stripes', 'crowd_level': 'high'},
            {'name': 'Colca Canyon', 'description': 'Deeper than Grand Canyon', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Lima Food Tour', 'type': 'experience', 'price': 60, 'verified': True},
            {'name': 'Cusco Weaving Cooperative', 'type': 'shop', 'price': 40, 'verified': True},
        ]
    },
    
    'Mexico': {
        'country_code': 'MX', 'region': 'North America', 'currency': 'MXN',
        'spiritual_sites': [
            {'name': 'Chichen Itza', 'type': 'spiritual', 'significance': 'Mayan pyramid', 'best_time': 'Nov-Apr'},
            {'name': 'Teotihuacan', 'type': 'spiritual', 'significance': 'Pyramid of the Sun', 'best_time': 'Mar-May'},
        ],
        'hidden_gems': [
            {'name': 'Cenotes Yucatan', 'description': 'Underwater sinkholes', 'crowd_level': 'medium'},
            {'name': 'San Miguel de Allende', 'description': 'Colonial art town', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Oaxaca Mezcal Tasting', 'type': 'experience', 'price': 50, 'verified': True},
            {'name': 'Mexico City Street Art Tour', 'type': 'guide', 'price': 35, 'verified': True},
        ]
    },
    
    'Costa Rica': {
        'country_code': 'CR', 'region': 'Central America', 'currency': 'USD',
        'hidden_gems': [
            {'name': 'Monteverde Cloud Forest', 'description': 'Suspended bridges', 'crowd_level': 'medium'},
            {'name': 'Rio Celeste', 'description': 'Blue waterfall', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Manuel Antonio Wildlife Tour', 'type': 'guide', 'price': 65, 'verified': True},
            {'name': 'Coffee Plantation Tour', 'type': 'experience', 'price': 40, 'verified': True},
        ]
    },
    
    'Brazil': {
        'country_code': 'BR', 'region': 'South America', 'currency': 'BRL',
        'spiritual_sites': [
            {'name': 'Christ the Redeemer', 'type': 'spiritual', 'significance': 'Iconic Rio statue', 'best_time': 'Dec-Mar'},
        ],
        'hidden_gems': [
            {'name': 'Lencois Maranhenses', 'description': 'Desert lagoons', 'crowd_level': 'very_low'},
            {'name': 'Amazon Rainforest Lodge', 'description': 'Jungle immersion', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Rio Favela Tour', 'type': 'guide', 'price': 45, 'verified': True},
            {'name': 'Samba Dance Class', 'type': 'workshop', 'price': 40, 'verified': True},
        ]
    },
    
    'Argentina': {
        'country_code': 'AR', 'region': 'South America', 'currency': 'ARS',
        'hidden_gems': [
            {'name': 'Perito Moreno Glacier', 'description': 'Advancing glacier', 'crowd_level': 'medium'},
            {'name': 'Iguazu Falls', 'description': 'Massive waterfall system', 'crowd_level': 'high'},
        ],
        'local_businesses': [
            {'name': 'Buenos Aires Tango Show', 'type': 'experience', 'price': 70, 'verified': True},
            {'name': 'Patagonia Trekking Guide', 'type': 'guide', 'price': 150, 'verified': True},
        ]
    },
    
    'Canada': {
        'country_code': 'CA', 'region': 'North America', 'currency': 'CAD',
        'hidden_gems': [
            {'name': 'Banff National Park', 'description': 'Rocky Mountain lakes', 'crowd_level': 'high'},
            {'name': 'Tofino Surf Town', 'description': 'Pacific rainforest', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Vancouver Food Tour', 'type': 'guide', 'price': 80, 'verified': True},
            {'name': 'Quebec City History Walk', 'type': 'guide', 'price': 50, 'verified': True},
        ]
    },
    
    'USA': {
        'country_code': 'US', 'region': 'North America', 'currency': 'USD',
        'hidden_gems': [
            {'name': 'Antelope Canyon', 'description': 'Slot canyon photography', 'crowd_level': 'high'},
            {'name': 'Great Smoky Mountains', 'description': 'Appalachian biodiversity', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'New York Pizza Tour', 'type': 'guide', 'price': 60, 'verified': True},
            {'name': 'Nashville Music Tour', 'type': 'experience', 'price': 55, 'verified': True},
        ]
    },
    
    # AFRICA & MIDDLE EAST (10 destinations)
    'Morocco': {
        'country_code': 'MA', 'region': 'Africa', 'currency': 'MAD',
        'spiritual_sites': [
            {'name': 'Hassan II Mosque', 'type': 'spiritual', 'significance': '7th largest mosque', 'best_time': 'Year-round'},
        ],
        'hidden_gems': [
            {'name': 'Chefchaouen Blue City', 'description': 'Blue-painted medina', 'crowd_level': 'medium'},
            {'name': 'Erg Chebbi Dunes', 'description': 'Sahara camping', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Fes Tannery Tour', 'type': 'experience', 'price': 25, 'verified': True},
            {'name': 'Marrakech Souk Guide', 'type': 'guide', 'price': 30, 'verified': True},
        ]
    },
    
    'Egypt': {
        'country_code': 'EG', 'region': 'Africa', 'currency': 'EGP',
        'spiritual_sites': [
            {'name': 'Great Pyramid Giza', 'type': 'spiritual', 'significance': 'Ancient wonder', 'best_time': 'Oct-Apr'},
            {'name': 'Abu Simbel', 'type': 'spiritual', 'significance': 'Ramses II temple', 'best_time': 'Oct-Apr'},
        ],
        'hidden_gems': [
            {'name': 'Siwa Oasis', 'description': 'Desert springs', 'crowd_level': 'very_low'},
            {'name': 'White Desert', 'description': 'Chalk formations', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Cairo Museum Tour', 'type': 'guide', 'price': 45, 'verified': True},
        ]
    },
    
    'Kenya': {
        'country_code': 'KE', 'region': 'Africa', 'currency': 'KES',
        'hidden_gems': [
            {'name': 'Maasai Mara', 'description': 'Great migration safari', 'crowd_level': 'high'},
            {'name': 'Lake Nakuru', 'description': 'Pink flamingo flocks', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Maasai Village Visit', 'type': 'experience', 'price': 50, 'verified': True},
        ]
    },
    
    'South Africa': {
        'country_code': 'ZA', 'region': 'Africa', 'currency': 'ZAR',
        'hidden_gems': [
            {'name': 'Blyde River Canyon', 'description': 'Third largest canyon', 'crowd_level': 'medium'},
            {'name': 'Wild Coast Hiking', 'description': 'Untouched coastline', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Cape Town Wine Tour', 'type': 'experience', 'price': 90, 'verified': True},
            {'name': 'Township Cultural Tour', 'type': 'guide', 'price': 40, 'verified': True},
        ]
    },
    
    'Jordan': {
        'country_code': 'JO', 'region': 'Middle East', 'currency': 'JOD',
        'spiritual_sites': [
            {'name': 'Petra Treasury', 'type': 'spiritual', 'significance': 'Nabataean rock city', 'best_time': 'Mar-May'},
        ],
        'hidden_gems': [
            {'name': 'Wadi Rum Desert', 'description': 'Mars-like landscape', 'crowd_level': 'medium'},
            {'name': 'Dead Sea Float', 'description': 'Lowest point on Earth', 'crowd_level': 'high'},
        ],
        'local_businesses': [
            {'name': 'Bedouin Camp Experience', 'type': 'experience', 'price': 80, 'verified': True},
        ]
    },
    
    'UAE': {
        'country_code': 'AE', 'region': 'Middle East', 'currency': 'AED',
        'hidden_gems': [
            {'name': 'Al Ain Oasis', 'description': 'UNESCO date palm garden', 'crowd_level': 'low'},
            {'name': 'Hatta Mountain Trail', 'description': 'Kayaking in mountains', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Dubai Desert Safari', 'type': 'experience', 'price': 70, 'verified': True},
            {'name': 'Gold Souk Shopping Guide', 'type': 'guide', 'price': 35, 'verified': True},
        ]
    },
    
    'Israel': {
        'country_code': 'IL', 'region': 'Middle East', 'currency': 'ILS',
        'spiritual_sites': [
            {'name': 'Western Wall Jerusalem', 'type': 'spiritual', 'significance': 'Jewish holy site', 'best_time': 'Mar-May'},
            {'name': 'Church of Holy Sepulchre', 'type': 'spiritual', 'significance': 'Christian pilgrimage', 'best_time': 'Mar-May'},
        ],
        'hidden_gems': [
            {'name': 'Dead Sea Masada', 'description': 'Ancient fortress', 'crowd_level': 'medium'},
            {'name': 'Negev Desert Craters', 'description': 'Geological wonders', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Tel Aviv Food Tour', 'type': 'guide', 'price': 65, 'verified': True},
        ]
    },
    
    # OCEANIA (5 destinations)
    'Australia': {
        'country_code': 'AU', 'region': 'Oceania', 'currency': 'AUD',
        'hidden_gems': [
            {'name': 'Great Ocean Road', 'description': '12 Apostles coastal drive', 'crowd_level': 'high'},
            {'name': 'Tasmania Wilderness', 'description': 'Untouched nature', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Sydney Harbor Kayak', 'type': 'activity', 'price': 75, 'verified': True},
            {'name': 'Aboriginal Cultural Tour', 'type': 'experience', 'price': 95, 'verified': True},
        ]
    },
    
    'New Zealand': {
        'country_code': 'NZ', 'region': 'Oceania', 'currency': 'NZD',
        'hidden_gems': [
            {'name': 'Milford Sound', 'description': 'Fiordland National Park', 'crowd_level': 'high'},
            {'name': 'Hobbiton Movie Set', 'description': 'Lord of the Rings', 'crowd_level': 'high'},
        ],
        'local_businesses': [
            {'name': 'Maori Cultural Experience', 'type': 'experience', 'price': 85, 'verified': True},
            {'name': 'Queenstown Bungee Jump', 'type': 'activity', 'price': 180, 'verified': True},
        ]
    },
    
    'Fiji': {
        'country_code': 'FJ', 'region': 'Oceania', 'currency': 'FJD',
        'hidden_gems': [
            {'name': 'Yasawa Islands', 'description': 'Remote island hopping', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Village Kava Ceremony', 'type': 'experience', 'price': 30, 'verified': True},
        ]
    },
    
    'Tahiti': {
        'country_code': 'PF', 'region': 'Oceania', 'currency': 'XPF',
        'hidden_gems': [
            {'name': 'Bora Bora Lagoon', 'description': 'Overwater bungalows', 'crowd_level': 'high'},
            {'name': 'Moorea Snorkeling', 'description': 'Stingray encounters', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Tahitian Dance Show', 'type': 'experience', 'price': 90, 'verified': True},
        ]
    },
    
    # ADDITIONAL (remaining to reach 40+)
    'Philippines': {
        'country_code': 'PH', 'region': 'Asia', 'currency': 'PHP',
        'hidden_gems': [
            {'name': 'El Nido Lagoons', 'description': 'Island hopping paradise', 'crowd_level': 'high'},
            {'name': 'Banaue Rice Terraces', 'description': '2,000-year-old terraces', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Manila Food Tour', 'type': 'guide', 'price': 35, 'verified': True},
        ]
    },
    
    'China': {
        'country_code': 'CN', 'region': 'Asia', 'currency': 'CNY',
        'spiritual_sites': [
            {'name': 'Forbidden City', 'type': 'spiritual', 'significance': 'Imperial palace', 'best_time': 'Sep-Oct'},
            {'name': 'Shaolin Temple', 'type': 'spiritual', 'significance': 'Kung Fu origin', 'best_time': 'Apr-Oct'},
        ],
        'hidden_gems': [
            {'name': 'Zhangjiajie Avatar Mountains', 'description': 'Floating peaks', 'crowd_level': 'high'},
            {'name': 'Lijiang Old Town', 'description': 'Naxi minority culture', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Beijing Dumpling Making', 'type': 'workshop', 'price': 40, 'verified': True},
        ]
    },
    
    'Bhutan': {
        'country_code': 'BT', 'region': 'Asia', 'currency': 'BTN',
        'spiritual_sites': [
            {'name': 'Tigers Nest Monastery', 'type': 'spiritual', 'significance': 'Cliffside Buddhist temple', 'best_time': 'Mar-May'},
        ],
        'hidden_gems': [
            {'name': 'Phobjikha Valley', 'description': 'Black-necked crane habitat', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Thimphu Archery Experience', 'type': 'activity', 'price': 60, 'verified': True},
        ]
    },
    
    'Laos': {
        'country_code': 'LA', 'region': 'Asia', 'currency': 'LAK',
        'spiritual_sites': [
            {'name': 'Luang Prabang Temples', 'type': 'spiritual', 'significance': 'UNESCO Buddhist town', 'best_time': 'Nov-Feb'},
        ],
        'hidden_gems': [
            {'name': 'Kuang Si Waterfalls', 'description': 'Turquoise pools', 'crowd_level': 'medium'},
            {'name': '4000 Islands', 'description': 'Mekong river life', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Laotian Cooking Class', 'type': 'workshop', 'price': 35, 'verified': True},
        ]
    },
    
    'Myanmar': {
        'country_code': 'MM', 'region': 'Asia', 'currency': 'MMK',
        'spiritual_sites': [
            {'name': 'Shwedagon Pagoda', 'type': 'spiritual', 'significance': 'Golden Buddhist stupa', 'best_time': 'Nov-Feb'},
            {'name': 'Bagan Temples', 'type': 'spiritual', 'significance': '2,000+ ancient pagodas', 'best_time': 'Nov-Feb'},
        ],
        'hidden_gems': [
            {'name': 'Inle Lake', 'description': 'Leg-rowing fishermen', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Yangon Tea House Tour', 'type': 'guide', 'price': 20, 'verified': True},
        ]
    },
    
    'Indonesia': {
        'country_code': 'ID', 'region': 'Asia', 'currency': 'IDR',
        'spiritual_sites': [
            {'name': 'Borobudur Temple', 'type': 'spiritual', 'significance': 'Buddhist monument', 'best_time': 'Apr-Oct'},
        ],
        'hidden_gems': [
            {'name': 'Komodo National Park', 'description': 'Dragon island', 'crowd_level': 'medium'},
            {'name': 'Raja Ampat', 'description': 'Best diving in world', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Jakarta Batik Workshop', 'type': 'workshop', 'price': 40, 'verified': True},
        ]
    },
    
    'Ethiopia': {
        'country_code': 'ET', 'region': 'Africa', 'currency': 'ETB',
        'spiritual_sites': [
            {'name': 'Lalibela Rock Churches', 'type': 'spiritual', 'significance': 'Underground churches', 'best_time': 'Oct-Mar'},
        ],
        'hidden_gems': [
            {'name': 'Simien Mountains', 'description': 'Gelada baboon trekking', 'crowd_level': 'low'},
            {'name': 'Danakil Depression', 'description': 'Sulfur lakes, hottest place', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Ethiopian Coffee Ceremony', 'type': 'experience', 'price': 20, 'verified': True},
        ]
    },
    
    'Tanzania': {
        'country_code': 'TZ', 'region': 'Africa', 'currency': 'TZS',
        'hidden_gems': [
            {'name': 'Serengeti Migration', 'description': 'Wildebeest crossing', 'crowd_level': 'high'},
            {'name': 'Zanzibar Spice Farm', 'description': 'Island spice tour', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Kilimanjaro Trek Guide', 'type': 'guide', 'price': 2000, 'verified': True},
        ]
    },
    
    'Oman': {
        'country_code': 'OM', 'region': 'Middle East', 'currency': 'OMR',
        'hidden_gems': [
            {'name': 'Wahiba Sands', 'description': 'Desert dunes camping', 'crowd_level': 'low'},
            {'name': 'Jebel Shams', 'description': 'Grand Canyon of Arabia', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Muscat Souk Guide', 'type': 'guide', 'price': 50, 'verified': True},
        ]
    },
    
    'Saudi Arabia': {
        'country_code': 'SA', 'region': 'Middle East', 'currency': 'SAR',
        'spiritual_sites': [
            {'name': 'Masjid al-Haram', 'type': 'spiritual', 'significance': 'Holiest mosque', 'best_time': 'Year-round'},
        ],
        'hidden_gems': [
            {'name': 'AlUla Hegra', 'description': 'Nabataean tombs', 'crowd_level': 'low'},
            {'name': 'Edge of the World', 'description': 'Dramatic cliff views', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Riyadh Cultural Tour', 'type': 'guide', 'price': 90, 'verified': True},
        ]
    },
    
    # ADDITIONAL ASIA
    'Singapore': {
        'country_code': 'SG', 'region': 'Asia', 'currency': 'SGD',
        'hidden_gems': [
            {'name': 'Pulau Ubin Island', 'description': '1960s village preserved', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Hawker Centre Food Tour', 'type': 'guide', 'price': 55, 'verified': True},
        ]
    },
    
    'Taiwan': {
        'country_code': 'TW', 'region': 'Asia', 'currency': 'TWD',
        'hidden_gems': [
            {'name': 'Taroko Gorge', 'description': 'Marble canyon', 'crowd_level': 'medium'},
            {'name': 'Jiufen Old Street', 'description': 'Spirited Away inspiration', 'crowd_level': 'high'},
        ],
        'local_businesses': [
            {'name': 'Taipei Night Market Tour', 'type': 'guide', 'price': 40, 'verified': True},
        ]
    },
    
    'Mongolia': {
        'country_code': 'MN', 'region': 'Asia', 'currency': 'MNT',
        'hidden_gems': [
            {'name': 'Gobi Desert', 'description': 'Nomadic ger camps', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Nomad Family Homestay', 'type': 'experience', 'price': 70, 'verified': True},
        ]
    },
    
    # ADDITIONAL EUROPE
    'Switzerland': {
        'country_code': 'CH', 'region': 'Europe', 'currency': 'CHF',
        'hidden_gems': [
            {'name': 'Lauterbrunnen Valley', 'description': '72 waterfalls', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Swiss Chocolate Workshop', 'type': 'workshop', 'price': 110, 'verified': True},
        ]
    },
    
    'Austria': {
        'country_code': 'AT', 'region': 'Europe', 'currency': 'EUR',
        'hidden_gems': [
            {'name': 'Hallstatt Village', 'description': 'Alpine lakeside', 'crowd_level': 'high'},
        ],
        'local_businesses': [
            {'name': 'Vienna Classical Concert', 'type': 'experience', 'price': 65, 'verified': True},
        ]
    },
    
    'Czech Republic': {
        'country_code': 'CZ', 'region': 'Europe', 'currency': 'CZK',
        'hidden_gems': [
            {'name': 'Cesky Krumlov', 'description': 'Medieval fairytale town', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Prague Beer Tour', 'type': 'guide', 'price': 55, 'verified': True},
        ]
    },
    
    # ADDITIONAL AMERICAS
    'Chile': {
        'country_code': 'CL', 'region': 'South America', 'currency': 'CLP',
        'hidden_gems': [
            {'name': 'Torres del Paine', 'description': 'Patagonia trekking', 'crowd_level': 'medium'},
            {'name': 'Atacama Desert', 'description': 'Driest desert, star gazing', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Santiago Wine Valley Tour', 'type': 'experience', 'price': 85, 'verified': True},
        ]
    },
    
    'Colombia': {
        'country_code': 'CO', 'region': 'South America', 'currency': 'COP',
        'hidden_gems': [
            {'name': 'Cocora Valley', 'description': 'Wax palm trees', 'crowd_level': 'medium'},
            {'name': 'Cartagena Old Town', 'description': 'Colonial walled city', 'crowd_level': 'high'},
        ],
        'local_businesses': [
            {'name': 'Medellin Coffee Farm Tour', 'type': 'experience', 'price': 50, 'verified': True},
        ]
    },
    
    'Ecuador': {
        'country_code': 'EC', 'region': 'South America', 'currency': 'USD',
        'hidden_gems': [
            {'name': 'Galapagos Islands', 'description': 'Darwin evolution site', 'crowd_level': 'medium'},
            {'name': 'Quilotoa Crater Lake', 'description': 'Emerald volcanic lake', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Quito Market Tour', 'type': 'guide', 'price': 40, 'verified': True},
        ]
    },
    
    'Cuba': {
        'country_code': 'CU', 'region': 'Caribbean', 'currency': 'CUP',
        'hidden_gems': [
            {'name': 'Vinales Valley', 'description': 'Tobacco farms, mogotes', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Havana Classic Car Tour', 'type': 'experience', 'price': 60, 'verified': True},
            {'name': 'Salsa Dance Lesson', 'type': 'workshop', 'price': 35, 'verified': True},
        ]
    },
    
    # ADDITIONAL MIDDLE EAST & AFRICA
    'Tunisia': {
        'country_code': 'TN', 'region': 'Africa', 'currency': 'TND',
        'hidden_gems': [
            {'name': 'Sahara Matmata', 'description': 'Star Wars filming location', 'crowd_level': 'low'},
            {'name': 'Carthage Ruins', 'description': 'Ancient civilization', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Tunis Medina Tour', 'type': 'guide', 'price': 30, 'verified': True},
        ]
    },
    
    'Lebanon': {
        'country_code': 'LB', 'region': 'Middle East', 'currency': 'LBP',
        'spiritual_sites': [
            {'name': 'Baalbek Temples', 'type': 'spiritual', 'significance': 'Roman ruins', 'best_time': 'Apr-Jun'},
        ],
        'hidden_gems': [
            {'name': 'Jeita Grotto', 'description': 'Underground river caves', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Beirut Food Tour', 'type': 'guide', 'price': 60, 'verified': True},
        ]
    },
    
    'Iran': {
        'country_code': 'IR', 'region': 'Middle East', 'currency': 'IRR',
        'spiritual_sites': [
            {'name': 'Nasir al-Mulk Mosque', 'type': 'spiritual', 'significance': 'Pink Mosque', 'best_time': 'Mar-May'},
            {'name': 'Persepolis', 'type': 'spiritual', 'significance': 'Persian Empire capital', 'best_time': 'Mar-May'},
        ],
        'hidden_gems': [
            {'name': 'Isfahan Bridges', 'description': 'Safavid architecture', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Tehran Bazaar Guide', 'type': 'guide', 'price': 35, 'verified': True},
        ]
    },
    
    # ADDITIONAL EUROPE
    'Poland': {
        'country_code': 'PL', 'region': 'Europe', 'currency': 'PLN',
        'spiritual_sites': [
            {'name': 'Wieliczka Salt Mine', 'type': 'spiritual', 'significance': 'Underground chapel', 'best_time': 'Year-round'},
        ],
        'hidden_gems': [
            {'name': 'Bialowieza Forest', 'description': 'Last primeval forest', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Krakow Pierogi Class', 'type': 'workshop', 'price': 45, 'verified': True},
        ]
    },
    
    'Hungary': {
        'country_code': 'HU', 'region': 'Europe', 'currency': 'HUF',
        'hidden_gems': [
            {'name': 'Lake Balaton', 'description': 'Central European Riviera', 'crowd_level': 'medium'},
        ],
        'local_businesses': [
            {'name': 'Budapest Thermal Bath Tour', 'type': 'experience', 'price': 55, 'verified': True},
        ]
    },
    
    'Romania': {
        'country_code': 'RO', 'region': 'Europe', 'currency': 'RON',
        'hidden_gems': [
            {'name': 'Transfagarasan Highway', 'description': 'Spectacular mountain road', 'crowd_level': 'medium'},
            {'name': 'Painted Monasteries', 'description': 'UNESCO frescoes', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Transylvania Castle Tour', 'type': 'guide', 'price': 70, 'verified': True},
        ]
    },
    
    'Ireland': {
        'country_code': 'IE', 'region': 'Europe', 'currency': 'EUR',
        'hidden_gems': [
            {'name': 'Cliffs of Moher', 'description': 'Dramatic coastal cliffs', 'crowd_level': 'high'},
            {'name': 'Skellig Michael', 'description': 'Star Wars monastery island', 'crowd_level': 'low'},
        ],
        'local_businesses': [
            {'name': 'Dublin Pub Crawl', 'type': 'guide', 'price': 50, 'verified': True},
        ]
    },
    
    # ADDITIONAL OCEANIA
    'Papua New Guinea': {
        'country_code': 'PG', 'region': 'Oceania', 'currency': 'PGK',
        'hidden_gems': [
            {'name': 'Kokoda Track', 'description': 'WWII jungle trail', 'crowd_level': 'very_low'},
        ],
        'local_businesses': [
            {'name': 'Highland Tribe Visit', 'type': 'experience', 'price': 120, 'verified': True},
        ]
    },
}

# Calculate totals
def get_destination_stats():
    """Calculate comprehensive statistics"""
    total_destinations = len(DESTINATIONS_EXPANDED)
    total_spiritual_sites = sum(len(d.get('spiritual_sites', [])) for d in DESTINATIONS_EXPANDED.values())
    total_hidden_gems = sum(len(d.get('hidden_gems', [])) for d in DESTINATIONS_EXPANDED.values())
    total_local_businesses = sum(len(d.get('local_businesses', [])) for d in DESTINATIONS_EXPANDED.values())
    
    regions = {}
    for dest, data in DESTINATIONS_EXPANDED.items():
        region = data['region']
        regions[region] = regions.get(region, 0) + 1
    
    return {
        'total_destinations': total_destinations,
        'total_spiritual_sites': total_spiritual_sites,
        'total_hidden_gems': total_hidden_gems,
        'total_local_businesses': total_local_businesses,
        'total_experiences': total_spiritual_sites + total_hidden_gems + total_local_businesses,
        'regions': regions
    }

if __name__ == "__main__":
    stats = get_destination_stats()
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║          MAKU DESTINATION CONTENT DATABASE                   ║
╚══════════════════════════════════════════════════════════════╝

📍 Total Destinations: {stats['total_destinations']}

🕉️  Spiritual Sites: {stats['total_spiritual_sites']}
💎 Hidden Gems: {stats['total_hidden_gems']}
🏪 Local Businesses: {stats['total_local_businesses']}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Total Curated Experiences: {stats['total_experiences']}

🌍 Regional Distribution:
""")
    for region, count in sorted(stats['regions'].items(), key=lambda x: -x[1]):
        print(f"   • {region}: {count} destinations")
    
    print("\n✅ Comprehensive destination database ready for production")
