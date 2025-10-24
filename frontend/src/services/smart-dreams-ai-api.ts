/**
 * Smart Dreams AI API Client
 * Replaces mock orchestrator with real AI scoring + provider rotation
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_REACT_APP_BACKEND_URL || '/api';

export type ServiceType = 'hotels' | 'flights' | 'activities';

export const scoreDestination = (payload: any) =>
  axios.post(`${API_BASE}/smart-dreams-v2/score-destination`, payload).then(r => r.data);

export const scoreBatchDestinations = (destinations: any[], user_preferences: any, user_context: any) =>
  axios.post(`${API_BASE}/smart-dreams-v2/score-batch`, { destinations, user_preferences, user_context })
       .then(r => r.data);

export const searchWithRotation = (service_type: ServiceType, search_criteria: any, correlation_id?: string) =>
  axios.post(`${API_BASE}/smart-dreams-v2/search-with-rotation`, { service_type, search_criteria, correlation_id })
       .then(r => r.data);

export const getCacheStats = () =>
  axios.get(`${API_BASE}/smart-dreams-v2/cache-stats`).then(r => r.data);

export const clearCache = () =>
  axios.delete(`${API_BASE}/smart-dreams-v2/cache`).then(r => r.data);

export const getRotationStats = () =>
  axios.get(`${API_BASE}/smart-dreams-v2/rotation-stats`).then(r => r.data);

export const getSDV2Health = () =>
  axios.get(`${API_BASE}/smart-dreams-v2/health`).then(r => r.data);
