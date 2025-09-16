import { ENV_CONFIG } from "./config.ts";

// Helper functions for Duffel API
export function duffelHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ENV_CONFIG.DUFFEL_ACCESS_TOKEN}`,
    "Duffel-Version": "v2",
  };
}

export function duffelBase() {
  return ENV_CONFIG.DUFFEL_API_BASE || "https://api.duffel.com";
}
