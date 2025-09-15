#!/usr/bin/env node

/**
 * MAKU.Travel Prompt Templates Library
 * Standardized prompt templates for consistent travel content generation
 */

const MAKU_BRAND_CONTEXT = `
MAKU.Travel is a premium travel booking platform offering flights, hotels, and activities.
Brand Voice: Professional, helpful, inspiring, and trustworthy.
Target Audience: Modern travelers seeking seamless booking experiences.
Key Values: Reliability, personalization, and exceptional service.
`;

const TRAVEL_PROMPT_TEMPLATES = {
  // Destination Content Templates
  DESTINATION_OVERVIEW: {
    name: 'Destination Overview',
    template: (destination) => `
${MAKU_BRAND_CONTEXT}

Create a compelling destination overview for ${destination} for the MAKU.Travel platform.

Structure:
1. **Destination Highlight** (2-3 sentences capturing the essence)
2. **Top Attractions** (5-7 must-see places with brief descriptions)
3. **Best Time to Visit** (seasonal recommendations with weather context)
4. **Local Cuisine** (signature dishes and dining experiences)
5. **Cultural Experiences** (unique local traditions and activities)
6. **Travel Tips** (practical advice for MAKU.Travel customers)

Format: Professional markdown suitable for web display.
Tone: Inspiring yet informative, encouraging bookings.
Length: 400-600 words.
`,
    category: 'content',
    usage: 'Website destination pages, travel guides'
  },

  ITINERARY_DETAILED: {
    name: 'Detailed Itinerary',
    template: (destination, days, interests = 'general tourism') => `
${MAKU_BRAND_CONTEXT}

Create a comprehensive ${days}-day itinerary for ${destination} focused on ${interests}.

For each day, provide:
- **Morning Activity** (9AM-12PM) with location and booking notes
- **Afternoon Experience** (1PM-5PM) with travel time estimates
- **Evening Options** (6PM onwards) including dining recommendations
- **Transportation** between locations with cost estimates
- **Booking Integration** opportunities for MAKU.Travel platform

Additional sections:
- **Pre-Trip Preparation** (what to book in advance)
- **Budget Breakdown** (daily cost estimates by category)
- **Local Tips** (insider knowledge for better experiences)
- **MAKU.Travel Booking Links** (where customers can book each component)

Format: Structured markdown with clear day divisions.
Focus: Actionable, bookable experiences that drive platform engagement.
`,
    category: 'content',
    usage: 'Itinerary planning, customer inspiration'
  },

  // Hotel & Accommodation Templates
  HOTEL_DESCRIPTION: {
    name: 'Hotel Description',
    template: (hotelName, location, starRating, keyAmenities) => `
${MAKU_BRAND_CONTEXT}

Write an engaging hotel description for ${hotelName} in ${location} (${starRating}-star).

Key amenities to highlight: ${keyAmenities}

Structure:
1. **Opening Statement** (compelling hook that captures hotel's unique appeal)
2. **Location Advantages** (proximity to attractions, transport, business districts)
3. **Accommodation Details** (room types, views, comfort features)
4. **Amenities & Services** (facilities, dining, business services, wellness)
5. **Guest Experience** (what makes stays memorable)
6. **Booking Confidence** (why guests should book through MAKU.Travel)

Tone: Professional and inviting, highlighting value proposition.
Length: 200-300 words.
Format: Web-friendly paragraphs with key points emphasized.
`,
    category: 'accommodation',
    usage: 'Hotel booking pages, search results'
  },

  // Flight & Transportation Templates
  FLIGHT_SEARCH_OPTIMIZATION: {
    name: 'Flight Search Tips',
    template: (origin, destination, timeframe, budget = 'flexible') => `
${MAKU_BRAND_CONTEXT}

Generate flight search optimization guide for ${origin} to ${destination} during ${timeframe}.
Budget consideration: ${budget}

Provide:
1. **Best Booking Windows** (optimal timing for price and availability)
2. **Alternative Airports** (nearby options that might offer better deals)
3. **Seasonal Pricing Patterns** (when to expect higher/lower fares)
4. **Day-of-Week Trends** (cheapest departure/return day combinations)
5. **Route Optimization** (direct vs. connecting flight considerations)
6. **Price Alert Strategy** (when to set alerts, what price points to target)
7. **MAKU.Travel Advantages** (how our platform helps optimize searches)

Format: Actionable bullet points and tips.
Focus: Helping customers make informed booking decisions on our platform.
`,
    category: 'flight',
    usage: 'Flight search assistance, booking optimization'
  },

  // Customer Service Templates
  CUSTOMER_SUPPORT: {
    name: 'Customer Support Response',
    template: (scenario, issueType, urgency = 'normal') => `
${MAKU_BRAND_CONTEXT}

Generate a customer service response for this scenario: ${scenario}
Issue type: ${issueType}
Urgency level: ${urgency}

Response structure:
1. **Acknowledgment** (show understanding and empathy)
2. **Immediate Actions** (what we're doing right now to help)
3. **Resolution Steps** (clear next steps for the customer)
4. **Timeline** (realistic expectations for resolution)
5. **Additional Support** (how customer can get further help)
6. **Relationship Building** (maintain trust and encourage future bookings)

Tone: Professional, empathetic, solution-focused.
MAKU.Travel standards: Always prioritize customer satisfaction and platform reputation.
Include: Relevant policy information and compensation guidelines where applicable.
`,
    category: 'support',
    usage: 'Customer service training, response templates'
  },

  // Marketing Content Templates
  MARKETING_CAMPAIGN: {
    name: 'Marketing Content',
    template: (contentType, destination, audience, campaign = 'general promotion') => `
${MAKU_BRAND_CONTEXT}

Create ${contentType} marketing content for ${destination} targeting ${audience}.
Campaign context: ${campaign}

Content requirements:
1. **Hook** (attention-grabbing opening that resonates with target audience)
2. **Value Proposition** (why book this destination through MAKU.Travel)
3. **Key Benefits** (what makes this destination/offer special)
4. **Social Proof** (trust indicators, customer testimonials concept)
5. **Call-to-Action** (specific, compelling action for platform engagement)
6. **Urgency/Scarcity** (appropriate motivational elements)

Tone: Match audience preferences while maintaining MAKU.Travel professional standards.
Format: Optimized for ${contentType} platform requirements.
Focus: Drive bookings while building brand affinity.
`,
    category: 'marketing',
    usage: 'Social media, email campaigns, advertising'
  },

  // Analytics & Testing Templates
  PROMPT_TESTING: {
    name: 'AI Prompt Quality Assessment',
    template: (promptText, context, expectedOutcome) => `
Evaluate this AI prompt for MAKU.Travel platform integration:

**Prompt to Test**: "${promptText}"
**Usage Context**: ${context}
**Expected Outcome**: ${expectedOutcome}

Assessment criteria:
1. **Clarity** (is the prompt clear and unambiguous?)
2. **Context Completeness** (does it provide sufficient background?)
3. **Brand Alignment** (does it reflect MAKU.Travel values and voice?)
4. **Output Specificity** (will it generate the desired format/content?)
5. **Scalability** (can this prompt work across different inputs?)
6. **User Experience Impact** (how will the output affect customer experience?)

Provide:
- **Quality Score** (1-10 with justification)
- **Strengths** (what works well)
- **Improvement Suggestions** (specific recommendations)
- **Alternative Versions** (2-3 enhanced prompt variations)
- **Implementation Notes** (technical considerations for deployment)
`,
    category: 'testing',
    usage: 'AI prompt optimization, quality assurance'
  }
};

