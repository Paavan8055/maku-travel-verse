import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'documentation-handler');
  
  try {
    const { 
      destination,
      citizenship,
      travelPurpose = 'tourism',
      stayDuration,
      pets = null, // for pet travel docs
      transitCountries = [],
      hasMinorTravelers = false
    } = params;

    if (!destination || !citizenship) {
      return {
        success: false,
        error: 'Missing required parameters: destination or citizenship'
      };
    }

    // Handle pet travel documentation specifically
    if (intent === 'pet_travel_docs' && pets) {
      const petDocRequirements = {
        healthCertificate: {
          required: true,
          timeframe: 'Within 10 days of travel',
          issuedBy: 'Licensed veterinarian',
          content: 'Current vaccinations, health examination, fitness to travel'
        },
        vaccinations: {
          rabies: 'Required for most international travel',
          distemper: 'Recommended',
          parvovirus: 'Recommended',
          others: 'Destination-specific requirements'
        },
        importPermit: {
          required: 'Depends on destination country',
          processingTime: '2-8 weeks',
          cost: '$50-500'
        },
        quarantine: {
          required: 'Varies by country and pet origin',
          duration: '0-6 months',
          location: 'Government-approved facilities'
        },
        microchipping: {
          required: 'ISO 11784/11785 standard chip',
          timing: 'Before rabies vaccination'
        }
      };

      return {
        success: true,
        result: {
          petDocRequirements,
          countrySpecific: `Specific requirements for bringing pets to ${destination}`,
          timeline: 'Start documentation process 3-6 months before travel',
          costs: 'Budget $500-2000 for complete pet travel documentation',
          pets: pets
        }
      };
    }

    // Build comprehensive documentation requirements
    const systemPrompt = `You are a travel documentation specialist for MAKU Travel. Provide accurate, up-to-date documentation requirements for international travel.

    TRAVEL DETAILS:
    - Traveler citizenship: ${citizenship}
    - Destination: ${destination}
    - Purpose of travel: ${travelPurpose}
    - Stay duration: ${stayDuration || 'Not specified'}
    - Transit countries: ${transitCountries.join(', ') || 'None'}
    - Minor travelers: ${hasMinorTravelers ? 'Yes' : 'No'}

    Provide comprehensive documentation requirements including:
    1. Passport requirements (validity, blank pages)
    2. Visa requirements and application process
    3. Vaccination requirements and health certificates
    4. Travel insurance requirements
    5. Proof of funds or financial requirements
    6. Return ticket or onward travel proof
    7. Hotel reservations or accommodation proof
    8. Special requirements for minors (consent letters, etc.)
    9. Transit visa requirements for connecting flights
    10. Customs declaration forms and restrictions
    11. Emergency contact documentation
    12. Work or study permits if applicable
    
    Include processing times, costs, and application procedures.
    Emphasize critical deadlines and common mistakes to avoid.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `What documentation do I need as a ${citizenship} citizen traveling to ${destination}?` }
        ],
        max_completion_tokens: 1500
      }),
    });

    const aiResponse = await response.json();
    const documentationRequirements = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'documentation_requirements_provided', {
      destination,
      citizenship,
      travelPurpose,
      hasMinorTravelers
    });

    // Store documentation checklist in memory
    await memory?.setMemory(
      'documentation-handler',
      userId,
      'current_documentation_checklist',
      {
        destination,
        citizenship,
        requirements: documentationRequirements,
        generatedAt: new Date().toISOString()
      },
      undefined,
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
    );

    return {
      success: true,
      result: {
        documentationRequirements,
        travelerProfile: {
          citizenship,
          destination,
          travelPurpose,
          stayDuration
        },
        criticalDeadlines: [
          'Passport: Must be valid for 6+ months from travel date',
          'Visa: Apply 4-8 weeks before travel',
          'Vaccinations: Complete 2-4 weeks before travel',
          'Travel insurance: Purchase before final payment'
        ],
        checklist: {
          passport: 'Valid passport with sufficient blank pages',
          visa: 'Visa application submitted and approved',
          vaccinations: 'Required vaccinations completed',
          insurance: 'Travel insurance purchased',
          accommodation: 'Hotel bookings confirmed',
          flights: 'Return/onward tickets booked'
        },
        emergencyContacts: `Embassy/consulate contact information for ${citizenship} citizens in ${destination}`
      }
    };

  } catch (error) {
    console.error('Documentation handler error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide documentation requirements'
    };
  }
};