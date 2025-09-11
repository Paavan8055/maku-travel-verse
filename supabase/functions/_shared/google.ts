import logger from "./logger.ts";
import { ENV_CONFIG } from "./config.ts";

export interface GoogleServiceConfig {
  apiKey: string;
  baseUrl: string;
}

export interface GoogleConfig {
  flights: GoogleServiceConfig;
  hotels: GoogleServiceConfig;
  activities: GoogleServiceConfig;
}

export const GOOGLE_CONFIG: GoogleConfig = {
  flights: {
    apiKey: ENV_CONFIG.GOOGLE_FLIGHTS_API_KEY || "",
    baseUrl: ENV_CONFIG.GOOGLE_FLIGHTS_BASE_URL || "https://test.googleapis.com/flights",
  },
  hotels: {
    apiKey: ENV_CONFIG.GOOGLE_HOTELS_API_KEY || "",
    baseUrl: ENV_CONFIG.GOOGLE_HOTELS_BASE_URL || "https://test.googleapis.com/hotels",
  },
  activities: {
    apiKey: ENV_CONFIG.GOOGLE_ACTIVITIES_API_KEY || "",
    baseUrl: ENV_CONFIG.GOOGLE_ACTIVITIES_BASE_URL || "https://test.googleapis.com/activities",
  },
};

export function getGoogleApiHeaders(service: keyof GoogleConfig): Record<string, string> {
  const apiKey = GOOGLE_CONFIG[service].apiKey;
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export function getGoogleBaseUrl(service: keyof GoogleConfig): string {
  return GOOGLE_CONFIG[service].baseUrl;
}
