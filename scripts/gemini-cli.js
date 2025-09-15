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
    const prompt = `Create a compelling travel destination description for ${destination}. Include key attractions, best time to visit, local cuisine highlights, and cultural experiences. Format as markdown with sections.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'create-itinerary': (destination, days) => {
    const prompt = `Create a detailed ${days}-day itinerary for ${destination}. Include daily activities, recommended restaurants, transportation tips, and estimated costs. Format as a structured markdown guide.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'generate-hotel-desc': (hotelName, location) => {
    const prompt = `Write an engaging hotel description for ${hotelName} in ${location}. Focus on amenities, location advantages, nearby attractions, and guest experience. Keep it professional and appealing for travel booking.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  },

  'travel-tips': (destination) => {
    const prompt = `Provide essential travel tips for ${destination}. Include local customs, transportation options, safety advice, currency/payment info, language basics, and insider recommendations. Format as practical bullet points.`;
    return runGeminiCommand(prompt, { model: 'gemini-pro' });
  }
};

// CLI interface
const [,, command, ...args] = process.argv;

if (!command || !commands[command]) {
  console.log(`
🛫 MAKU.Travel Gemini CLI Helper

Available commands:
  generate-destination <destination>     - Create destination description
  create-itinerary <destination> <days>  - Generate travel itinerary  
  generate-hotel-desc <name> <location>  - Write hotel description
  travel-tips <destination>              - Get travel tips and advice

Examples:
  node scripts/gemini-cli.js generate-destination "Tokyo, Japan"
  node scripts/gemini-cli.js create-itinerary "Paris" "5"
  node scripts/gemini-cli.js travel-tips "Bali, Indonesia"
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