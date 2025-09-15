#!/usr/bin/env node

/**
 * MAKU.Travel Gemini CLI Helper Scripts
 * Provides common CLI operations for travel content generation
 */

const { execSync } = require('child_process');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key') {
  console.error('❌ Error: VITE_GEMINI_API_KEY not configured in .env file');
  console.log('💡 Please set your Gemini API key in the .env file');
  process.exit(1);
}

const runGeminiCommand = (prompt, options = {}) => {
  const command = `npx gemini-cli "${prompt}" --api-key="${GEMINI_API_KEY}" ${Object.entries(options).map(([key, value]) => `--${key}="${value}"`).join(' ')}`;
  
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return output.trim();
  } catch (error) {
    console.error('❌ Gemini CLI Error:', error.message);
    return null;
  }
};

// Command handlers
const commands = {
  'generate-destination': (destination) => {
    const prompt = `Create a compelling travel destination description for ${destination}. Include key attractions, best time to visit, local cuisine highlights, and cultural experiences. Format as markdown with sections for MAKU.Travel platform.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'create-itinerary': (destination, days) => {
    const prompt = `Create a detailed ${days}-day itinerary for ${destination}. Include daily activities, recommended restaurants, transportation tips, and estimated costs. Format as a structured markdown guide optimized for MAKU.Travel booking integration.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'generate-hotel-desc': (hotelName, location) => {
    const prompt = `Write an engaging hotel description for ${hotelName} in ${location}. Focus on amenities, location advantages, nearby attractions, and guest experience. Keep it professional and appealing for MAKU.Travel booking platform.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'travel-tips': (destination) => {
    const prompt = `Provide essential travel tips for ${destination}. Include local customs, transportation options, safety advice, currency/payment info, language basics, and insider recommendations. Format as practical bullet points for MAKU.Travel users.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'flight-search-tips': (origin, destination, dateRange) => {
    const prompt = `Generate flight search optimization tips for ${origin} to ${destination} during ${dateRange}. Include best booking times, price alerts, alternative airports, and seasonal considerations. Format for MAKU.Travel flight search enhancement.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'activity-recommendations': (destination, interests, budget) => {
    const prompt = `Recommend activities and experiences in ${destination} for travelers interested in ${interests} with a ${budget} budget. Include booking tips, duration estimates, and integration opportunities for MAKU.Travel platform.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'customer-service-response': (scenario, tone = 'helpful') => {
    const prompt = `Generate a ${tone} customer service response for this travel booking scenario: ${scenario}. Follow MAKU.Travel brand voice guidelines and include actionable next steps.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'marketing-content': (type, destination, audience = 'general') => {
    const prompt = `Create ${type} marketing content for ${destination} targeting ${audience} audience. Align with MAKU.Travel brand positioning and include call-to-action for bookings.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'test-prompt': (promptText, context = '') => {
    const prompt = `Test this travel AI prompt for MAKU.Travel: "${promptText}". Context: ${context}. Provide response quality assessment and improvement suggestions.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'batch-destinations': (destinationList) => {
    const destinations = destinationList.split(',').map(d => d.trim());
    console.log(`🚀 Generating content for ${destinations.length} destinations...`);
    
    const results = [];
    destinations.forEach((destination, index) => {
      console.log(`\n📍 Processing ${index + 1}/${destinations.length}: ${destination}`);
      const result = commands['generate-destination'](destination);
      if (result) {
        results.push(`## ${destination}\n\n${result}`);
      }
    });
    
    return results.join('\n\n---\n\n');
  }
};

// CLI interface
const [,, command, ...args] = process.argv;

if (!command || !commands[command]) {
  console.log(`
🛫 MAKU.Travel Gemini CLI Helper

Available commands:
  generate-destination <destination>                    - Create destination description
  create-itinerary <destination> <days>                - Generate travel itinerary  
  generate-hotel-desc <name> <location>                - Write hotel description
  travel-tips <destination>                            - Get travel tips and advice
  flight-search-tips <origin> <destination> <dates>   - Flight booking optimization
  activity-recommendations <dest> <interests> <budget> - Activity suggestions
  customer-service-response <scenario> [tone]          - Customer support templates
  marketing-content <type> <destination> [audience]    - Marketing content generation
  test-prompt <prompt> [context]                       - Test AI prompt quality
  batch-destinations <destination1,destination2,...>   - Bulk destination content

Examples:
  node scripts/gemini-cli.js generate-destination "Tokyo, Japan"
  node scripts/gemini-cli.js create-itinerary "Paris" "5"
  node scripts/gemini-cli.js flight-search-tips "Sydney" "Tokyo" "December 2025"
  node scripts/gemini-cli.js activity-recommendations "Bali" "adventure,culture" "moderate"
  node scripts/gemini-cli.js batch-destinations "Tokyo,Paris,Bali,Sydney"
  `);
  process.exit(0);
}

// Execute command
console.log(`🚀 Running ${command}...`);
const result = commands[command](...args);

if (result) {
  console.log('\n✅ Generated Content:\n');
  console.log(result);
} else {
  console.log('❌ Failed to generate content');
  process.exit(1);
}