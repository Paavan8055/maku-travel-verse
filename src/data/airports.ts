export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  region?: string;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  tier?: 'international_hub' | 'regional_hub' | 'domestic' | 'regional';
  searchAliases?: string[];
}

// Comprehensive global airport database with 1000+ major airports
// Organized by region for better performance and maintenance
export const AIRPORTS: Airport[] = [
  // =============== ASIA-PACIFIC ===============

  // Australia & New Zealand
  { iata: "SYD", name: "Kingsford Smith Airport", city: "Sydney", country: "Australia", region: "Oceania", tier: "international_hub", coordinates: { lat: -33.9399, lng: 151.1753 }, timezone: "Australia/Sydney" },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", region: "Oceania", tier: "international_hub", coordinates: { lat: -37.6690, lng: 144.8410 }, timezone: "Australia/Melbourne" },
  { iata: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia", region: "Oceania", tier: "international_hub", coordinates: { lat: -27.3942, lng: 153.1218 }, timezone: "Australia/Brisbane" },
  { iata: "PER", name: "Perth Airport", city: "Perth", country: "Australia", region: "Oceania", tier: "international_hub", coordinates: { lat: -31.9403, lng: 115.9670 }, timezone: "Australia/Perth" },
  { iata: "ADL", name: "Adelaide Airport", city: "Adelaide", country: "Australia", region: "Oceania", tier: "regional_hub", coordinates: { lat: -34.9470, lng: 138.5319 }, timezone: "Australia/Adelaide" },
  { iata: "CBR", name: "Canberra Airport", city: "Canberra", country: "Australia", region: "Oceania", tier: "domestic", coordinates: { lat: -35.3069, lng: 149.1957 }, timezone: "Australia/Sydney" },
  { iata: "DRW", name: "Darwin Airport", city: "Darwin", country: "Australia", region: "Oceania", tier: "regional", coordinates: { lat: -12.4147, lng: 130.8770 }, timezone: "Australia/Darwin" },
  { iata: "HBA", name: "Hobart Airport", city: "Hobart", country: "Australia", region: "Oceania", tier: "domestic", coordinates: { lat: -42.8364, lng: 147.5103 }, timezone: "Australia/Hobart" },
  { iata: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", region: "Oceania", tier: "international_hub", coordinates: { lat: -37.0082, lng: 174.7850 }, timezone: "Pacific/Auckland" },
  { iata: "CHC", name: "Christchurch Airport", city: "Christchurch", country: "New Zealand", region: "Oceania", tier: "regional_hub", coordinates: { lat: -43.4893, lng: 172.5320 }, timezone: "Pacific/Auckland" },
  { iata: "WLG", name: "Wellington Airport", city: "Wellington", country: "New Zealand", region: "Oceania", tier: "domestic", coordinates: { lat: -41.3276, lng: 174.8050 }, timezone: "Pacific/Auckland" },
  { iata: "ZQN", name: "Queenstown Airport", city: "Queenstown", country: "New Zealand", region: "Oceania", tier: "regional", coordinates: { lat: -45.0211, lng: 168.7390 }, timezone: "Pacific/Auckland" },

  // Japan
  { iata: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan", region: "Asia", tier: "international_hub", coordinates: { lat: 35.7720, lng: 140.3929 }, timezone: "Asia/Tokyo" },
  { iata: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan", region: "Asia", tier: "international_hub", coordinates: { lat: 35.5494, lng: 139.7798 }, timezone: "Asia/Tokyo" },
  { iata: "KIX", name: "Kansai International Airport", city: "Osaka", country: "Japan", region: "Asia", tier: "international_hub", coordinates: { lat: 34.4273, lng: 135.2441 }, timezone: "Asia/Tokyo" },
  { iata: "ITM", name: "Osaka International Airport", city: "Osaka", country: "Japan", region: "Asia", tier: "domestic", coordinates: { lat: 34.7855, lng: 135.4380 }, timezone: "Asia/Tokyo" },
  { iata: "CTS", name: "New Chitose Airport", city: "Sapporo", country: "Japan", region: "Asia", tier: "regional_hub", coordinates: { lat: 42.7752, lng: 141.6920 }, timezone: "Asia/Tokyo" },
  { iata: "FUK", name: "Fukuoka Airport", city: "Fukuoka", country: "Japan", region: "Asia", tier: "regional_hub", coordinates: { lat: 33.5859, lng: 130.4510 }, timezone: "Asia/Tokyo" },
  { iata: "NGO", name: "Chubu Centrair International Airport", city: "Nagoya", country: "Japan", region: "Asia", tier: "international_hub", coordinates: { lat: 34.8583, lng: 136.8050 }, timezone: "Asia/Tokyo" },
  { iata: "OKA", name: "Naha Airport", city: "Naha", country: "Japan", region: "Asia", tier: "regional", coordinates: { lat: 26.1958, lng: 127.6461 }, timezone: "Asia/Tokyo" },

  // South Korea
  { iata: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea", region: "Asia", tier: "international_hub", coordinates: { lat: 37.4602, lng: 126.4407 }, timezone: "Asia/Seoul" },
  { iata: "GMP", name: "Gimpo International Airport", city: "Seoul", country: "South Korea", region: "Asia", tier: "domestic", coordinates: { lat: 37.5583, lng: 126.7906 }, timezone: "Asia/Seoul" },
  { iata: "PUS", name: "Gimhae International Airport", city: "Busan", country: "South Korea", region: "Asia", tier: "regional_hub", coordinates: { lat: 35.1795, lng: 128.9382 }, timezone: "Asia/Seoul" },
  { iata: "CJU", name: "Jeju International Airport", city: "Jeju", country: "South Korea", region: "Asia", tier: "regional", coordinates: { lat: 33.5113, lng: 126.4930 }, timezone: "Asia/Seoul" },

  // China
  { iata: "PEK", name: "Beijing Capital International Airport", city: "Beijing", country: "China", region: "Asia", tier: "international_hub", coordinates: { lat: 40.0801, lng: 116.5846 }, timezone: "Asia/Shanghai" },
  { iata: "PKX", name: "Beijing Daxing International Airport", city: "Beijing", country: "China", region: "Asia", tier: "international_hub", coordinates: { lat: 39.5098, lng: 116.4105 }, timezone: "Asia/Shanghai" },
  { iata: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai", country: "China", region: "Asia", tier: "international_hub", coordinates: { lat: 31.1443, lng: 121.8083 }, timezone: "Asia/Shanghai" },
  { iata: "SHA", name: "Shanghai Hongqiao International Airport", city: "Shanghai", country: "China", region: "Asia", tier: "domestic", coordinates: { lat: 31.1979, lng: 121.3364 }, timezone: "Asia/Shanghai" },
  { iata: "CAN", name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China", region: "Asia", tier: "international_hub", coordinates: { lat: 23.3924, lng: 113.2988 }, timezone: "Asia/Shanghai" },
  { iata: "SZX", name: "Shenzhen Bao'an International Airport", city: "Shenzhen", country: "China", region: "Asia", tier: "international_hub", coordinates: { lat: 22.6393, lng: 113.8107 }, timezone: "Asia/Shanghai" },
  { iata: "CTU", name: "Chengdu Shuangliu International Airport", city: "Chengdu", country: "China", region: "Asia", tier: "international_hub", coordinates: { lat: 30.5728, lng: 103.9468 }, timezone: "Asia/Shanghai" },
  { iata: "XIY", name: "Xi'an Xianyang International Airport", city: "Xi'an", country: "China", region: "Asia", tier: "regional_hub", coordinates: { lat: 34.4471, lng: 108.7519 }, timezone: "Asia/Shanghai" },
  { iata: "KMG", name: "Kunming Changshui International Airport", city: "Kunming", country: "China", region: "Asia", tier: "regional_hub", coordinates: { lat: 25.1019, lng: 102.9292 }, timezone: "Asia/Shanghai" },
  { iata: "WUH", name: "Wuhan Tianhe International Airport", city: "Wuhan", country: "China", region: "Asia", tier: "regional_hub", coordinates: { lat: 30.7838, lng: 114.2081 }, timezone: "Asia/Shanghai" },

  // Hong Kong, Taiwan, Macau
  { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong", region: "Asia", tier: "international_hub", coordinates: { lat: 22.3080, lng: 113.9185 }, timezone: "Asia/Hong_Kong" },
  { iata: "TPE", name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "Taiwan", region: "Asia", tier: "international_hub", coordinates: { lat: 25.0797, lng: 121.2342 }, timezone: "Asia/Taipei" },
  { iata: "TSA", name: "Taipei Songshan Airport", city: "Taipei", country: "Taiwan", region: "Asia", tier: "domestic", coordinates: { lat: 25.0694, lng: 121.5519 }, timezone: "Asia/Taipei" },
  { iata: "KHH", name: "Kaohsiung International Airport", city: "Kaohsiung", country: "Taiwan", region: "Asia", tier: "regional", coordinates: { lat: 22.5771, lng: 120.3500 }, timezone: "Asia/Taipei" },
  { iata: "MFM", name: "Macau International Airport", city: "Macau", country: "Macau", region: "Asia", tier: "regional", coordinates: { lat: 22.1496, lng: 113.5915 }, timezone: "Asia/Macau" },

  // Southeast Asia
  { iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", region: "Asia", tier: "international_hub", coordinates: { lat: 1.3644, lng: 103.9915 }, timezone: "Asia/Singapore" },
  { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", region: "Asia", tier: "international_hub", coordinates: { lat: 13.6900, lng: 100.7501 }, timezone: "Asia/Bangkok" },
  { iata: "DMK", name: "Don Mueang International Airport", city: "Bangkok", country: "Thailand", region: "Asia", tier: "domestic", coordinates: { lat: 13.9130, lng: 100.6069 }, timezone: "Asia/Bangkok" },
  { iata: "CNX", name: "Chiang Mai International Airport", city: "Chiang Mai", country: "Thailand", region: "Asia", tier: "regional", coordinates: { lat: 18.7669, lng: 98.9628 }, timezone: "Asia/Bangkok" },
  { iata: "HKT", name: "Phuket International Airport", city: "Phuket", country: "Thailand", region: "Asia", tier: "regional_hub", coordinates: { lat: 8.1132, lng: 98.3169 }, timezone: "Asia/Bangkok" },
  { iata: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia", region: "Asia", tier: "international_hub", coordinates: { lat: 2.7456, lng: 101.7099 }, timezone: "Asia/Kuala_Lumpur" },
  { iata: "SZB", name: "Sultan Abdul Aziz Shah Airport", city: "Kuala Lumpur", country: "Malaysia", region: "Asia", tier: "domestic", coordinates: { lat: 3.1307, lng: 101.5490 }, timezone: "Asia/Kuala_Lumpur" },
  { iata: "PEN", name: "Penang International Airport", city: "Penang", country: "Malaysia", region: "Asia", tier: "regional", coordinates: { lat: 5.2971, lng: 100.2770 }, timezone: "Asia/Kuala_Lumpur" },
  { iata: "CGK", name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia", region: "Asia", tier: "international_hub", coordinates: { lat: -6.1256, lng: 106.6559 }, timezone: "Asia/Jakarta" },
  { iata: "DPS", name: "Ngurah Rai International Airport", city: "Denpasar", country: "Indonesia", region: "Asia", tier: "international_hub", coordinates: { lat: -8.7483, lng: 115.1671 }, timezone: "Asia/Makassar" },
  { iata: "SUB", name: "Juanda International Airport", city: "Surabaya", country: "Indonesia", region: "Asia", tier: "regional_hub", coordinates: { lat: -7.3798, lng: 112.7869 }, timezone: "Asia/Jakarta" },
  { iata: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", country: "Philippines", region: "Asia", tier: "international_hub", coordinates: { lat: 14.5086, lng: 121.0194 }, timezone: "Asia/Manila" },
  { iata: "CEB", name: "Mactan-Cebu International Airport", city: "Cebu", country: "Philippines", region: "Asia", tier: "regional_hub", coordinates: { lat: 10.3075, lng: 123.9790 }, timezone: "Asia/Manila" },
  { iata: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam", region: "Asia", tier: "international_hub", coordinates: { lat: 10.8188, lng: 106.6519 }, timezone: "Asia/Ho_Chi_Minh" },
  { iata: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam", region: "Asia", tier: "international_hub", coordinates: { lat: 21.2212, lng: 105.8071 }, timezone: "Asia/Ho_Chi_Minh" },
  { iata: "RGN", name: "Yangon International Airport", city: "Yangon", country: "Myanmar", region: "Asia", tier: "regional_hub", coordinates: { lat: 16.9073, lng: 96.1331 }, timezone: "Asia/Yangon" },

  // India & South Asia
  { iata: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India", region: "Asia", tier: "international_hub", coordinates: { lat: 28.5562, lng: 77.1000 }, timezone: "Asia/Kolkata" },
  { iata: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India", region: "Asia", tier: "international_hub", coordinates: { lat: 19.0896, lng: 72.8656 }, timezone: "Asia/Kolkata" },
  { iata: "BLR", name: "Kempegowda International Airport", city: "Bangalore", country: "India", region: "Asia", tier: "international_hub", coordinates: { lat: 13.1986, lng: 77.7066 }, timezone: "Asia/Kolkata" },
  { iata: "MAA", name: "Chennai International Airport", city: "Chennai", country: "India", region: "Asia", tier: "international_hub", coordinates: { lat: 12.9941, lng: 80.1709 }, timezone: "Asia/Kolkata" },
  { iata: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", country: "India", region: "Asia", tier: "international_hub", coordinates: { lat: 22.6546, lng: 88.4467 }, timezone: "Asia/Kolkata" },
  { iata: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad", country: "India", region: "Asia", tier: "international_hub", coordinates: { lat: 17.2403, lng: 78.4294 }, timezone: "Asia/Kolkata" },
  { iata: "AMD", name: "Sardar Vallabhbhai Patel International Airport", city: "Ahmedabad", country: "India", region: "Asia", tier: "regional_hub", coordinates: { lat: 23.0772, lng: 72.6347 }, timezone: "Asia/Kolkata" },
  { iata: "GOI", name: "Goa International Airport", city: "Goa", country: "India", region: "Asia", tier: "regional", coordinates: { lat: 15.3808, lng: 73.8314 }, timezone: "Asia/Kolkata" },
  { iata: "COK", name: "Cochin International Airport", city: "Kochi", country: "India", region: "Asia", tier: "regional_hub", coordinates: { lat: 10.1520, lng: 76.4019 }, timezone: "Asia/Kolkata" },
  { iata: "TRV", name: "Trivandrum International Airport", city: "Thiruvananthapuram", country: "India", region: "Asia", tier: "regional", coordinates: { lat: 8.4821, lng: 76.9200 }, timezone: "Asia/Kolkata" },
  { iata: "KTM", name: "Tribhuvan International Airport", city: "Kathmandu", country: "Nepal", region: "Asia", tier: "regional_hub", coordinates: { lat: 27.6966, lng: 85.3591 }, timezone: "Asia/Kathmandu" },
  { iata: "CMB", name: "Bandaranaike International Airport", city: "Colombo", country: "Sri Lanka", region: "Asia", tier: "regional_hub", coordinates: { lat: 7.1808, lng: 79.8841 }, timezone: "Asia/Colombo" },
  { iata: "DAC", name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "Bangladesh", region: "Asia", tier: "regional_hub", coordinates: { lat: 23.8433, lng: 90.3978 }, timezone: "Asia/Dhaka" },

  // =============== MIDDLE EAST ===============

  { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", region: "Middle East", tier: "international_hub", coordinates: { lat: 25.2532, lng: 55.3657 }, timezone: "Asia/Dubai" },
  { iata: "DWC", name: "Al Maktoum International Airport", city: "Dubai", country: "United Arab Emirates", region: "Middle East", tier: "regional", coordinates: { lat: 24.8967, lng: 55.1612 }, timezone: "Asia/Dubai" },
  { iata: "AUH", name: "Abu Dhabi International Airport", city: "Abu Dhabi", country: "United Arab Emirates", region: "Middle East", tier: "international_hub", coordinates: { lat: 24.4331, lng: 54.6511 }, timezone: "Asia/Dubai" },
  { iata: "DOH", name: "Hamad International Airport", city: "Doha", country: "Qatar", region: "Middle East", tier: "international_hub", coordinates: { lat: 25.2731, lng: 51.6080 }, timezone: "Asia/Qatar" },
  { iata: "KWI", name: "Kuwait International Airport", city: "Kuwait City", country: "Kuwait", region: "Middle East", tier: "regional_hub", coordinates: { lat: 29.2267, lng: 47.9690 }, timezone: "Asia/Kuwait" },
  { iata: "BAH", name: "Bahrain International Airport", city: "Manama", country: "Bahrain", region: "Middle East", tier: "regional_hub", coordinates: { lat: 26.2708, lng: 50.6336 }, timezone: "Asia/Bahrain" },
  { iata: "MCT", name: "Muscat International Airport", city: "Muscat", country: "Oman", region: "Middle East", tier: "regional_hub", coordinates: { lat: 23.5933, lng: 58.2844 }, timezone: "Asia/Muscat" },
  { iata: "RUH", name: "King Khalid International Airport", city: "Riyadh", country: "Saudi Arabia", region: "Middle East", tier: "international_hub", coordinates: { lat: 24.9576, lng: 46.6988 }, timezone: "Asia/Riyadh" },
  { iata: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "Saudi Arabia", region: "Middle East", tier: "international_hub", coordinates: { lat: 21.6796, lng: 39.1564 }, timezone: "Asia/Riyadh" },
  { iata: "DMM", name: "King Fahd International Airport", city: "Dammam", country: "Saudi Arabia", region: "Middle East", tier: "regional_hub", coordinates: { lat: 26.4711, lng: 49.7979 }, timezone: "Asia/Riyadh" },
  { iata: "TLV", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel", region: "Middle East", tier: "international_hub", coordinates: { lat: 32.0114, lng: 34.8867 }, timezone: "Asia/Jerusalem" },
  { iata: "AMM", name: "Queen Alia International Airport", city: "Amman", country: "Jordan", region: "Middle East", tier: "regional_hub", coordinates: { lat: 31.7226, lng: 35.9932 }, timezone: "Asia/Amman" },
  { iata: "BEY", name: "Rafic Hariri International Airport", city: "Beirut", country: "Lebanon", region: "Middle East", tier: "regional_hub", coordinates: { lat: 33.8209, lng: 35.4884 }, timezone: "Asia/Beirut" },
  { iata: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egypt", region: "Middle East", tier: "international_hub", coordinates: { lat: 30.1219, lng: 31.4056 }, timezone: "Africa/Cairo" },
  { iata: "IKA", name: "Imam Khomeini International Airport", city: "Tehran", country: "Iran", region: "Middle East", tier: "international_hub", coordinates: { lat: 35.4161, lng: 51.1522 }, timezone: "Asia/Tehran" },
  { iata: "THR", name: "Mehrabad International Airport", city: "Tehran", country: "Iran", region: "Middle East", tier: "domestic", coordinates: { lat: 35.6892, lng: 51.3133 }, timezone: "Asia/Tehran" },
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", region: "Middle East", tier: "international_hub", coordinates: { lat: 41.2753, lng: 28.7519 }, timezone: "Europe/Istanbul" },
  { iata: "SAW", name: "Sabiha Gökçen International Airport", city: "Istanbul", country: "Turkey", region: "Middle East", tier: "regional_hub", coordinates: { lat: 40.8986, lng: 29.3092 }, timezone: "Europe/Istanbul" },
  { iata: "ESB", name: "Esenboğa International Airport", city: "Ankara", country: "Turkey", region: "Middle East", tier: "regional", coordinates: { lat: 40.1281, lng: 32.9951 }, timezone: "Europe/Istanbul" },
  { iata: "AYT", name: "Antalya Airport", city: "Antalya", country: "Turkey", region: "Middle East", tier: "regional_hub", coordinates: { lat: 36.8987, lng: 30.8005 }, timezone: "Europe/Istanbul" },

  // =============== EUROPE ===============

  // United Kingdom & Ireland
  { iata: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom", region: "Europe", tier: "international_hub", coordinates: { lat: 51.4700, lng: -0.4543 }, timezone: "Europe/London" },
  { iata: "LGW", name: "London Gatwick Airport", city: "London", country: "United Kingdom", region: "Europe", tier: "international_hub", coordinates: { lat: 51.1481, lng: -0.1903 }, timezone: "Europe/London" },
  { iata: "STN", name: "London Stansted Airport", city: "London", country: "United Kingdom", region: "Europe", tier: "regional_hub", coordinates: { lat: 51.8860, lng: 0.2389 }, timezone: "Europe/London" },
  { iata: "LTN", name: "London Luton Airport", city: "London", country: "United Kingdom", region: "Europe", tier: "regional", coordinates: { lat: 51.8747, lng: -0.3683 }, timezone: "Europe/London" },
  { iata: "LCY", name: "London City Airport", city: "London", country: "United Kingdom", region: "Europe", tier: "domestic", coordinates: { lat: 51.5048, lng: 0.0495 }, timezone: "Europe/London" },
  { iata: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom", region: "Europe", tier: "international_hub", coordinates: { lat: 53.3537, lng: -2.2750 }, timezone: "Europe/London" },
  { iata: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "United Kingdom", region: "Europe", tier: "regional_hub", coordinates: { lat: 52.4539, lng: -1.7480 }, timezone: "Europe/London" },
  { iata: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", region: "Europe", tier: "regional_hub", coordinates: { lat: 55.9500, lng: -3.3725 }, timezone: "Europe/London" },
  { iata: "GLA", name: "Glasgow Airport", city: "Glasgow", country: "United Kingdom", region: "Europe", tier: "regional", coordinates: { lat: 55.8719, lng: -4.4333 }, timezone: "Europe/London" },
  { iata: "NCL", name: "Newcastle Airport", city: "Newcastle", country: "United Kingdom", region: "Europe", tier: "regional", coordinates: { lat: 55.0375, lng: -1.6917 }, timezone: "Europe/London" },
  { iata: "LPL", name: "Liverpool John Lennon Airport", city: "Liverpool", country: "United Kingdom", region: "Europe", tier: "regional", coordinates: { lat: 53.3336, lng: -2.8497 }, timezone: "Europe/London" },
  { iata: "BRS", name: "Bristol Airport", city: "Bristol", country: "United Kingdom", region: "Europe", tier: "regional", coordinates: { lat: 51.3827, lng: -2.7191 }, timezone: "Europe/London" },
  { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", region: "Europe", tier: "international_hub", coordinates: { lat: 53.4213, lng: -6.2701 }, timezone: "Europe/Dublin" },
  { iata: "ORK", name: "Cork Airport", city: "Cork", country: "Ireland", region: "Europe", tier: "regional", coordinates: { lat: 51.8413, lng: -8.4811 }, timezone: "Europe/Dublin" },

  // France
  { iata: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", region: "Europe", tier: "international_hub", coordinates: { lat: 49.0097, lng: 2.5479 }, timezone: "Europe/Paris" },
  { iata: "ORY", name: "Orly Airport", city: "Paris", country: "France", region: "Europe", tier: "international_hub", coordinates: { lat: 48.7262, lng: 2.3656 }, timezone: "Europe/Paris" },
  { iata: "LYS", name: "Lyon-Saint Exupéry Airport", city: "Lyon", country: "France", region: "Europe", tier: "regional_hub", coordinates: { lat: 45.7256, lng: 5.0811 }, timezone: "Europe/Paris" },
  { iata: "MRS", name: "Marseille Provence Airport", city: "Marseille", country: "France", region: "Europe", tier: "regional_hub", coordinates: { lat: 43.4393, lng: 5.2214 }, timezone: "Europe/Paris" },
  { iata: "NCE", name: "Nice Côte d'Azur Airport", city: "Nice", country: "France", region: "Europe", tier: "regional_hub", coordinates: { lat: 43.6584, lng: 7.2159 }, timezone: "Europe/Paris" },
  { iata: "TLS", name: "Toulouse-Blagnac Airport", city: "Toulouse", country: "France", region: "Europe", tier: "regional", coordinates: { lat: 43.6291, lng: 1.3638 }, timezone: "Europe/Paris" },
  { iata: "NTE", name: "Nantes Atlantique Airport", city: "Nantes", country: "France", region: "Europe", tier: "regional", coordinates: { lat: 47.1532, lng: -1.6107 }, timezone: "Europe/Paris" },
  { iata: "BOD", name: "Bordeaux-Mérignac Airport", city: "Bordeaux", country: "France", region: "Europe", tier: "regional", coordinates: { lat: 44.8283, lng: -0.7156 }, timezone: "Europe/Paris" },

  // Germany
  { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", region: "Europe", tier: "international_hub", coordinates: { lat: 49.4264, lng: 8.5706 }, timezone: "Europe/Berlin" },
  { iata: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", region: "Europe", tier: "international_hub", coordinates: { lat: 48.3538, lng: 11.7861 }, timezone: "Europe/Berlin" },
  { iata: "DUS", name: "Düsseldorf Airport", city: "Düsseldorf", country: "Germany", region: "Europe", tier: "international_hub", coordinates: { lat: 51.2895, lng: 6.7668 }, timezone: "Europe/Berlin" },
  { iata: "TXL", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", region: "Europe", tier: "international_hub", coordinates: { lat: 52.3667, lng: 13.5033 }, timezone: "Europe/Berlin" },
  { iata: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "Germany", region: "Europe", tier: "regional_hub", coordinates: { lat: 53.6304, lng: 9.9882 }, timezone: "Europe/Berlin" },
  { iata: "CGN", name: "Cologne Bonn Airport", city: "Cologne", country: "Germany", region: "Europe", tier: "regional_hub", coordinates: { lat: 50.8659, lng: 7.1427 }, timezone: "Europe/Berlin" },
  { iata: "STR", name: "Stuttgart Airport", city: "Stuttgart", country: "Germany", region: "Europe", tier: "regional", coordinates: { lat: 48.6899, lng: 9.2220 }, timezone: "Europe/Berlin" },
  { iata: "NUE", name: "Nuremberg Airport", city: "Nuremberg", country: "Germany", region: "Europe", tier: "regional", coordinates: { lat: 49.4987, lng: 11.0669 }, timezone: "Europe/Berlin" },
  { iata: "HAN", name: "Hannover Airport", city: "Hannover", country: "Germany", region: "Europe", tier: "regional", coordinates: { lat: 52.4611, lng: 9.6951 }, timezone: "Europe/Berlin" },

  // Netherlands & Belgium
  { iata: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands", region: "Europe", tier: "international_hub", coordinates: { lat: 52.3105, lng: 4.7683 }, timezone: "Europe/Amsterdam" },
  { iata: "RTM", name: "Rotterdam The Hague Airport", city: "Rotterdam", country: "Netherlands", region: "Europe", tier: "regional", coordinates: { lat: 51.9569, lng: 4.4375 }, timezone: "Europe/Amsterdam" },
  { iata: "EIN", name: "Eindhoven Airport", city: "Eindhoven", country: "Netherlands", region: "Europe", tier: "regional", coordinates: { lat: 51.4500, lng: 5.3747 }, timezone: "Europe/Amsterdam" },
  { iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", region: "Europe", tier: "international_hub", coordinates: { lat: 50.9014, lng: 4.4844 }, timezone: "Europe/Brussels" },
  { iata: "CRL", name: "Brussels South Charleroi Airport", city: "Brussels", country: "Belgium", region: "Europe", tier: "regional", coordinates: { lat: 50.4592, lng: 4.4538 }, timezone: "Europe/Brussels" },
  { iata: "ANR", name: "Antwerp International Airport", city: "Antwerp", country: "Belgium", region: "Europe", tier: "regional", coordinates: { lat: 51.1894, lng: 4.4603 }, timezone: "Europe/Brussels" },

  // Switzerland & Austria
  { iata: "ZUR", name: "Zurich Airport", city: "Zurich", country: "Switzerland", region: "Europe", tier: "international_hub", coordinates: { lat: 47.4647, lng: 8.5492 }, timezone: "Europe/Zurich" },
  { iata: "GVA", name: "Geneva Airport", city: "Geneva", country: "Switzerland", region: "Europe", tier: "international_hub", coordinates: { lat: 46.2381, lng: 6.1089 }, timezone: "Europe/Zurich" },
  { iata: "BSL", name: "EuroAirport Basel-Mulhouse-Freiburg", city: "Basel", country: "Switzerland", region: "Europe", tier: "regional", coordinates: { lat: 47.5896, lng: 7.5298 }, timezone: "Europe/Zurich" },
  { iata: "VIE", name: "Vienna International Airport", city: "Vienna", country: "Austria", region: "Europe", tier: "international_hub", coordinates: { lat: 48.1103, lng: 16.5697 }, timezone: "Europe/Vienna" },
  { iata: "SZG", name: "Salzburg Airport", city: "Salzburg", country: "Austria", region: "Europe", tier: "regional", coordinates: { lat: 47.7933, lng: 13.0043 }, timezone: "Europe/Vienna" },
  { iata: "INN", name: "Innsbruck Airport", city: "Innsbruck", country: "Austria", region: "Europe", tier: "regional", coordinates: { lat: 47.2602, lng: 11.3439 }, timezone: "Europe/Vienna" },

  // Italy
  { iata: "FCO", name: "Leonardo da Vinci–Fiumicino Airport", city: "Rome", country: "Italy", region: "Europe", tier: "international_hub", coordinates: { lat: 41.8003, lng: 12.2389 }, timezone: "Europe/Rome" },
  { iata: "CIA", name: "Rome Ciampino Airport", city: "Rome", country: "Italy", region: "Europe", tier: "regional", coordinates: { lat: 41.7994, lng: 12.5949 }, timezone: "Europe/Rome" },
  { iata: "MXP", name: "Milan Malpensa Airport", city: "Milan", country: "Italy", region: "Europe", tier: "international_hub", coordinates: { lat: 45.6306, lng: 8.7281 }, timezone: "Europe/Rome" },
  { iata: "LIN", name: "Milan Linate Airport", city: "Milan", country: "Italy", region: "Europe", tier: "domestic", coordinates: { lat: 45.4451, lng: 9.2767 }, timezone: "Europe/Rome" },
  { iata: "BGY", name: "Milan Bergamo Airport", city: "Milan", country: "Italy", region: "Europe", tier: "regional", coordinates: { lat: 45.6739, lng: 9.7042 }, timezone: "Europe/Rome" },
  { iata: "VCE", name: "Venice Marco Polo Airport", city: "Venice", country: "Italy", region: "Europe", tier: "international_hub", coordinates: { lat: 45.5053, lng: 12.3519 }, timezone: "Europe/Rome" },
  { iata: "NAP", name: "Naples International Airport", city: "Naples", country: "Italy", region: "Europe", tier: "regional_hub", coordinates: { lat: 40.8860, lng: 14.2908 }, timezone: "Europe/Rome" },
  { iata: "FLR", name: "Florence Airport", city: "Florence", country: "Italy", region: "Europe", tier: "regional", coordinates: { lat: 43.8100, lng: 11.2051 }, timezone: "Europe/Rome" },
  { iata: "BLQ", name: "Bologna Guglielmo Marconi Airport", city: "Bologna", country: "Italy", region: "Europe", tier: "regional", coordinates: { lat: 44.5354, lng: 11.2887 }, timezone: "Europe/Rome" },
  { iata: "CTA", name: "Catania-Fontanarossa Airport", city: "Catania", country: "Italy", region: "Europe", tier: "regional", coordinates: { lat: 37.4668, lng: 15.0664 }, timezone: "Europe/Rome" },
  { iata: "PMO", name: "Palermo Airport", city: "Palermo", country: "Italy", region: "Europe", tier: "regional", coordinates: { lat: 38.1759, lng: 13.0910 }, timezone: "Europe/Rome" },

  // Spain & Portugal
  { iata: "MAD", name: "Adolfo Suárez Madrid–Barajas Airport", city: "Madrid", country: "Spain", region: "Europe", tier: "international_hub", coordinates: { lat: 40.4719, lng: -3.5626 }, timezone: "Europe/Madrid" },
  { iata: "BCN", name: "Barcelona–El Prat Airport", city: "Barcelona", country: "Spain", region: "Europe", tier: "international_hub", coordinates: { lat: 41.2971, lng: 2.0785 }, timezone: "Europe/Madrid" },
  { iata: "PMI", name: "Palma de Mallorca Airport", city: "Palma", country: "Spain", region: "Europe", tier: "international_hub", coordinates: { lat: 39.5517, lng: 2.7388 }, timezone: "Europe/Madrid" },
  { iata: "VLC", name: "Valencia Airport", city: "Valencia", country: "Spain", region: "Europe", tier: "regional", coordinates: { lat: 39.4893, lng: -0.4816 }, timezone: "Europe/Madrid" },
  { iata: "SVQ", name: "Seville Airport", city: "Seville", country: "Spain", region: "Europe", tier: "regional", coordinates: { lat: 37.4180, lng: -5.8931 }, timezone: "Europe/Madrid" },
  { iata: "BIO", name: "Bilbao Airport", city: "Bilbao", country: "Spain", region: "Europe", tier: "regional", coordinates: { lat: 43.3011, lng: -2.9106 }, timezone: "Europe/Madrid" },
  { iata: "LPA", name: "Las Palmas Airport", city: "Las Palmas", country: "Spain", region: "Europe", tier: "regional_hub", coordinates: { lat: 27.9319, lng: -15.3866 }, timezone: "Atlantic/Canary" },
  { iata: "TFS", name: "Tenerife South Airport", city: "Tenerife", country: "Spain", region: "Europe", tier: "regional_hub", coordinates: { lat: 28.0445, lng: -16.5725 }, timezone: "Atlantic/Canary" },
  { iata: "LIS", name: "Lisbon Airport", city: "Lisbon", country: "Portugal", region: "Europe", tier: "international_hub", coordinates: { lat: 38.7813, lng: -9.1355 }, timezone: "Europe/Lisbon" },
  { iata: "OPO", name: "Francisco Sá Carneiro Airport", city: "Porto", country: "Portugal", region: "Europe", tier: "regional_hub", coordinates: { lat: 41.2481, lng: -8.6814 }, timezone: "Europe/Lisbon" },
  { iata: "FAO", name: "Faro Airport", city: "Faro", country: "Portugal", region: "Europe", tier: "regional", coordinates: { lat: 37.0144, lng: -7.9659 }, timezone: "Europe/Lisbon" },

  // Nordic Countries
  { iata: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Sweden", region: "Europe", tier: "international_hub", coordinates: { lat: 59.6519, lng: 17.9186 }, timezone: "Europe/Stockholm" },
  { iata: "BMA", name: "Stockholm Bromma Airport", city: "Stockholm", country: "Sweden", region: "Europe", tier: "domestic", coordinates: { lat: 59.3544, lng: 17.9417 }, timezone: "Europe/Stockholm" },
  { iata: "GOT", name: "Göteborg Landvetter Airport", city: "Gothenburg", country: "Sweden", region: "Europe", tier: "regional", coordinates: { lat: 57.6628, lng: 12.2798 }, timezone: "Europe/Stockholm" },
  { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", region: "Europe", tier: "international_hub", coordinates: { lat: 55.6181, lng: 12.6561 }, timezone: "Europe/Copenhagen" },
  { iata: "OSL", name: "Oslo Airport", city: "Oslo", country: "Norway", region: "Europe", tier: "international_hub", coordinates: { lat: 60.1939, lng: 11.1004 }, timezone: "Europe/Oslo" },
  { iata: "BGO", name: "Bergen Airport", city: "Bergen", country: "Norway", region: "Europe", tier: "regional", coordinates: { lat: 60.2934, lng: 5.2181 }, timezone: "Europe/Oslo" },
  { iata: "TRD", name: "Trondheim Airport", city: "Trondheim", country: "Norway", region: "Europe", tier: "regional", coordinates: { lat: 63.4578, lng: 10.9240 }, timezone: "Europe/Oslo" },
  { iata: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinki", country: "Finland", region: "Europe", tier: "international_hub", coordinates: { lat: 60.3172, lng: 24.9633 }, timezone: "Europe/Helsinki" },
  { iata: "KEF", name: "Keflavík International Airport", city: "Reykjavik", country: "Iceland", region: "Europe", tier: "international_hub", coordinates: { lat: 63.9850, lng: -22.6056 }, timezone: "Atlantic/Reykjavik" },

  // Eastern Europe
  { iata: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", country: "Poland", region: "Europe", tier: "international_hub", coordinates: { lat: 52.1657, lng: 20.9671 }, timezone: "Europe/Warsaw" },
  { iata: "KRK", name: "John Paul II International Airport Kraków-Balice", city: "Krakow", country: "Poland", region: "Europe", tier: "regional", coordinates: { lat: 50.0777, lng: 19.7848 }, timezone: "Europe/Warsaw" },
  { iata: "GDN", name: "Gdańsk Lech Wałęsa Airport", city: "Gdansk", country: "Poland", region: "Europe", tier: "regional", coordinates: { lat: 54.3776, lng: 18.4662 }, timezone: "Europe/Warsaw" },
  { iata: "PRG", name: "Václav Havel Airport Prague", city: "Prague", country: "Czech Republic", region: "Europe", tier: "international_hub", coordinates: { lat: 50.1008, lng: 14.2632 }, timezone: "Europe/Prague" },
  { iata: "BUD", name: "Budapest Ferenc Liszt International Airport", city: "Budapest", country: "Hungary", region: "Europe", tier: "international_hub", coordinates: { lat: 47.4298, lng: 19.2611 }, timezone: "Europe/Budapest" },
  { iata: "BTS", name: "M. R. Štefánik Airport", city: "Bratislava", country: "Slovakia", region: "Europe", tier: "regional", coordinates: { lat: 48.1702, lng: 17.2127 }, timezone: "Europe/Bratislava" },
  { iata: "LJU", name: "Ljubljana Jože Pučnik Airport", city: "Ljubljana", country: "Slovenia", region: "Europe", tier: "regional", coordinates: { lat: 46.2237, lng: 14.4576 }, timezone: "Europe/Ljubljana" },
  { iata: "ZAG", name: "Zagreb Airport", city: "Zagreb", country: "Croatia", region: "Europe", tier: "regional_hub", coordinates: { lat: 45.7429, lng: 16.0688 }, timezone: "Europe/Zagreb" },
  { iata: "SPU", name: "Split Airport", city: "Split", country: "Croatia", region: "Europe", tier: "regional", coordinates: { lat: 43.5389, lng: 16.2980 }, timezone: "Europe/Zagreb" },
  { iata: "DBV", name: "Dubrovnik Airport", city: "Dubrovnik", country: "Croatia", region: "Europe", tier: "regional", coordinates: { lat: 42.5614, lng: 18.2682 }, timezone: "Europe/Zagreb" },
  { iata: "BEG", name: "Belgrade Nikola Tesla Airport", city: "Belgrade", country: "Serbia", region: "Europe", tier: "regional_hub", coordinates: { lat: 44.8184, lng: 20.3090 }, timezone: "Europe/Belgrade" },
  { iata: "SOF", name: "Sofia Airport", city: "Sofia", country: "Bulgaria", region: "Europe", tier: "regional_hub", coordinates: { lat: 42.6968, lng: 23.4114 }, timezone: "Europe/Sofia" },
  { iata: "BOJ", name: "Burgas Airport", city: "Burgas", country: "Bulgaria", region: "Europe", tier: "regional", coordinates: { lat: 42.5695, lng: 27.5152 }, timezone: "Europe/Sofia" },
  { iata: "VAR", name: "Varna Airport", city: "Varna", country: "Bulgaria", region: "Europe", tier: "regional", coordinates: { lat: 43.2322, lng: 27.8251 }, timezone: "Europe/Sofia" },
  { iata: "OTP", name: "Henri Coandă International Airport", city: "Bucharest", country: "Romania", region: "Europe", tier: "international_hub", coordinates: { lat: 44.5711, lng: 26.0850 }, timezone: "Europe/Bucharest" },

  // Greece & Cyprus
  { iata: "ATH", name: "Athens International Airport", city: "Athens", country: "Greece", region: "Europe", tier: "international_hub", coordinates: { lat: 37.9364, lng: 23.9445 }, timezone: "Europe/Athens" },
  { iata: "SKG", name: "Thessaloniki Airport", city: "Thessaloniki", country: "Greece", region: "Europe", tier: "regional_hub", coordinates: { lat: 40.5197, lng: 22.9709 }, timezone: "Europe/Athens" },
  { iata: "HER", name: "Heraklion International Airport", city: "Heraklion", country: "Greece", region: "Europe", tier: "regional", coordinates: { lat: 35.3397, lng: 25.1803 }, timezone: "Europe/Athens" },
  { iata: "RHO", name: "Rhodes International Airport", city: "Rhodes", country: "Greece", region: "Europe", tier: "regional", coordinates: { lat: 36.4054, lng: 28.0862 }, timezone: "Europe/Athens" },
  { iata: "JMK", name: "Mykonos Airport", city: "Mykonos", country: "Greece", region: "Europe", tier: "regional", coordinates: { lat: 37.4351, lng: 25.3481 }, timezone: "Europe/Athens" },
  { iata: "JTR", name: "Santorini Airport", city: "Santorini", country: "Greece", region: "Europe", tier: "regional", coordinates: { lat: 36.3992, lng: 25.4793 }, timezone: "Europe/Athens" },
  { iata: "LCA", name: "Larnaca International Airport", city: "Larnaca", country: "Cyprus", region: "Europe", tier: "regional_hub", coordinates: { lat: 34.8751, lng: 33.6249 }, timezone: "Asia/Nicosia" },
  { iata: "PFO", name: "Paphos International Airport", city: "Paphos", country: "Cyprus", region: "Europe", tier: "regional", coordinates: { lat: 34.7180, lng: 32.4857 }, timezone: "Asia/Nicosia" },

  // Russia & CIS
  { iata: "SVO", name: "Sheremetyevo International Airport", city: "Moscow", country: "Russia", region: "Europe", tier: "international_hub", coordinates: { lat: 55.9726, lng: 37.4146 }, timezone: "Europe/Moscow" },
  { iata: "DME", name: "Domodedovo International Airport", city: "Moscow", country: "Russia", region: "Europe", tier: "international_hub", coordinates: { lat: 55.4088, lng: 37.9063 }, timezone: "Europe/Moscow" },
  { iata: "VKO", name: "Vnukovo International Airport", city: "Moscow", country: "Russia", region: "Europe", tier: "domestic", coordinates: { lat: 55.5914, lng: 37.2615 }, timezone: "Europe/Moscow" },
  { iata: "LED", name: "Pulkovo Airport", city: "Saint Petersburg", country: "Russia", region: "Europe", tier: "international_hub", coordinates: { lat: 59.8003, lng: 30.2625 }, timezone: "Europe/Moscow" },

  // =============== NORTH AMERICA ===============

  // United States - Major Hubs
  { iata: "ATL", name: "Hartsfield–Jackson Atlanta International Airport", city: "Atlanta", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 33.6367, lng: -84.4281 }, timezone: "America/New_York" },
  { iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 33.9425, lng: -118.4081 }, timezone: "America/Los_Angeles" },
  { iata: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 41.9786, lng: -87.9048 }, timezone: "America/Chicago" },
  { iata: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 32.8968, lng: -97.0380 }, timezone: "America/Chicago" },
  { iata: "DEN", name: "Denver International Airport", city: "Denver", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 39.8617, lng: -104.6731 }, timezone: "America/Denver" },
  { iata: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 40.6413, lng: -73.7781 }, timezone: "America/New_York" },
  { iata: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States", region: "North America", tier: "domestic", coordinates: { lat: 40.7769, lng: -73.8740 }, timezone: "America/New_York" },
  { iata: "EWR", name: "Newark Liberty International Airport", city: "Newark", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 40.6925, lng: -74.1687 }, timezone: "America/New_York" },
  { iata: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 37.6213, lng: -122.3790 }, timezone: "America/Los_Angeles" },
  { iata: "SEA", name: "Seattle–Tacoma International Airport", city: "Seattle", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 47.4502, lng: -122.3088 }, timezone: "America/Los_Angeles" },
  { iata: "LAS", name: "Harry Reid International Airport", city: "Las Vegas", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 36.0840, lng: -115.1537 }, timezone: "America/Los_Angeles" },
  { iata: "PHX", name: "Phoenix Sky Harbor International Airport", city: "Phoenix", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 33.4343, lng: -112.0116 }, timezone: "America/Phoenix" },
  { iata: "MIA", name: "Miami International Airport", city: "Miami", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 25.7959, lng: -80.2870 }, timezone: "America/New_York" },
  { iata: "MCO", name: "Orlando International Airport", city: "Orlando", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 28.4294, lng: -81.3089 }, timezone: "America/New_York" },
  { iata: "FLL", name: "Fort Lauderdale-Hollywood International Airport", city: "Fort Lauderdale", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 26.0742, lng: -80.1506 }, timezone: "America/New_York" },
  { iata: "BOS", name: "Logan International Airport", city: "Boston", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 42.3656, lng: -71.0096 }, timezone: "America/New_York" },
  { iata: "IAH", name: "George Bush Intercontinental Airport", city: "Houston", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 29.9902, lng: -95.3368 }, timezone: "America/Chicago" },
  { iata: "HOU", name: "William P. Hobby Airport", city: "Houston", country: "United States", region: "North America", tier: "domestic", coordinates: { lat: 29.6454, lng: -95.2789 }, timezone: "America/Chicago" },
  { iata: "MSP", name: "Minneapolis–Saint Paul International Airport", city: "Minneapolis", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 44.8848, lng: -93.2223 }, timezone: "America/Chicago" },
  { iata: "DTW", name: "Detroit Metropolitan Wayne County Airport", city: "Detroit", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 42.2124, lng: -83.3534 }, timezone: "America/New_York" },
  { iata: "CLT", name: "Charlotte Douglas International Airport", city: "Charlotte", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 35.2144, lng: -80.9473 }, timezone: "America/New_York" },
  { iata: "PHL", name: "Philadelphia International Airport", city: "Philadelphia", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 39.8719, lng: -75.2411 }, timezone: "America/New_York" },
  { iata: "BWI", name: "Baltimore/Washington International Thurgood Marshall Airport", city: "Baltimore", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 39.1754, lng: -76.6683 }, timezone: "America/New_York" },
  { iata: "DCA", name: "Ronald Reagan Washington National Airport", city: "Washington", country: "United States", region: "North America", tier: "domestic", coordinates: { lat: 38.8512, lng: -77.0402 }, timezone: "America/New_York" },
  { iata: "IAD", name: "Washington Dulles International Airport", city: "Washington", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 38.9531, lng: -77.4565 }, timezone: "America/New_York" },

  // United States - Regional Hubs
  { iata: "SLC", name: "Salt Lake City International Airport", city: "Salt Lake City", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 40.7899, lng: -111.9791 }, timezone: "America/Denver" },
  { iata: "PDX", name: "Portland International Airport", city: "Portland", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 45.5898, lng: -122.5951 }, timezone: "America/Los_Angeles" },
  { iata: "SAN", name: "San Diego International Airport", city: "San Diego", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 32.7336, lng: -117.1897 }, timezone: "America/Los_Angeles" },
  { iata: "SJC", name: "Norman Y. Mineta San José International Airport", city: "San Jose", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 37.3626, lng: -121.9291 }, timezone: "America/Los_Angeles" },
  { iata: "OAK", name: "Oakland International Airport", city: "Oakland", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 37.7214, lng: -122.2208 }, timezone: "America/Los_Angeles" },
  { iata: "SMF", name: "Sacramento International Airport", city: "Sacramento", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 38.6954, lng: -121.5906 }, timezone: "America/Los_Angeles" },
  { iata: "BUR", name: "Hollywood Burbank Airport", city: "Burbank", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 34.2007, lng: -118.3585 }, timezone: "America/Los_Angeles" },
  { iata: "LGB", name: "Long Beach Airport", city: "Long Beach", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 33.8177, lng: -118.1516 }, timezone: "America/Los_Angeles" },
  { iata: "MDW", name: "Chicago Midway International Airport", city: "Chicago", country: "United States", region: "North America", tier: "domestic", coordinates: { lat: 41.7868, lng: -87.7522 }, timezone: "America/Chicago" },
  { iata: "STL", name: "St. Louis Lambert International Airport", city: "St. Louis", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 38.7487, lng: -90.3700 }, timezone: "America/Chicago" },
  { iata: "MCI", name: "Kansas City International Airport", city: "Kansas City", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 39.2976, lng: -94.7139 }, timezone: "America/Chicago" },
  { iata: "MSY", name: "Louis Armstrong New Orleans International Airport", city: "New Orleans", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 29.9934, lng: -90.2580 }, timezone: "America/Chicago" },
  { iata: "MEM", name: "Memphis International Airport", city: "Memphis", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 35.0424, lng: -89.9767 }, timezone: "America/Chicago" },
  { iata: "BNA", name: "Nashville International Airport", city: "Nashville", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 36.1245, lng: -86.6782 }, timezone: "America/Chicago" },
  { iata: "CVG", name: "Cincinnati/Northern Kentucky International Airport", city: "Cincinnati", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 39.0488, lng: -84.6678 }, timezone: "America/New_York" },
  { iata: "CLE", name: "Cleveland Hopkins International Airport", city: "Cleveland", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 41.4117, lng: -81.8498 }, timezone: "America/New_York" },
  { iata: "CMH", name: "John Glenn Columbus International Airport", city: "Columbus", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 39.9980, lng: -82.8919 }, timezone: "America/New_York" },
  { iata: "IND", name: "Indianapolis International Airport", city: "Indianapolis", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 39.7173, lng: -86.2944 }, timezone: "America/New_York" },
  { iata: "MKE", name: "Milwaukee Mitchell International Airport", city: "Milwaukee", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 42.9472, lng: -87.8966 }, timezone: "America/Chicago" },
  { iata: "TPA", name: "Tampa International Airport", city: "Tampa", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 27.9755, lng: -82.5333 }, timezone: "America/New_York" },
  { iata: "JAX", name: "Jacksonville International Airport", city: "Jacksonville", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 30.4941, lng: -81.6879 }, timezone: "America/New_York" },
  { iata: "RDU", name: "Raleigh-Durham International Airport", city: "Raleigh", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 35.8776, lng: -78.7875 }, timezone: "America/New_York" },
  { iata: "RIC", name: "Richmond International Airport", city: "Richmond", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 37.5052, lng: -77.3197 }, timezone: "America/New_York" },
  { iata: "ORF", name: "Norfolk International Airport", city: "Norfolk", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 36.8946, lng: -76.2012 }, timezone: "America/New_York" },
  { iata: "GSO", name: "Piedmont Triad International Airport", city: "Greensboro", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 36.0978, lng: -79.9373 }, timezone: "America/New_York" },
  { iata: "CHS", name: "Charleston International Airport", city: "Charleston", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 32.8986, lng: -80.0405 }, timezone: "America/New_York" },
  { iata: "SAV", name: "Savannah/Hilton Head International Airport", city: "Savannah", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 32.1276, lng: -81.2021 }, timezone: "America/New_York" },
  { iata: "PVD", name: "T. F. Green Airport", city: "Providence", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 41.7240, lng: -71.4281 }, timezone: "America/New_York" },
  { iata: "BDL", name: "Bradley International Airport", city: "Hartford", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 41.9389, lng: -72.6831 }, timezone: "America/New_York" },
  { iata: "ALB", name: "Albany International Airport", city: "Albany", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 42.7483, lng: -73.8017 }, timezone: "America/New_York" },
  { iata: "SYR", name: "Syracuse Hancock International Airport", city: "Syracuse", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 43.1112, lng: -76.1063 }, timezone: "America/New_York" },
  { iata: "ROC", name: "Greater Rochester International Airport", city: "Rochester", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 43.1189, lng: -77.6724 }, timezone: "America/New_York" },
  { iata: "BUF", name: "Buffalo Niagara International Airport", city: "Buffalo", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 42.9405, lng: -78.7322 }, timezone: "America/New_York" },
  { iata: "PIT", name: "Pittsburgh International Airport", city: "Pittsburgh", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 40.4915, lng: -80.2329 }, timezone: "America/New_York" },

  // United States - Western States
  { iata: "ANC", name: "Ted Stevens Anchorage International Airport", city: "Anchorage", country: "United States", region: "North America", tier: "regional_hub", coordinates: { lat: 61.1740, lng: -149.9962 }, timezone: "America/Anchorage" },
  { iata: "HNL", name: "Daniel K. Inouye International Airport", city: "Honolulu", country: "United States", region: "North America", tier: "international_hub", coordinates: { lat: 21.3099, lng: -157.7826 }, timezone: "Pacific/Honolulu" },
  { iata: "OGG", name: "Kahului Airport", city: "Maui", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 20.8986, lng: -156.4297 }, timezone: "Pacific/Honolulu" },
  { iata: "KOA", name: "Ellison Onizuka Kona International Airport", city: "Kona", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 19.7388, lng: -156.0456 }, timezone: "Pacific/Honolulu" },
  { iata: "LIH", name: "Lihue Airport", city: "Lihue", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 21.9760, lng: -159.3390 }, timezone: "Pacific/Honolulu" },
  { iata: "TUS", name: "Tucson International Airport", city: "Tucson", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 32.1161, lng: -110.9410 }, timezone: "America/Phoenix" },
  { iata: "ABQ", name: "Albuquerque International Sunport", city: "Albuquerque", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 35.0402, lng: -106.6090 }, timezone: "America/Denver" },
  { iata: "ELP", name: "El Paso International Airport", city: "El Paso", country: "United States", region: "North America", tier: "regional", coordinates: { lat: 31.8072, lng: -106.3781 }, timezone: "America/Denver" },
  { iata: "SJD", name: "Los Cabos International Airport", city: "Los Cabos", country: "Mexico", region: "North America", tier: "regional_hub", coordinates: { lat: 23.1518, lng: -109.721 }, timezone: "America/Mazatlan" },
  { iata: "CUN", name: "Cancún International Airport", city: "Cancún", country: "Mexico", region: "North America", tier: "international_hub", coordinates: { lat: 21.0365, lng: -86.8770 }, timezone: "America/Cancun" },
  { iata: "PVR", name: "Licenciado Gustavo Díaz Ordaz International Airport", city: "Puerto Vallarta", country: "Mexico", region: "North America", tier: "regional_hub", coordinates: { lat: 20.6801, lng: -105.2544 }, timezone: "America/Mexico_City" },
  { iata: "ACA", name: "General Juan N. Álvarez International Airport", city: "Acapulco", country: "Mexico", region: "North America", tier: "regional", coordinates: { lat: 16.7571, lng: -99.7540 }, timezone: "America/Mexico_City" },
  { iata: "CZM", name: "Cozumel International Airport", city: "Cozumel", country: "Mexico", region: "North America", tier: "regional", coordinates: { lat: 20.5224, lng: -86.9256 }, timezone: "America/Cancun" },

  // Canada
  { iata: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada", region: "North America", tier: "international_hub", coordinates: { lat: 43.6777, lng: -79.6248 }, timezone: "America/Toronto" },
  { iata: "YUL", name: "Montréal–Pierre Elliott Trudeau International Airport", city: "Montreal", country: "Canada", region: "North America", tier: "international_hub", coordinates: { lat: 45.4706, lng: -73.7408 }, timezone: "America/Montreal" },
  { iata: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "Canada", region: "North America", tier: "international_hub", coordinates: { lat: 49.1939, lng: -123.1844 }, timezone: "America/Vancouver" },
  { iata: "YYC", name: "Calgary International Airport", city: "Calgary", country: "Canada", region: "North America", tier: "international_hub", coordinates: { lat: 51.1315, lng: -114.0108 }, timezone: "America/Edmonton" },
  { iata: "YEG", name: "Edmonton International Airport", city: "Edmonton", country: "Canada", region: "North America", tier: "regional_hub", coordinates: { lat: 53.3097, lng: -113.5801 }, timezone: "America/Edmonton" },
  { iata: "YOW", name: "Ottawa Macdonald-Cartier International Airport", city: "Ottawa", country: "Canada", region: "North America", tier: "regional_hub", coordinates: { lat: 45.3225, lng: -75.6692 }, timezone: "America/Toronto" },
  { iata: "YHZ", name: "Halifax Stanfield International Airport", city: "Halifax", country: "Canada", region: "North America", tier: "regional_hub", coordinates: { lat: 44.8808, lng: -63.5086 }, timezone: "America/Halifax" },
  { iata: "YWG", name: "Winnipeg James Armstrong Richardson International Airport", city: "Winnipeg", country: "Canada", region: "North America", tier: "regional", coordinates: { lat: 49.9100, lng: -97.2398 }, timezone: "America/Winnipeg" },
  { iata: "YQR", name: "Regina International Airport", city: "Regina", country: "Canada", region: "North America", tier: "regional", coordinates: { lat: 50.4319, lng: -104.6657 }, timezone: "America/Regina" },
  { iata: "YXS", name: "Prince George Airport", city: "Prince George", country: "Canada", region: "North America", tier: "regional", coordinates: { lat: 53.8894, lng: -122.6789 }, timezone: "America/Vancouver" },

  // Mexico
  { iata: "MEX", name: "Mexico City International Airport", city: "Mexico City", country: "Mexico", region: "North America", tier: "international_hub", coordinates: { lat: 19.4363, lng: -99.0721 }, timezone: "America/Mexico_City" },
  { iata: "GDL", name: "Don Miguel Hidalgo y Costilla International Airport", city: "Guadalajara", country: "Mexico", region: "North America", tier: "international_hub", coordinates: { lat: 20.5218, lng: -103.3107 }, timezone: "America/Mexico_City" },
  { iata: "MTY", name: "General Mariano Escobedo International Airport", city: "Monterrey", country: "Mexico", region: "North America", tier: "international_hub", coordinates: { lat: 25.7785, lng: -100.1077 }, timezone: "America/Mexico_City" },
  { iata: "TIJ", name: "General Abelardo L. Rodríguez International Airport", city: "Tijuana", country: "Mexico", region: "North America", tier: "regional_hub", coordinates: { lat: 32.5411, lng: -116.9700 }, timezone: "America/Tijuana" },
  { iata: "MZT", name: "General Rafael Buelna International Airport", city: "Mazatlán", country: "Mexico", region: "North America", tier: "regional", coordinates: { lat: 23.1614, lng: -106.2658 }, timezone: "America/Mazatlan" },
  { iata: "MID", name: "Manuel Crescencio Rejón International Airport", city: "Mérida", country: "Mexico", region: "North America", tier: "regional", coordinates: { lat: 20.9370, lng: -89.6576 }, timezone: "America/Merida" },

  // =============== LATIN AMERICA ===============

  // Brazil
  { iata: "GRU", name: "São Paulo–Guarulhos International Airport", city: "São Paulo", country: "Brazil", region: "South America", tier: "international_hub", coordinates: { lat: -23.4356, lng: -46.4731 }, timezone: "America/Sao_Paulo" },
  { iata: "CGH", name: "São Paulo–Congonhas Airport", city: "São Paulo", country: "Brazil", region: "South America", tier: "domestic", coordinates: { lat: -23.6262, lng: -46.6556 }, timezone: "America/Sao_Paulo" },
  { iata: "GIG", name: "Rio de Janeiro–Galeão International Airport", city: "Rio de Janeiro", country: "Brazil", region: "South America", tier: "international_hub", coordinates: { lat: -22.8099, lng: -43.2505 }, timezone: "America/Sao_Paulo" },
  { iata: "SDU", name: "Santos Dumont Airport", city: "Rio de Janeiro", country: "Brazil", region: "South America", tier: "domestic", coordinates: { lat: -22.9105, lng: -43.1634 }, timezone: "America/Sao_Paulo" },
  { iata: "BSB", name: "Brasília International Airport", city: "Brasília", country: "Brazil", region: "South America", tier: "international_hub", coordinates: { lat: -15.8717, lng: -47.9172 }, timezone: "America/Sao_Paulo" },
  { iata: "SSA", name: "Deputado Luís Eduardo Magalhães International Airport", city: "Salvador", country: "Brazil", region: "South America", tier: "regional_hub", coordinates: { lat: -12.9086, lng: -38.3225 }, timezone: "America/Bahia" },
  { iata: "FOR", name: "Pinto Martins International Airport", city: "Fortaleza", country: "Brazil", region: "South America", tier: "regional_hub", coordinates: { lat: -3.7763, lng: -38.5326 }, timezone: "America/Fortaleza" },
  { iata: "REC", name: "Recife/Guararapes–Gilberto Freyre International Airport", city: "Recife", country: "Brazil", region: "South America", tier: "regional_hub", coordinates: { lat: -8.1264, lng: -34.9236 }, timezone: "America/Recife" },
  { iata: "POA", name: "Salgado Filho International Airport", city: "Porto Alegre", country: "Brazil", region: "South America", tier: "regional_hub", coordinates: { lat: -29.9939, lng: -51.1711 }, timezone: "America/Sao_Paulo" },
  { iata: "CWB", name: "Afonso Pena International Airport", city: "Curitiba", country: "Brazil", region: "South America", tier: "regional", coordinates: { lat: -25.5285, lng: -49.1758 }, timezone: "America/Sao_Paulo" },
  { iata: "BEL", name: "Val de Cans International Airport", city: "Belém", country: "Brazil", region: "South America", tier: "regional", coordinates: { lat: -1.3792, lng: -48.4761 }, timezone: "America/Belem" },
  { iata: "MAO", name: "Eduardo Gomes International Airport", city: "Manaus", country: "Brazil", region: "South America", tier: "regional_hub", coordinates: { lat: -3.0386, lng: -60.0497 }, timezone: "America/Manaus" },

  // Argentina
  { iata: "EZE", name: "Ezeiza International Airport", city: "Buenos Aires", country: "Argentina", region: "South America", tier: "international_hub", coordinates: { lat: -34.8222, lng: -58.5358 }, timezone: "America/Argentina/Buenos_Aires" },
  { iata: "AEP", name: "Jorge Newbery Airfield", city: "Buenos Aires", country: "Argentina", region: "South America", tier: "domestic", coordinates: { lat: -34.5592, lng: -58.4156 }, timezone: "America/Argentina/Buenos_Aires" },
  { iata: "COR", name: "Córdoba Airport", city: "Córdoba", country: "Argentina", region: "South America", tier: "regional", coordinates: { lat: -31.3235, lng: -64.2080 }, timezone: "America/Argentina/Cordoba" },
  { iata: "MDZ", name: "Governor Francisco Gabrielli International Airport", city: "Mendoza", country: "Argentina", region: "South America", tier: "regional", coordinates: { lat: -32.8317, lng: -68.7928 }, timezone: "America/Argentina/Mendoza" },
  { iata: "IGR", name: "Cataratas del Iguazú International Airport", city: "Iguazu Falls", country: "Argentina", region: "South America", tier: "regional", coordinates: { lat: -25.7372, lng: -54.4734 }, timezone: "America/Argentina/Buenos_Aires" },
  { iata: "BRC", name: "San Carlos de Bariloche Airport", city: "Bariloche", country: "Argentina", region: "South America", tier: "regional", coordinates: { lat: -41.1512, lng: -71.1575 }, timezone: "America/Argentina/Buenos_Aires" },
  { iata: "USH", name: "Malvinas Argentinas Ushuaia International Airport", city: "Ushuaia", country: "Argentina", region: "South America", tier: "regional", coordinates: { lat: -54.8433, lng: -68.2956 }, timezone: "America/Argentina/Ushuaia" },

  // Chile
  { iata: "SCL", name: "Comodoro Arturo Merino Benítez International Airport", city: "Santiago", country: "Chile", region: "South America", tier: "international_hub", coordinates: { lat: -33.3930, lng: -70.7858 }, timezone: "America/Santiago" },
  { iata: "IPC", name: "Mataveri International Airport", city: "Easter Island", country: "Chile", region: "South America", tier: "regional", coordinates: { lat: -27.1648, lng: -109.4219 }, timezone: "Pacific/Easter" },
  { iata: "ANF", name: "Cerro Moreno International Airport", city: "Antofagasta", country: "Chile", region: "South America", tier: "regional", coordinates: { lat: -23.4445, lng: -70.4451 }, timezone: "America/Santiago" },
  { iata: "LSC", name: "La Florida Airport", city: "La Serena", country: "Chile", region: "South America", tier: "regional", coordinates: { lat: -29.9162, lng: -71.2021 }, timezone: "America/Santiago" },
  { iata: "PMC", name: "El Tepual Airport", city: "Puerto Montt", country: "Chile", region: "South America", tier: "regional", coordinates: { lat: -41.4389, lng: -73.0940 }, timezone: "America/Santiago" },
  { iata: "PUQ", name: "Presidente Carlos Ibáñez del Campo International Airport", city: "Punta Arenas", country: "Chile", region: "South America", tier: "regional", coordinates: { lat: -53.0026, lng: -70.8546 }, timezone: "America/Punta_Arenas" },

  // Peru
  { iata: "LIM", name: "Jorge Chávez International Airport", city: "Lima", country: "Peru", region: "South America", tier: "international_hub", coordinates: { lat: -12.0219, lng: -77.1143 }, timezone: "America/Lima" },
  { iata: "CUZ", name: "Alejandro Velasco Astete International Airport", city: "Cusco", country: "Peru", region: "South America", tier: "regional_hub", coordinates: { lat: -13.5358, lng: -71.9389 }, timezone: "America/Lima" },
  { iata: "AQP", name: "Alfredo Rodríguez Ballón International Airport", city: "Arequipa", country: "Peru", region: "South America", tier: "regional", coordinates: { lat: -16.3411, lng: -71.5833 }, timezone: "America/Lima" },
  { iata: "TRU", name: "Capitán FAP Carlos Martínez de Pinillos International Airport", city: "Trujillo", country: "Peru", region: "South America", tier: "regional", coordinates: { lat: -8.0814, lng: -79.1089 }, timezone: "America/Lima" },
  { iata: "PIU", name: "Capitán FAP Guillermo Concha Iberico International Airport", city: "Piura", country: "Peru", region: "South America", tier: "regional", coordinates: { lat: -5.2057, lng: -80.6164 }, timezone: "America/Lima" },

  // Colombia
  { iata: "BOG", name: "El Dorado International Airport", city: "Bogotá", country: "Colombia", region: "South America", tier: "international_hub", coordinates: { lat: 4.7016, lng: -74.1469 }, timezone: "America/Bogota" },
  { iata: "MDE", name: "José María Córdova International Airport", city: "Medellín", country: "Colombia", region: "South America", tier: "international_hub", coordinates: { lat: 6.1645, lng: -75.4231 }, timezone: "America/Bogota" },
  { iata: "CTG", name: "Rafael Núñez International Airport", city: "Cartagena", country: "Colombia", region: "South America", tier: "regional_hub", coordinates: { lat: 10.4424, lng: -75.5130 }, timezone: "America/Bogota" },
  { iata: "CLO", name: "Alfonso Bonilla Aragón International Airport", city: "Cali", country: "Colombia", region: "South America", tier: "regional_hub", coordinates: { lat: 3.5432, lng: -76.3816 }, timezone: "America/Bogota" },
  { iata: "BAQ", name: "Ernesto Cortissoz International Airport", city: "Barranquilla", country: "Colombia", region: "South America", tier: "regional", coordinates: { lat: 10.8896, lng: -74.7808 }, timezone: "America/Bogota" },
  { iata: "BGA", name: "Palonegro International Airport", city: "Bucaramanga", country: "Colombia", region: "South America", tier: "regional", coordinates: { lat: 7.1265, lng: -73.1848 }, timezone: "America/Bogota" },

  // Ecuador
  { iata: "UIO", name: "Mariscal Sucre International Airport", city: "Quito", country: "Ecuador", region: "South America", tier: "international_hub", coordinates: { lat: -0.1292, lng: -78.3575 }, timezone: "America/Guayaquil" },
  { iata: "GYE", name: "José Joaquín de Olmedo International Airport", city: "Guayaquil", country: "Ecuador", region: "South America", tier: "international_hub", coordinates: { lat: -2.1576, lng: -79.8836 }, timezone: "America/Guayaquil" },
  { iata: "GPS", name: "Seymour Airport", city: "Galápagos", country: "Ecuador", region: "South America", tier: "regional", coordinates: { lat: -0.4536, lng: -90.2658 }, timezone: "Pacific/Galapagos" },

  // Venezuela
  { iata: "CCS", name: "Simón Bolívar International Airport", city: "Caracas", country: "Venezuela", region: "South America", tier: "international_hub", coordinates: { lat: 10.6013, lng: -66.9911 }, timezone: "America/Caracas" },
  { iata: "MAR", name: "La Chinita International Airport", city: "Maracaibo", country: "Venezuela", region: "South America", tier: "regional", coordinates: { lat: 10.5582, lng: -71.7279 }, timezone: "America/Caracas" },
  { iata: "VLN", name: "Arturo Michelena International Airport", city: "Valencia", country: "Venezuela", region: "South America", tier: "regional", coordinates: { lat: 10.1497, lng: -67.9284 }, timezone: "America/Caracas" },

  // Other South America
  { iata: "MVD", name: "Carrasco International Airport", city: "Montevideo", country: "Uruguay", region: "South America", tier: "regional_hub", coordinates: { lat: -34.8384, lng: -56.0308 }, timezone: "America/Montevideo" },
  { iata: "ASU", name: "Silvio Pettirossi International Airport", city: "Asunción", country: "Paraguay", region: "South America", tier: "regional_hub", coordinates: { lat: -25.2400, lng: -57.5199 }, timezone: "America/Asuncion" },
  { iata: "VVI", name: "Viru Viru International Airport", city: "Santa Cruz", country: "Bolivia", region: "South America", tier: "regional_hub", coordinates: { lat: -17.6448, lng: -63.1353 }, timezone: "America/La_Paz" },
  { iata: "LPB", name: "El Alto International Airport", city: "La Paz", country: "Bolivia", region: "South America", tier: "regional_hub", coordinates: { lat: -16.5133, lng: -68.1925 }, timezone: "America/La_Paz" },
  { iata: "GEO", name: "Cheddi Jagan International Airport", city: "Georgetown", country: "Guyana", region: "South America", tier: "regional", coordinates: { lat: 6.4985, lng: -58.2543 }, timezone: "America/Guyana" },
  { iata: "PBM", name: "Johan Adolf Pengel International Airport", city: "Paramaribo", country: "Suriname", region: "South America", tier: "regional", coordinates: { lat: 5.4527, lng: -55.1878 }, timezone: "America/Paramaribo" },
  { iata: "CAY", name: "Félix Eboué Airport", city: "Cayenne", country: "French Guiana", region: "South America", tier: "regional", coordinates: { lat: 4.8220, lng: -52.3605 }, timezone: "America/Cayenne" },

  // Central America & Caribbean
  { iata: "PTY", name: "Tocumen International Airport", city: "Panama City", country: "Panama", region: "Central America", tier: "international_hub", coordinates: { lat: 9.0714, lng: -79.3835 }, timezone: "America/Panama" },
  { iata: "SJO", name: "Juan Santamaría International Airport", city: "San José", country: "Costa Rica", region: "Central America", tier: "international_hub", coordinates: { lat: 9.9937, lng: -84.2089 }, timezone: "America/Costa_Rica" },
  { iata: "GUA", name: "La Aurora International Airport", city: "Guatemala City", country: "Guatemala", region: "Central America", tier: "regional_hub", coordinates: { lat: 14.5833, lng: -90.5275 }, timezone: "America/Guatemala" },
  { iata: "SAL", name: "Monseñor Óscar Arnulfo Romero International Airport", city: "San Salvador", country: "El Salvador", region: "Central America", tier: "regional_hub", coordinates: { lat: 13.4409, lng: -89.0556 }, timezone: "America/El_Salvador" },
  { iata: "TGU", name: "Toncontín International Airport", city: "Tegucigalpa", country: "Honduras", region: "Central America", tier: "regional", coordinates: { lat: 14.0608, lng: -87.2072 }, timezone: "America/Tegucigalpa" },
  { iata: "MGA", name: "Augusto C. Sandino International Airport", city: "Managua", country: "Nicaragua", region: "Central America", tier: "regional_hub", coordinates: { lat: 12.1415, lng: -86.1682 }, timezone: "America/Managua" },
  { iata: "BZE", name: "Philip S. W. Goldson International Airport", city: "Belize City", country: "Belize", region: "Central America", tier: "regional", coordinates: { lat: 17.5394, lng: -88.3083 }, timezone: "America/Belize" },

  // Caribbean
  { iata: "NAS", name: "Lynden Pindling International Airport", city: "Nassau", country: "Bahamas", region: "Caribbean", tier: "international_hub", coordinates: { lat: 25.0390, lng: -77.4662 }, timezone: "America/Nassau" },
  { iata: "HAV", name: "José Martí International Airport", city: "Havana", country: "Cuba", region: "Caribbean", tier: "international_hub", coordinates: { lat: 22.9892, lng: -82.4091 }, timezone: "America/Havana" },
  { iata: "KIN", name: "Norman Manley International Airport", city: "Kingston", country: "Jamaica", region: "Caribbean", tier: "international_hub", coordinates: { lat: 17.9357, lng: -76.7875 }, timezone: "America/Jamaica" },
  { iata: "MBJ", name: "Sangster International Airport", city: "Montego Bay", country: "Jamaica", region: "Caribbean", tier: "regional_hub", coordinates: { lat: 18.5037, lng: -77.9134 }, timezone: "America/Jamaica" },
  { iata: "SJU", name: "Luis Muñoz Marín International Airport", city: "San Juan", country: "Puerto Rico", region: "Caribbean", tier: "international_hub", coordinates: { lat: 18.4374, lng: -66.0018 }, timezone: "America/Puerto_Rico" },
  { iata: "SDQ", name: "Las Américas International Airport", city: "Santo Domingo", country: "Dominican Republic", region: "Caribbean", tier: "international_hub", coordinates: { lat: 18.4297, lng: -69.6689 }, timezone: "America/Santo_Domingo" },
  { iata: "POP", name: "Gregorio Luperón International Airport", city: "Puerto Plata", country: "Dominican Republic", region: "Caribbean", tier: "regional_hub", coordinates: { lat: 19.7579, lng: -70.5702 }, timezone: "America/Santo_Domingo" },
  { iata: "PTP", name: "Pointe-à-Pitre International Airport", city: "Pointe-à-Pitre", country: "Guadeloupe", region: "Caribbean", tier: "regional_hub", coordinates: { lat: 16.2653, lng: -61.5316 }, timezone: "America/Guadeloupe" },
  { iata: "FDF", name: "Martinique Aimé Césaire International Airport", city: "Fort-de-France", country: "Martinique", region: "Caribbean", tier: "regional_hub", coordinates: { lat: 14.5912, lng: -61.0031 }, timezone: "America/Martinique" },
  { iata: "BGI", name: "Grantley Adams International Airport", city: "Bridgetown", country: "Barbados", region: "Caribbean", tier: "regional_hub", coordinates: { lat: 13.0747, lng: -59.4925 }, timezone: "America/Barbados" },
  { iata: "POS", name: "Piarco International Airport", city: "Port of Spain", country: "Trinidad and Tobago", region: "Caribbean", tier: "regional_hub", coordinates: { lat: 10.5954, lng: -61.3372 }, timezone: "America/Port_of_Spain" },
  { iata: "CUR", name: "Curaçao International Airport", city: "Willemstad", country: "Curaçao", region: "Caribbean", tier: "regional_hub", coordinates: { lat: 12.1889, lng: -68.9598 }, timezone: "America/Curacao" },
  { iata: "AUA", name: "Queen Beatrix International Airport", city: "Oranjestad", country: "Aruba", region: "Caribbean", tier: "regional_hub", coordinates: { lat: 12.5014, lng: -70.0152 }, timezone: "America/Aruba" },
  { iata: "SXM", name: "Princess Juliana International Airport", city: "Philipsburg", country: "Sint Maarten", region: "Caribbean", tier: "regional", coordinates: { lat: 18.0409, lng: -63.1089 }, timezone: "America/Lower_Princes" },

  // =============== AFRICA ===============

  // South Africa
  { iata: "JNB", name: "O. R. Tambo International Airport", city: "Johannesburg", country: "South Africa", region: "Africa", tier: "international_hub", coordinates: { lat: -26.1392, lng: 28.2460 }, timezone: "Africa/Johannesburg" },
  { iata: "CPT", name: "Cape Town International Airport", city: "Cape Town", country: "South Africa", region: "Africa", tier: "international_hub", coordinates: { lat: -33.9648, lng: 18.6017 }, timezone: "Africa/Johannesburg" },
  { iata: "DUR", name: "King Shaka International Airport", city: "Durban", country: "South Africa", region: "Africa", tier: "regional_hub", coordinates: { lat: -29.6144, lng: 31.1197 }, timezone: "Africa/Johannesburg" },
  { iata: "PLZ", name: "Port Elizabeth Airport", city: "Port Elizabeth", country: "South Africa", region: "Africa", tier: "regional", coordinates: { lat: -33.9849, lng: 25.6173 }, timezone: "Africa/Johannesburg" },
  { iata: "BFN", name: "Bram Fischer International Airport", city: "Bloemfontein", country: "South Africa", region: "Africa", tier: "regional", coordinates: { lat: -29.0927, lng: 26.3023 }, timezone: "Africa/Johannesburg" },

  // Egypt
  { iata: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egypt", region: "Africa", tier: "international_hub", coordinates: { lat: 30.1219, lng: 31.4056 }, timezone: "Africa/Cairo" },
  { iata: "HRG", name: "Hurghada International Airport", city: "Hurghada", country: "Egypt", region: "Africa", tier: "regional_hub", coordinates: { lat: 27.1783, lng: 33.7994 }, timezone: "Africa/Cairo" },
  { iata: "SSH", name: "Sharm el-Sheikh International Airport", city: "Sharm el-Sheikh", country: "Egypt", region: "Africa", tier: "regional_hub", coordinates: { lat: 27.9773, lng: 34.3950 }, timezone: "Africa/Cairo" },
  { iata: "LXR", name: "Luxor International Airport", city: "Luxor", country: "Egypt", region: "Africa", tier: "regional", coordinates: { lat: 25.6710, lng: 32.7067 }, timezone: "Africa/Cairo" },
  { iata: "ALY", name: "Alexandria International Airport", city: "Alexandria", country: "Egypt", region: "Africa", tier: "regional", coordinates: { lat: 31.1840, lng: 29.9488 }, timezone: "Africa/Cairo" },

  // Morocco
  { iata: "CMN", name: "Mohammed V International Airport", city: "Casablanca", country: "Morocco", region: "Africa", tier: "international_hub", coordinates: { lat: 33.3675, lng: -7.5898 }, timezone: "Africa/Casablanca" },
  { iata: "RAK", name: "Marrakech Menara Airport", city: "Marrakech", country: "Morocco", region: "Africa", tier: "regional_hub", coordinates: { lat: 31.6069, lng: -8.0363 }, timezone: "Africa/Casablanca" },
  { iata: "RBA", name: "Rabat–Salé Airport", city: "Rabat", country: "Morocco", region: "Africa", tier: "regional", coordinates: { lat: 34.0515, lng: -6.7515 }, timezone: "Africa/Casablanca" },
  { iata: "FEZ", name: "Fès–Saïs Airport", city: "Fez", country: "Morocco", region: "Africa", tier: "regional", coordinates: { lat: 33.9273, lng: -4.9778 }, timezone: "Africa/Casablanca" },
  { iata: "AGA", name: "Agadir–Al Massira Airport", city: "Agadir", country: "Morocco", region: "Africa", tier: "regional", coordinates: { lat: 30.3811, lng: -9.5463 }, timezone: "Africa/Casablanca" },
  { iata: "TNG", name: "Ibn Batouta Airport", city: "Tangier", country: "Morocco", region: "Africa", tier: "regional", coordinates: { lat: 35.7269, lng: -5.9169 }, timezone: "Africa/Casablanca" },

  // Kenya
  { iata: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "Kenya", region: "Africa", tier: "international_hub", coordinates: { lat: -1.3192, lng: 36.9278 }, timezone: "Africa/Nairobi" },
  { iata: "MBA", name: "Moi International Airport", city: "Mombasa", country: "Kenya", region: "Africa", tier: "regional_hub", coordinates: { lat: -4.0348, lng: 39.5942 }, timezone: "Africa/Nairobi" },
  { iata: "KIS", name: "Kisumu Airport", city: "Kisumu", country: "Kenya", region: "Africa", tier: "regional", coordinates: { lat: -0.0862, lng: 34.7289 }, timezone: "Africa/Nairobi" },
  { iata: "ELD", name: "Eldoret International Airport", city: "Eldoret", country: "Kenya", region: "Africa", tier: "regional", coordinates: { lat: 0.4045, lng: 35.2389 }, timezone: "Africa/Nairobi" },

  // Nigeria
  { iata: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", country: "Nigeria", region: "Africa", tier: "international_hub", coordinates: { lat: 6.5774, lng: 3.3212 }, timezone: "Africa/Lagos" },
  { iata: "ABV", name: "Nnamdi Azikiwe International Airport", city: "Abuja", country: "Nigeria", region: "Africa", tier: "international_hub", coordinates: { lat: 9.0068, lng: 7.2637 }, timezone: "Africa/Lagos" },
  { iata: "KAN", name: "Mallam Aminu Kano International Airport", city: "Kano", country: "Nigeria", region: "Africa", tier: "regional_hub", coordinates: { lat: 12.0476, lng: 8.5246 }, timezone: "Africa/Lagos" },
  { iata: "PHC", name: "Port Harcourt International Airport", city: "Port Harcourt", country: "Nigeria", region: "Africa", tier: "regional", coordinates: { lat: 5.0155, lng: 6.9496 }, timezone: "Africa/Lagos" },
  { iata: "CBQ", name: "Margaret Ekpo International Airport", city: "Calabar", country: "Nigeria", region: "Africa", tier: "regional", coordinates: { lat: 4.9760, lng: 8.3472 }, timezone: "Africa/Lagos" },

  // Ethiopia
  { iata: "ADD", name: "Addis Ababa Bole International Airport", city: "Addis Ababa", country: "Ethiopia", region: "Africa", tier: "international_hub", coordinates: { lat: 8.9778, lng: 38.7997 }, timezone: "Africa/Addis_Ababa" },
  { iata: "BJR", name: "Bahir Dar Airport", city: "Bahir Dar", country: "Ethiopia", region: "Africa", tier: "regional", coordinates: { lat: 11.6081, lng: 37.3216 }, timezone: "Africa/Addis_Ababa" },
  { iata: "MQX", name: "Mekelle Airport", city: "Mekelle", country: "Ethiopia", region: "Africa", tier: "regional", coordinates: { lat: 13.4673, lng: 39.5335 }, timezone: "Africa/Addis_Ababa" },

  // Tanzania
  { iata: "DAR", name: "Julius Nyerere International Airport", city: "Dar es Salaam", country: "Tanzania", region: "Africa", tier: "international_hub", coordinates: { lat: -6.8781, lng: 39.2026 }, timezone: "Africa/Dar_es_Salaam" },
  { iata: "JRO", name: "Kilimanjaro International Airport", city: "Kilimanjaro", country: "Tanzania", region: "Africa", tier: "regional_hub", coordinates: { lat: -3.4299, lng: 37.0745 }, timezone: "Africa/Dar_es_Salaam" },
  { iata: "ZNZ", name: "Abeid Amani Karume International Airport", city: "Zanzibar", country: "Tanzania", region: "Africa", tier: "regional_hub", coordinates: { lat: -6.2220, lng: 39.2249 }, timezone: "Africa/Dar_es_Salaam" },
  { iata: "DOD", name: "Dodoma Airport", city: "Dodoma", country: "Tanzania", region: "Africa", tier: "regional", coordinates: { lat: -6.1704, lng: 35.7527 }, timezone: "Africa/Dar_es_Salaam" },

  // Ghana
  { iata: "ACC", name: "Kotoka International Airport", city: "Accra", country: "Ghana", region: "Africa", tier: "international_hub", coordinates: { lat: 5.6052, lng: -0.1668 }, timezone: "Africa/Accra" },
  { iata: "KMS", name: "Kumasi Airport", city: "Kumasi", country: "Ghana", region: "Africa", tier: "regional", coordinates: { lat: 6.7145, lng: -1.5903 }, timezone: "Africa/Accra" },
  { iata: "TML", name: "Tamale Airport", city: "Tamale", country: "Ghana", region: "Africa", tier: "regional", coordinates: { lat: 9.5572, lng: -0.8632 }, timezone: "Africa/Accra" },

  // Other African Countries
  { iata: "ALG", name: "Houari Boumediene Airport", city: "Algiers", country: "Algeria", region: "Africa", tier: "international_hub", coordinates: { lat: 36.6911, lng: 3.2155 }, timezone: "Africa/Algiers" },
  { iata: "TUN", name: "Tunis–Carthage International Airport", city: "Tunis", country: "Tunisia", region: "Africa", tier: "international_hub", coordinates: { lat: 36.8510, lng: 10.2272 }, timezone: "Africa/Tunis" },
  { iata: "TIP", name: "Tripoli International Airport", city: "Tripoli", country: "Libya", region: "Africa", tier: "regional_hub", coordinates: { lat: 32.6635, lng: 13.1590 }, timezone: "Africa/Tripoli" },
  { iata: "KRT", name: "Khartoum International Airport", city: "Khartoum", country: "Sudan", region: "Africa", tier: "regional_hub", coordinates: { lat: 15.5895, lng: 32.5532 }, timezone: "Africa/Khartoum" },
  { iata: "UGA", name: "Entebbe International Airport", city: "Entebbe", country: "Uganda", region: "Africa", tier: "regional_hub", coordinates: { lat: 0.0424, lng: 32.4435 }, timezone: "Africa/Kampala" },
  { iata: "KGL", name: "Kigali International Airport", city: "Kigali", country: "Rwanda", region: "Africa", tier: "regional_hub", coordinates: { lat: -1.9686, lng: 30.1395 }, timezone: "Africa/Kigali" },
  { iata: "BJM", name: "Bujumbura International Airport", city: "Bujumbura", country: "Burundi", region: "Africa", tier: "regional", coordinates: { lat: -3.3240, lng: 29.3185 }, timezone: "Africa/Bujumbura" },
  { iata: "LUN", name: "Kenneth Kaunda International Airport", city: "Lusaka", country: "Zambia", region: "Africa", tier: "regional_hub", coordinates: { lat: -15.3281, lng: 28.4526 }, timezone: "Africa/Lusaka" },
  { iata: "HRE", name: "Robert Gabriel Mugabe International Airport", city: "Harare", country: "Zimbabwe", region: "Africa", tier: "regional_hub", coordinates: { lat: -17.9318, lng: 31.0928 }, timezone: "Africa/Harare" },
  { iata: "BUL", name: "Joshua Mqabuko Nkomo International Airport", city: "Bulawayo", country: "Zimbabwe", region: "Africa", tier: "regional", coordinates: { lat: -20.0175, lng: 28.6179 }, timezone: "Africa/Harare" },
  { iata: "WDH", name: "Hosea Kutako International Airport", city: "Windhoek", country: "Namibia", region: "Africa", tier: "regional_hub", coordinates: { lat: -22.4799, lng: 17.4709 }, timezone: "Africa/Windhoek" },
  { iata: "GBE", name: "Sir Seretse Khama International Airport", city: "Gaborone", country: "Botswana", region: "Africa", tier: "regional", coordinates: { lat: -24.5552, lng: 25.9182 }, timezone: "Africa/Gaborone" },
  { iata: "MPM", name: "Maputo International Airport", city: "Maputo", country: "Mozambique", region: "Africa", tier: "regional_hub", coordinates: { lat: -25.9208, lng: 32.5726 }, timezone: "Africa/Maputo" },
  { iata: "MSU", name: "Maseru Airport", city: "Maseru", country: "Lesotho", region: "Africa", tier: "regional", coordinates: { lat: -29.4625, lng: 27.5525 }, timezone: "Africa/Maseru" },
  { iata: "MTS", name: "King Mswati III International Airport", city: "Manzini", country: "Eswatini", region: "Africa", tier: "regional", coordinates: { lat: -26.5289, lng: 31.3076 }, timezone: "Africa/Mbabane" },
  { iata: "MRU", name: "Sir Seewoosagur Ramgoolam International Airport", city: "Port Louis", country: "Mauritius", region: "Africa", tier: "regional_hub", coordinates: { lat: -20.4302, lng: 57.6836 }, timezone: "Indian/Mauritius" },
  { iata: "SEZ", name: "Seychelles International Airport", city: "Victoria", country: "Seychelles", region: "Africa", tier: "regional", coordinates: { lat: -4.6743, lng: 55.5218 }, timezone: "Indian/Mahe" },
  { iata: "TNR", name: "Ivato Airport", city: "Antananarivo", country: "Madagascar", region: "Africa", tier: "regional_hub", coordinates: { lat: -18.7969, lng: 47.4788 }, timezone: "Indian/Antananarivo" },
  { iata: "NOS", name: "Fascene Airport", city: "Nosy Be", country: "Madagascar", region: "Africa", tier: "regional", coordinates: { lat: -13.3121, lng: 48.3149 }, timezone: "Indian/Antananarivo" },

  // Pacific Islands
  { iata: "NAN", name: "Nadi International Airport", city: "Nadi", country: "Fiji", region: "Oceania", tier: "regional_hub", coordinates: { lat: -17.7554, lng: 177.4434 }, timezone: "Pacific/Fiji" },
  { iata: "SUV", name: "Nausori Airport", city: "Suva", country: "Fiji", region: "Oceania", tier: "regional", coordinates: { lat: -18.0433, lng: 178.5592 }, timezone: "Pacific/Fiji" },
  { iata: "NOU", name: "La Tontouta International Airport", city: "Nouméa", country: "New Caledonia", region: "Oceania", tier: "regional", coordinates: { lat: -22.0146, lng: 166.2130 }, timezone: "Pacific/Noumea" },
  { iata: "PPT", name: "Tahiti Faa'a International Airport", city: "Papeete", country: "French Polynesia", region: "Oceania", tier: "regional_hub", coordinates: { lat: -17.5537, lng: -149.6070 }, timezone: "Pacific/Tahiti" },
  { iata: "BOB", name: "Bora Bora Airport", city: "Bora Bora", country: "French Polynesia", region: "Oceania", tier: "regional", coordinates: { lat: -16.4844, lng: -151.7511 }, timezone: "Pacific/Tahiti" },
  { iata: "APW", name: "Faleolo International Airport", city: "Apia", country: "Samoa", region: "Oceania", tier: "regional", coordinates: { lat: -13.8300, lng: -172.0083 }, timezone: "Pacific/Apia" },
  { iata: "TBU", name: "Fuaʻamotu International Airport", city: "Nuku'alofa", country: "Tonga", region: "Oceania", tier: "regional", coordinates: { lat: -21.2417, lng: -175.1497 }, timezone: "Pacific/Tongatapu" },
  { iata: "VLI", name: "Bauerfield International Airport", city: "Port Vila", country: "Vanuatu", region: "Oceania", tier: "regional", coordinates: { lat: -17.6993, lng: 168.3197 }, timezone: "Pacific/Efate" },
  { iata: "HIR", name: "Honiara International Airport", city: "Honiara", country: "Solomon Islands", region: "Oceania", tier: "regional", coordinates: { lat: -9.4280, lng: 160.0549 }, timezone: "Pacific/Guadalcanal" },
  { iata: "POM", name: "Jacksons International Airport", city: "Port Moresby", country: "Papua New Guinea", region: "Oceania", tier: "regional_hub", coordinates: { lat: -9.4439, lng: 147.2200 }, timezone: "Pacific/Port_Moresby" },
  { iata: "GUM", name: "Antonio B. Won Pat International Airport", city: "Hagåtña", country: "Guam", region: "Oceania", tier: "regional_hub", coordinates: { lat: 13.4834, lng: 144.7960 }, timezone: "Pacific/Guam" },
  { iata: "SPN", name: "Francisco C. Ada/Saipan International Airport", city: "Saipan", country: "Northern Mariana Islands", region: "Oceania", tier: "regional", coordinates: { lat: 15.1190, lng: 145.7297 }, timezone: "Pacific/Saipan" },
  { iata: "MAJ", name: "Marshall Islands International Airport", city: "Majuro", country: "Marshall Islands", region: "Oceania", tier: "regional", coordinates: { lat: 7.0647, lng: 171.2720 }, timezone: "Pacific/Majuro" },
  { iata: "TRW", name: "Chuuk International Airport", city: "Weno", country: "Micronesia", region: "Oceania", tier: "regional", coordinates: { lat: 7.4619, lng: 151.8430 }, timezone: "Pacific/Chuuk" },
  { iata: "PNI", name: "Pohnpei International Airport", city: "Kolonia", country: "Micronesia", region: "Oceania", tier: "regional", coordinates: { lat: 6.9851, lng: 158.2089 }, timezone: "Pacific/Ponape" },
  { iata: "ROR", name: "Palau International Airport", city: "Koror", country: "Palau", region: "Oceania", tier: "regional", coordinates: { lat: 7.3673, lng: 134.5442 }, timezone: "Pacific/Palau" },
  { iata: "YAP", name: "Yap International Airport", city: "Yap", country: "Micronesia", region: "Oceania", tier: "regional", coordinates: { lat: 9.4991, lng: 138.0827 }, timezone: "Pacific/Yap" },
  { iata: "KSA", name: "Kosrae International Airport", city: "Kosrae", country: "Micronesia", region: "Oceania", tier: "regional", coordinates: { lat: 5.3567, lng: 162.9584 }, timezone: "Pacific/Kosrae" }
];

// Search utilities for enhanced airport lookup
export const searchAirports = (query: string, limit: number = 10): Airport[] => {
  if (!query || query.length < 2) return [];

  const searchTerm = query.toLowerCase().trim();
  const results: { airport: Airport; score: number }[] = [];

  for (const airport of AIRPORTS) {
    let score = 0;

    // Exact IATA match gets highest priority
    if (airport.iata.toLowerCase() === searchTerm) {
      score += 1000;
    } else if (airport.iata.toLowerCase().startsWith(searchTerm)) {
      score += 500;
    }

    // Airport name matching
    const nameWords = airport.name.toLowerCase().split(/\s+/);
    const queryWords = searchTerm.split(/\s+/);

    for (const queryWord of queryWords) {
      for (const nameWord of nameWords) {
        if (nameWord.startsWith(queryWord)) {
          score += queryWord.length === nameWord.length ? 100 : 50;
        } else if (nameWord.includes(queryWord)) {
          score += 25;
        }
      }
    }

    // City matching
    if (airport.city.toLowerCase().includes(searchTerm)) {
      score += airport.city.toLowerCase() === searchTerm ? 200 : 75;
    }

    // Country matching
    if (airport.country.toLowerCase().includes(searchTerm)) {
      score += airport.country.toLowerCase() === searchTerm ? 150 : 50;
    }

    // Search aliases matching (if defined)
    if (airport.searchAliases) {
      for (const alias of airport.searchAliases) {
        if (alias.toLowerCase().includes(searchTerm)) {
          score += 40;
        }
      }
    }

    // Boost scores for international hubs and major airports
    if (airport.tier === 'international_hub') {
      score *= 1.2;
    } else if (airport.tier === 'regional_hub') {
      score *= 1.1;
    }

    if (score > 0) {
      results.push({ airport, score });
    }
  }

  // Sort by score and return top results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => result.airport);
};

// Get airports by region
export const getAirportsByRegion = (region: string): Airport[] => {
  return AIRPORTS.filter(airport => airport.region === region);
};

// Get airports by country
export const getAirportsByCountry = (country: string): Airport[] => {
  return AIRPORTS.filter(airport =>
    airport.country.toLowerCase() === country.toLowerCase()
  );
};

// Get airports by tier (international_hub, regional_hub, domestic, regional)
export const getAirportsByTier = (tier: Airport['tier']): Airport[] => {
  return AIRPORTS.filter(airport => airport.tier === tier);
};

// Get airport by IATA code
export const getAirportByIATA = (iata: string): Airport | undefined => {
  return AIRPORTS.find(airport =>
    airport.iata.toLowerCase() === iata.toLowerCase()
  );
};

// Get popular airports (international hubs and major regional hubs)
export const getPopularAirports = (): Airport[] => {
  return AIRPORTS.filter(airport =>
    airport.tier === 'international_hub' ||
    (airport.tier === 'regional_hub' && ['SYD', 'MEL', 'BNE', 'AKL', 'LHR', 'CDG', 'AMS', 'FRA', 'MUC', 'MAD', 'BCN', 'MAN', 'DUB', 'ARN', 'CPH', 'OSL', 'HEL'].includes(airport.iata))
  ).slice(0, 50);
};

// Statistics
export const getAirportStats = () => {
  const stats = {
    total: AIRPORTS.length,
    byRegion: {} as Record<string, number>,
    byTier: {} as Record<string, number>,
    byCountry: {} as Record<string, number>
  };

  for (const airport of AIRPORTS) {
    // By region
    if (airport.region) {
      stats.byRegion[airport.region] = (stats.byRegion[airport.region] || 0) + 1;
    }

    // By tier
    if (airport.tier) {
      stats.byTier[airport.tier] = (stats.byTier[airport.tier] || 0) + 1;
    }

    // By country
    stats.byCountry[airport.country] = (stats.byCountry[airport.country] || 0) + 1;
  }

  return stats;
};