// Template utility functions
const getTemplate = (templateName, ...args) => {
  const template = TRAVEL_PROMPT_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Template "${templateName}" not found`);
  }
  return template.template(...args);
};

const listTemplates = () => {
  console.log('\n🎯 Available MAKU.Travel Prompt Templates:\n');
  
  Object.entries(TRAVEL_PROMPT_TEMPLATES).forEach(([key, template]) => {
    console.log(`📋 ${template.name} (${key})`);
    console.log(`   Category: ${template.category}`);
    console.log(`   Usage: ${template.usage}\n`);
  });
};

// CLI interface for template usage
const [,, command, templateName, ...args] = process.argv;

if (command === 'list') {
  listTemplates();
  process.exit(0);
}

if (command === 'get' && templateName) {
  try {
    const prompt = getTemplate(templateName, ...args);
    console.log('\n✅ Generated Prompt Template:\n');
    console.log(prompt);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Use "node scripts/travel-prompt-templates.js list" to see available templates');
  }
  process.exit(0);
}

// Show usage help
console.log(`
🎯 MAKU.Travel Prompt Templates CLI

Usage:
  node scripts/travel-prompt-templates.js list
  node scripts/travel-prompt-templates.js get <template-name> <args...>

Examples:
  node scripts/travel-prompt-templates.js list
  node scripts/travel-prompt-templates.js get DESTINATION_OVERVIEW "Tokyo, Japan"
  node scripts/travel-prompt-templates.js get HOTEL_DESCRIPTION "Hotel Tokyo" "Shibuya" "4-star" "WiFi, Pool, Spa"
`);

module.exports = {
  TRAVEL_PROMPT_TEMPLATES,
  getTemplate,
  listTemplates,
  MAKU_BRAND_CONTEXT
};