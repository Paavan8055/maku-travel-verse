import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';
import { AmadeusClient } from '../_shared/api-clients.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'price-monitor');
  
  try {
    const { 
      searchType, // flight, hotel, activity
      searchParams,
      alertThreshold = 0.1, // 10% price drop
      monitorDuration = 30, // days
      notificationPreference = 'email'
    } = params;

    if (!searchType || !searchParams) {
      return {
        success: false,
        error: 'Missing required parameters: search type or search parameters'
      };
    }

    // Get existing monitors for this user
    const existingMonitors = await memory?.getMemory('price-monitor', userId, 'active_monitors') || [];

    // Create new monitor entry
    const monitorId = crypto.randomUUID();
    const newMonitor = {
      id: monitorId,
      searchType,
      searchParams,
      alertThreshold,
      monitorDuration,
      notificationPreference,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + monitorDuration * 24 * 60 * 60 * 1000).toISOString(),
      lastChecked: new Date().toISOString(),
      currentPrice: null,
      lowestPrice: null,
      priceHistory: []
    };

    // Perform initial price check
    let currentPrice = null;
    try {
      if (searchType === 'flight') {
        const amadeusClient = new AmadeusClient(
          Deno.env.get('AMADEUS_CLIENT_ID') || 'test',
          Deno.env.get('AMADEUS_CLIENT_SECRET') || 'test'
        );
        
        const flightResults = await amadeusClient.makeRequest('/v2/shopping/flight-offers', searchParams);
        currentPrice = flightResults.data?.[0]?.price?.total;
      } else if (searchType === 'hotel') {
        // Hotel price check logic here
        currentPrice = 299.99; // Placeholder
      } else if (searchType === 'activity') {
        // Activity price check logic here
        currentPrice = 89.99; // Placeholder
      }

      newMonitor.currentPrice = currentPrice;
      newMonitor.lowestPrice = currentPrice;
      newMonitor.priceHistory = [{
        price: currentPrice,
        timestamp: new Date().toISOString()
      }];
    } catch (priceCheckError) {
      console.error('Initial price check failed:', priceCheckError);
      newMonitor.currentPrice = 'unavailable';
    }

    // Update monitors list
    const updatedMonitors = [...existingMonitors.filter(m => new Date(m.expiresAt) > new Date()), newMonitor];

    await agent.logActivity(userId, 'price_monitor_created', {
      monitorId,
      searchType,
      alertThreshold,
      monitorDuration
    });

    return {
      success: true,
      result: {
        monitorId,
        monitorStatus: 'active',
        searchType,
        currentPrice,
        alertThreshold: `${alertThreshold * 100}%`,
        monitorDuration: `${monitorDuration} days`,
        nextCheck: 'Within 4 hours',
        searchDetails: searchParams,
        notifications: {
          method: notificationPreference,
          frequency: 'When price drops below threshold'
        }
      },
      memoryUpdates: [
        {
          key: 'active_monitors',
          data: updatedMonitors,
          expiresAt: new Date(Date.now() + Math.max(...updatedMonitors.map(m => new Date(m.expiresAt).getTime() - Date.now()))).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Price monitor error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create price monitor'
    };
  }
};