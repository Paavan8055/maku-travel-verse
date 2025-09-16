import { useEffect, useCallback } from 'react';
import { analytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';

interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
}

export const useFirebaseAnalytics = () => {
  const trackEvent = useCallback((eventName: string, parameters?: Record<string, any>) => {
    if (!analytics) {
      console.warn('Firebase Analytics not initialized');
      return;
    }

    try {
      logEvent(analytics, eventName, parameters);
      console.log('Analytics event tracked:', eventName, parameters);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }, []);

  // Travel-specific tracking functions
  const trackSearchEvent = useCallback((searchType: 'flight' | 'hotel' | 'activity', searchParams: any) => {
    trackEvent(`search_${searchType}`, {
      search_term: searchParams.destination || searchParams.origin,
      value: searchParams.price || 0,
      currency: searchParams.currency || 'AUD',
      ...searchParams
    });
  }, [trackEvent]);

  const trackBookingEvent = useCallback((bookingType: 'flight' | 'hotel' | 'activity', bookingData: any) => {
    trackEvent(`book_${bookingType}`, {
      transaction_id: bookingData.id,
      value: bookingData.totalAmount,
      currency: bookingData.currency,
      item_category: bookingType,
      ...bookingData
    });
  }, [trackEvent]);

  const trackUserEngagement = useCallback((action: string, details?: any) => {
    trackEvent('user_engagement', {
      engagement_time_msec: Date.now(),
      action,
      ...details
    });
  }, [trackEvent]);

  const trackConversion = useCallback((conversionType: string, value?: number, currency = 'AUD') => {
    trackEvent('conversion', {
      conversion_type: conversionType,
      value,
      currency
    });
  }, [trackEvent]);

  // Page view tracking
  const trackPageView = useCallback((pageName: string, pageTitle?: string) => {
    trackEvent('page_view', {
      page_title: pageTitle || pageName,
      page_location: window.location.href,
      page_referrer: document.referrer
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackSearchEvent,
    trackBookingEvent,
    trackUserEngagement,
    trackConversion,
    trackPageView
  };
};