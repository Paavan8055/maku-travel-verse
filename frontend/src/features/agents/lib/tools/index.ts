// Tool system exports
export * from './types';
export * from './tool-registry';
export * from './tool-executor';
export * from './tool-chain';

// Import and register all tools
import { globalToolRegistry } from './tool-registry';
import { globalChainRegistry } from './tool-chain';
import { flightSearchTool, hotelSearchTool, bookingStatusTool, activitySearchTool } from './travel-tools';
import { ToolChainDefinition } from './types';

// Register travel tools
globalToolRegistry.register(flightSearchTool);
globalToolRegistry.register(hotelSearchTool);
globalToolRegistry.register(bookingStatusTool);
globalToolRegistry.register(activitySearchTool);

// Define common tool chains
const travelPlanningChain: ToolChainDefinition = {
  id: 'travel_planning',
  name: 'Complete Travel Planning',
  description: 'Search flights, hotels, and activities for a complete trip',
  steps: [
    {
      toolName: 'search_flights',
      parameters: {},
      mapPreviousResult: () => ({}) // Will be filled by execution context
    },
    {
      toolName: 'search_hotels',
      parameters: {},
      condition: (results) => results.length > 0 && results[0].success,
      mapPreviousResult: (results) => {
        const flightResult = results[0];
        if (flightResult.success && flightResult.result.flights?.length > 0) {
          const flight = flightResult.result.flights[0];
          return {
            destination: flight.destination,
            checkIn: flight.departureDate,
            checkOut: flight.returnDate || flight.departureDate
          };
        }
        return {};
      }
    },
    {
      toolName: 'search_activities',
      parameters: {},
      condition: (results) => results.length > 1 && results[1].success,
      mapPreviousResult: (results) => {
        const hotelResult = results[1];
        if (hotelResult.success && hotelResult.result.hotels?.length > 0) {
          return {
            destination: hotelResult.result.hotels[0].location,
            dateFrom: hotelResult.result.hotels[0].checkIn,
            dateTo: hotelResult.result.hotels[0].checkOut
          };
        }
        return {};
      }
    }
  ]
};

// Register tool chains
globalChainRegistry.register(travelPlanningChain);

// Initialize tool system
export function initializeToolSystem(): void {
  console.log('Tool system initialized with:', {
    tools: globalToolRegistry.getAllDefinitions().length,
    chains: globalChainRegistry.getAllChains().length
  });
}

// Call initialization
initializeToolSystem();