/**
 * Curated Dream Library - Expert Travel Packages
 * Curated by world's most traveled experts (Drew Binsky, Harry Mitsidis)
 * Covers: Young Adults, Millennials, Gen Z, Families, Seniors
 * Includes: Hidden gems, cafes, restaurants, bars, activities
 */

export interface DreamPackage {
  id: string;
  title: string;
  tagline: string;
  destination: string;
  country: string;
  imageUrl: string;
  duration: string;
  ageGroup: string[];
  travelStyle: string[];
  budget: {
    base: number;
    premium: number;
    luxury: number;
  };
  itinerary: {
    day: number;
    title: string;
    activities: string[];
  }[];
  hiddenGems: {
    name: string;
    type: 'cafe' | 'restaurant' | 'bar' | 'spot';
    description: string;
    mustTry?: string;
  }[];
  included: string[];
  upgrades: {
    name: string;
    price: number;
    description: string;
  }[];
  providers: string[];
  seasonality: string;
  category: string;
}

export const dreamLibrary: DreamPackage[] = [
  {
    id: 'dream-1',
    title: 'Maldives Overwater Paradise',
    tagline: 'Romantic escape in crystal waters',
    destination: 'Maldives',
    country: 'Indian Ocean',
    imageUrl: 'https://images.unsplash.com/photo-1637576308588-6647bf80944d?w=800&h=600&fit=crop&q=85',
    duration: '7 nights',
    ageGroup: ['couples', 'young-adults', 'seniors'],
    travelStyle: ['romantic', 'luxury', 'relaxation'],
    budget: {
      base: 3500,
      premium: 6500,
      luxury: 12000
    },
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Sunset Welcome',
        activities: ['Private speedboat transfer', 'Villa check-in', 'Champagne sunset', 'Welcome dinner at Ithaa Undersea Restaurant']
      },
      {
        day: 2,
        title: 'Ocean Adventures',
        activities: ['Morning snorkeling with manta rays', 'Couples spa treatment', 'Private sandbank picnic', 'Stargazing dinner']
      },
      {
        day: 3,
        title: 'Underwater Exploration',
        activities: ['Scuba diving at Banana Reef', 'Dolphin watching cruise', 'Sunset fishing', 'Beach BBQ dinner']
      }
    ],
    hiddenGems: [
      { name: 'The Muraka', type: 'spot', description: 'World\'s first underwater hotel residence', mustTry: 'Sleep with sharks (literally!)' },
      { name: 'Ithaa Undersea Restaurant', type: 'restaurant', description: 'Dine 16ft below sea level', mustTry: 'Maldivian lobster tasting menu' },
      { name: 'Subsix', type: 'bar', description: 'World\'s first underwater nightclub', mustTry: 'Champagne at sunset underwater' },
      { name: 'Secret Sandbank', type: 'spot', description: 'Private island appears only at low tide', mustTry: 'Private sandbank dinner for two' }
    ],
    included: ['Overwater villa', 'Seaplane transfers', 'All meals', 'Water sports', 'Spa credit'],
    upgrades: [
      { name: 'Private Butler Service', price: 500, description: '24/7 personal butler for entire stay' },
      { name: 'Underwater Bedroom', price: 2000, description: 'One night in The Muraka underwater suite' },
      { name: 'Helicopter Photo Tour', price: 800, description: 'Aerial photography of atolls' }
    ],
    providers: ['Expedia Sandbox', 'Amadeus Test'],
    seasonality: 'Nov-Apr (Best weather)',
    category: 'romantic-luxury'
  },
  {
    id: 'dream-2',
    title: 'Japan Cultural Odyssey',
    tagline: 'Ancient temples meet modern Tokyo',
    destination: 'Tokyo, Kyoto, Mt. Fuji',
    country: 'Japan',
    imageUrl: 'https://images.unsplash.com/photo-1713374565634-e093f0b5d787?w=800&h=600&fit=crop&q=85',
    duration: '10 nights',
    ageGroup: ['families', 'young-adults', 'seniors', 'culture-enthusiasts'],
    travelStyle: ['cultural', 'family', 'adventure'],
    budget: {
      base: 4200,
      premium: 7500,
      luxury: 15000
    },
    itinerary: [
      {
        day: 1,
        title: 'Tokyo Arrival',
        activities: ['Shinjuku exploration', 'Robot Restaurant show', 'Izakaya dinner', 'Shibuya crossing at night']
      },
      {
        day: 2,
        title: 'Tokyo Modern & Traditional',
        activities: ['Tsukiji Fish Market breakfast', 'Senso-ji Temple', 'TeamLab Borderless', 'Harajuku street fashion']
      },
      {
        day: 3,
        title: 'Mt. Fuji Day Trip',
        activities: ['Bullet train to Hakone', 'Lake Ashi cruise', 'Mt. Fuji 5th Station', 'Onsen hot springs']
      },
      {
        day: 4,
        title: 'Kyoto Heritage',
        activities: ['Fushimi Inari shrine', 'Arashiyama Bamboo Grove', 'Geisha district walk', 'Traditional kaiseki dinner']
      }
    ],
    hiddenGems: [
      { name: 'Nakamise Dango Shop', type: 'cafe', description: 'Hidden alley serving best dango since 1868', mustTry: 'Matcha mochi dango' },
      { name: 'Omoide Yokocho', type: 'bar', description: 'Tiny alley bars from 1940s, locals only vibe', mustTry: 'Yakitori & sake standing bar' },
      { name: 'Ichiran Ramen Secret Booth', type: 'restaurant', description: 'Solo ramen booths for ultimate focus', mustTry: 'Tonkotsu ramen with extra garlic' },
      { name: 'Philosopher\'s Path, Kyoto', type: 'spot', description: 'Cherry blossom tunnel walk, tourist-free at dawn', mustTry: 'Sunrise walk before 6am' }
    ],
    included: ['JR Pass', 'Hotels', 'Guided tours', 'Cultural experiences', 'Some meals'],
    upgrades: [
      { name: 'Ryokan Experience', price: 400, description: '2 nights in traditional Japanese inn with kaiseki meals' },
      { name: 'Sumo Wrestling VIP', price: 300, description: 'VIP tickets to sumo tournament with chanko-nabe lunch' },
      { name: 'Private Tea Ceremony', price: 200, description: 'Private tea ceremony with geisha in Kyoto' }
    ],
    providers: ['Viator Test', 'GetYourGuide Sandbox', 'Expedia'],
    seasonality: 'Mar-May (Cherry Blossoms) or Oct-Nov (Fall)',
    category: 'cultural-family'
  },
  {
    id: 'dream-3',
    title: 'Santorini Sunset Romance',
    tagline: 'Greek island paradise for lovers',
    destination: 'Santorini',
    country: 'Greece',
    imageUrl: 'https://images.unsplash.com/photo-1669203408570-4140ee21f211?w=800&h=600&fit=crop&q=85',
    duration: '6 nights',
    ageGroup: ['couples', 'honeymoon', 'young-adults'],
    travelStyle: ['romantic', 'luxury', 'relaxation'],
    budget: {
      base: 2800,
      premium: 5500,
      luxury: 10000
    },
    itinerary: [
      {
        day: 1,
        title: 'Oia Arrival',
        activities: ['Cave suite check-in', 'Infinity pool sunset', 'Welcome wine tasting', 'Candlelit dinner in Oia']
      },
      {
        day: 2,
        title: 'Volcano & Hot Springs',
        activities: ['Catamaran cruise', 'Volcanic island swim', 'Hot springs soak', 'Sunset sailing']
      },
      {
        day: 3,
        title: 'Wine Country',
        activities: ['Santo Wines vineyard', 'Wine tasting tour', 'Pyrgos village walk', 'Cliffside dinner']
      }
    ],
    hiddenGems: [
      { name: 'Ammoudi Fish Taverna', type: 'restaurant', description: 'Hidden harbor taverna, fresh catch daily', mustTry: 'Lobster pasta at sunset' },
      { name: 'Hassapiko Bar', type: 'bar', description: 'Secret locals-only bar in Fira', mustTry: 'Assyrtiko wine from local vineyards' },
      { name: 'Amoudi Bay Steps', type: 'spot', description: '300 steps down to secret swimming cove', mustTry: 'Cliff jumping at dawn' },
      { name: 'PitoGyros', type: 'cafe', description: 'Best gyros on island, locals queue daily', mustTry: 'Traditional pork gyros €4' }
    ],
    included: ['Cave suite hotel', 'Daily breakfast', 'Sunset cruise', 'Wine tasting', 'Airport transfers'],
    upgrades: [
      { name: 'Private Catamaran', price: 1200, description: 'Full-day private yacht with chef' },
      { name: 'Helicopter Tour', price: 800, description: 'Aerial tour of Santorini & neighboring islands' },
      { name: 'Couples Spa', price: 350, description: 'Volcanic stone massage for two' }
    ],
    providers: ['Amadeus Test', 'RateHawk Dev'],
    seasonality: 'Apr-Oct (Peak: May-Sep)',
    category: 'romantic-luxury'
  },
  {
    id: 'dream-4',
    title: 'Bali Spiritual Awakening',
    tagline: 'Find yourself in paradise',
    destination: 'Ubud, Seminyak, Uluwatu',
    country: 'Bali, Indonesia',
    imageUrl: 'https://images.unsplash.com/photo-1656247203824-3d6f99461ba4?w=800&h=600&fit=crop&q=85',
    duration: '12 nights',
    ageGroup: ['young-adults', 'digital-nomads', 'wellness-seekers'],
    travelStyle: ['wellness', 'cultural', 'adventure'],
    budget: {
      base: 1800,
      premium: 3500,
      luxury: 7000
    },
    itinerary: [
      {
        day: 1,
        title: 'Ubud Immersion',
        activities: ['Tegallalang rice terraces sunrise', 'Monkey Forest sanctuary', 'Traditional Balinese massage', 'Organic farm-to-table dinner']
      },
      {
        day: 2,
        title: 'Spiritual Journey',
        activities: ['Sunrise yoga at Campuhan Ridge', 'Tirta Empul water purification', 'Balinese cooking class', 'Traditional dance performance']
      },
      {
        day: 3,
        title: 'Beach & Surf',
        activities: ['Move to Seminyak', 'Surf lesson at Echo Beach', 'Beach club hopping', 'Sunset at Tanah Lot temple']
      }
    ],
    hiddenGems: [
      { name: 'Sari Organik', type: 'cafe', description: 'Cafe in middle of rice paddies, organic farm', mustTry: 'Dragon fruit smoothie bowl overlooking fields' },
      { name: 'Warung Biah Biah', type: 'restaurant', description: 'Local secret, authentic nasi campur $2', mustTry: 'Babi guling (suckling pig) - ask locals where' },
      { name: 'Old Man\'s', type: 'bar', description: 'Surf bar in Canggu, sunset sessions', mustTry: 'Bintang beer during sunset surf' },
      { name: 'Tukad Cepung Waterfall', type: 'spot', description: 'Cave waterfall with light beams, Instagram secret', mustTry: 'Visit 8-10am for light rays' }
    ],
    included: ['Boutique villa', 'Daily yoga', 'Cooking class', 'Temple tours', 'Spa sessions'],
    upgrades: [
      { name: 'Silent Retreat Week', price: 600, description: '7-day meditation retreat at ashram' },
      { name: 'Private Villa with Pool', price: 400, description: 'Upgrade to private pool villa in rice fields' },
      { name: 'Surf Camp Pro', price: 500, description: '5-day surf intensive with pro coaching' }
    ],
    providers: ['Nuitée Test', 'Viator Test'],
    seasonality: 'Apr-Oct (Dry Season)',
    category: 'wellness-cultural'
  },
  {
    id: 'dream-5',
    title: 'African Safari Adventure',
    tagline: 'Big Five & endless sunsets',
    destination: 'Serengeti, Ngorongoro, Zanzibar',
    country: 'Tanzania',
    imageUrl: 'https://images.unsplash.com/photo-1655981650217-c091cd205970?w=800&h=600&fit=crop&q=85',
    duration: '9 nights',
    ageGroup: ['families', 'adventurers', 'seniors', 'photographers'],
    travelStyle: ['adventure', 'wildlife', 'luxury'],
    budget: {
      base: 5500,
      premium: 9500,
      luxury: 18000
    },
    itinerary: [
      {
        day: 1,
        title: 'Serengeti Safari Begins',
        activities: ['Flight to Serengeti', 'Afternoon game drive', 'Sundowner drinks in bush', 'Luxury tented camp']
      },
      {
        day: 2,
        title: 'Great Migration',
        activities: ['Dawn safari for big cats', 'Hot air balloon over Serengeti', 'Bush breakfast', 'Evening game drive']
      },
      {
        day: 3,
        title: 'Ngorongoro Crater',
        activities: ['Crater floor safari', 'Flamingo lake', 'Maasai village visit', 'Crater rim lodge']
      },
      {
        day: 4,
        title: 'Zanzibar Beach Bliss',
        activities: ['Fly to Zanzibar', 'Stone Town spice tour', 'Beach resort', 'Seafood sunset dinner']
      }
    ],
    hiddenGems: [
      { name: 'Emerson Spice Tea House', type: 'cafe', description: 'Rooftop cafe in Stone Town, sunset views', mustTry: 'Zanzibar coffee with cardamom' },
      { name: 'The Rock Restaurant', type: 'restaurant', description: 'Restaurant on rock in ocean, accessible at low tide', mustTry: 'Grilled octopus, reserve weeks ahead' },
      { name: '6 Degrees South', type: 'bar', description: 'Beach bar on Nungwi, locals & expats', mustTry: 'Dawa cocktail (vodka, lime, honey)' },
      { name: 'Mnemba Atoll', type: 'spot', description: 'Secret snorkel spot, sea turtles guaranteed', mustTry: 'Sunrise snorkel with dolphins' }
    ],
    included: ['Luxury tented camps', 'All game drives', 'Hot air balloon', 'Park fees', 'Most meals'],
    upgrades: [
      { name: 'Gorilla Trekking Add-on', price: 1500, description: '3 days in Rwanda with gorilla permits' },
      { name: 'Private Safari Vehicle', price: 800, description: 'Private 4x4 with expert guide' },
      { name: 'Masai Mara Extension', price: 2000, description: '4 extra days in Kenya Masai Mara' }
    ],
    providers: ['Sabre Test', 'Viator Development'],
    seasonality: 'Jun-Oct (Great Migration)',
    category: 'adventure-wildlife'
  },
  {
    id: 'dream-6',
    title: 'Paris City of Love',
    tagline: 'Romance, art, and croissants',
    destination: 'Paris',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1609971757431-439cf7b4141b?w=800&h=600&fit=crop&q=85',
    duration: '5 nights',
    ageGroup: ['couples', 'young-adults', 'seniors', 'art-lovers'],
    travelStyle: ['romantic', 'cultural', 'luxury'],
    budget: {
      base: 2200,
      premium: 4500,
      luxury: 9000
    },
    itinerary: [
      {
        day: 1,
        title: 'Arrival & Eiffel Sunset',
        activities: ['Boutique hotel check-in', 'Seine river cruise', 'Eiffel Tower at sunset', 'Bistro dinner in Le Marais']
      },
      {
        day: 2,
        title: 'Art & Museums',
        activities: ['Louvre skip-the-line', 'Musée d\'Orsay', 'Latin Quarter walk', 'Michelin star dinner']
      },
      {
        day: 3,
        title: 'Versailles Day Trip',
        activities: ['Palace of Versailles', 'Gardens picnic', 'Marie Antoinette hamlet', 'Opera show evening']
      }
    ],
    hiddenGems: [
      { name: 'Café de Flore', type: 'cafe', description: 'Historic cafe, Hemingway\'s favorite spot', mustTry: 'Hot chocolate & croissant at window seat' },
      { name: 'Le Comptoir du Relais', type: 'restaurant', description: 'Hidden bistro, no reservations, queue worth it', mustTry: 'Duck confit, arrive 6:30pm' },
      { name: 'Le Baron Rouge', type: 'bar', description: 'Wine barrel bar, locals bring cheese plates', mustTry: 'Burgundy wine, buy oysters from street vendor' },
      { name: 'Shakespeare & Company', type: 'spot', description: 'Secret upstairs reading nook in bookstore', mustTry: 'Read by window overlooking Notre-Dame' }
    ],
    included: ['4-star hotel', 'Museum passes', 'Seine cruise', 'Some meals', 'Metro card'],
    upgrades: [
      { name: 'Eiffel Tower Dinner', price: 350, description: 'Dinner at Jules Verne Michelin restaurant in tower' },
      { name: 'Champagne Region Day Trip', price: 400, description: 'Moet & Chandon tour with tastings' },
      { name: 'Private Louvre Tour', price: 300, description: 'After-hours private Louvre with art historian' }
    ],
    providers: ['Expedia Sandbox', 'Amadeus Test'],
    seasonality: 'Apr-Jun or Sep-Oct (Best weather)',
    category: 'romantic-cultural'
  },
  {
    id: 'dream-11',
    title: 'Peru Machu Picchu Trek',
    tagline: 'Inca Trail to lost city',
    destination: 'Cusco, Machu Picchu, Amazon',
    country: 'Peru',
    imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop&q=85',
    duration: '10 nights',
    ageGroup: ['young-adults', 'adventurers', 'hikers'],
    travelStyle: ['adventure', 'cultural', 'hiking'],
    budget: {
      base: 2800,
      premium: 4500,
      luxury: 8000
    },
    itinerary: [
      {
        day: 1,
        title: 'Cusco Acclimatization',
        activities: ['Arrive Cusco', 'Plaza de Armas', 'Altitude adjustment', 'Pisco sour tasting']
      }
    ],
    hiddenGems: [
      { name: 'Café Morena', type: 'cafe', description: 'Cusco café rooftop terrace', mustTry: 'Quinoa pancakes & coca tea' }
    ],
    included: ['Hotels', 'Inca Trail permits', 'Camping gear', 'Most meals'],
    upgrades: [
      { name: 'Amazon Extension', price: 800, description: '3 days jungle lodge' }
    ],
    providers: ['Viator Test', 'Amadeus Dev'],
    seasonality: 'May-Sep',
    category: 'adventure-cultural'
  }
];
