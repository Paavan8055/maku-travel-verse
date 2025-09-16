import { useCallback } from 'react';
import { useErrorReporting } from './useErrorReporting';
import { supabase } from '@/integrations/supabase/client';

interface ConversionEvent {
  event_name: string;
  user_id?: string;
  session_id: string;
  page_url: string;
  timestamp: string;
  properties: Record<string, any>;
  value?: number;
  currency?: string;
}

interface FunnelStep {
  step_name: string;
  step_order: number;
  user_id?: string;
  session_id: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('maku_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('maku_session_id', sessionId);
  }
  return sessionId;
};

export const useConversionTracking = () => {
  const { reportEvent } = useErrorReporting();

  // Track conversion events
  const trackConversion = useCallback(async (
    eventName: string,
    properties: Record<string, any> = {},
    value?: number,
    currency: string = 'AUD'
  ) => {
    try {
      const event: ConversionEvent = {
        event_name: eventName,
        user_id: properties.userId,
        session_id: getSessionId(),
        page_url: window.location.href,
        timestamp: new Date().toISOString(),
        properties,
        value,
        currency: value ? currency : undefined
      };

      // Log to Supabase
      const { error } = await supabase.functions.invoke('conversion-tracking', {
        body: { event }
      });

      if (error) {
        console.warn('Conversion tracking failed:', error);
      }

      // Also report to error tracking for analytics
      reportEvent('conversion', {
        eventName,
        value,
        currency,
        sessionId: event.session_id,
        ...properties
      });

    } catch (error) {
      console.warn('Conversion tracking error:', error);
    }
  }, [reportEvent]);

  // Track funnel progression
  const trackFunnelStep = useCallback(async (
    stepName: string,
    stepOrder: number,
    metadata: Record<string, any> = {}
  ) => {
    try {
      const step: FunnelStep = {
        step_name: stepName,
        step_order: stepOrder,
        user_id: metadata.userId,
        session_id: getSessionId(),
        timestamp: new Date().toISOString(),
        metadata
      };

      // Log to Supabase
      const { error } = await supabase.functions.invoke('funnel-tracking', {
        body: { step }
      });

      if (error) {
        console.warn('Funnel tracking failed:', error);
      }

      reportEvent('funnel_step', {
        stepName,
        stepOrder,
        sessionId: step.session_id,
        ...metadata
      });

    } catch (error) {
      console.warn('Funnel tracking error:', error);
    }
  }, [reportEvent]);

  // Predefined conversion events for MAKU.Travel
  const trackEvents = {
    // Search events
    searchInitiated: (searchType: 'flight' | 'hotel' | 'activity', searchParams: Record<string, any>) =>
      trackConversion('search_initiated', { searchType, ...searchParams }),
    
    searchCompleted: (searchType: 'flight' | 'hotel' | 'activity', resultsCount: number, searchParams: Record<string, any>) =>
      trackConversion('search_completed', { searchType, resultsCount, ...searchParams }),

    // Selection events
    offerSelected: (offerType: 'flight' | 'hotel' | 'activity', offerId: string, price: number) =>
      trackConversion('offer_selected', { offerType, offerId }, price),

    // Booking funnel
    reviewStarted: (bookingType: 'flight' | 'hotel' | 'activity', itemId: string, totalAmount: number) =>
      trackConversion('review_started', { bookingType, itemId }, totalAmount),

    checkoutStarted: (bookingType: 'flight' | 'hotel' | 'activity', bookingId: string, totalAmount: number) =>
      trackConversion('checkout_started', { bookingType, bookingId }, totalAmount),

    paymentStarted: (bookingId: string, paymentMethod: string, totalAmount: number) =>
      trackConversion('payment_started', { bookingId, paymentMethod }, totalAmount),

    bookingCompleted: (bookingId: string, bookingType: 'flight' | 'hotel' | 'activity', totalAmount: number, paymentMethod: string) =>
      trackConversion('booking_completed', { bookingId, bookingType, paymentMethod }, totalAmount),

    // User events
    userRegistered: (userId: string, registrationMethod: string) =>
      trackConversion('user_registered', { userId, registrationMethod }),

    userLoggedIn: (userId: string, loginMethod: string) =>
      trackConversion('user_logged_in', { userId, loginMethod }),

    // Engagement events
    newsletterSignup: (email: string) =>
      trackConversion('newsletter_signup', { email }),

    wishlistAdded: (itemType: 'flight' | 'hotel' | 'activity', itemId: string) =>
      trackConversion('wishlist_added', { itemType, itemId }),

    // Support events
    supportRequested: (supportType: string, bookingId?: string) =>
      trackConversion('support_requested', { supportType, bookingId }),

    // Funnel steps
    landingPageViewed: () =>
      trackFunnelStep('landing_page_view', 1),

    searchPageViewed: (searchType: 'flight' | 'hotel' | 'activity') =>
      trackFunnelStep('search_page_view', 2, { searchType }),

    resultsPageViewed: (searchType: 'flight' | 'hotel' | 'activity', resultsCount: number) =>
      trackFunnelStep('results_page_view', 3, { searchType, resultsCount }),

    detailsPageViewed: (itemType: 'flight' | 'hotel' | 'activity', itemId: string) =>
      trackFunnelStep('details_page_view', 4, { itemType, itemId }),

    reviewPageViewed: (bookingType: 'flight' | 'hotel' | 'activity') =>
      trackFunnelStep('review_page_view', 5, { bookingType }),

    checkoutPageViewed: (bookingType: 'flight' | 'hotel' | 'activity') =>
      trackFunnelStep('checkout_page_view', 6, { bookingType }),

    confirmationPageViewed: (bookingId: string) =>
      trackFunnelStep('confirmation_page_view', 7, { bookingId })
  };

  // Advanced analytics
  const trackUserFlow = useCallback((flowName: string, stepData: Record<string, any>) => {
    reportEvent('user_flow', {
      flowName,
      sessionId: getSessionId(),
      timestamp: new Date().toISOString(),
      ...stepData
    });
  }, [reportEvent]);

  const trackPerformanceMetric = useCallback((metricName: string, value: number, metadata?: Record<string, any>) => {
    trackConversion('performance_metric', {
      metricName,
      value,
      page: window.location.pathname,
      ...metadata
    });
  }, [trackConversion]);

  return {
    trackConversion,
    trackFunnelStep,
    trackUserFlow,
    trackPerformanceMetric,
    getSessionId,
    ...trackEvents
  };
};