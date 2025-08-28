import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsEvent {
  event_name: string;
  properties?: Record<string, any>;
  value?: number;
  currency?: string;
}

export interface FunnelStep {
  step_name: string;
  step_order: number;
  metadata?: Record<string, any>;
}

export const useAnalytics = () => {
  const getSessionId = useCallback(() => {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }, []);

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      const sessionId = getSessionId();
      
      await supabase.functions.invoke('conversion-tracking', {
        body: {
          action: 'track_conversion',
          data: {
            event_name: event.event_name,
            session_id: sessionId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            page_url: window.location.href,
            properties: event.properties || {},
            value: event.value,
            currency: event.currency || 'AUD'
          }
        }
      });

      // Also send to Google Analytics if available
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', event.event_name, {
          event_category: event.properties?.category || 'engagement',
          value: event.value,
          currency: event.currency || 'AUD',
          ...event.properties
        });
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }, [getSessionId]);

  const trackFunnelStep = useCallback(async (step: FunnelStep) => {
    try {
      const sessionId = getSessionId();
      
      await supabase.functions.invoke('conversion-tracking', {
        body: {
          action: 'track_funnel',
          data: {
            step_name: step.step_name,
            step_order: step.step_order,
            session_id: sessionId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            timestamp: new Date().toISOString(),
            metadata: step.metadata || {}
          }
        }
      });
    } catch (error) {
      console.error('Funnel tracking failed:', error);
    }
  }, [getSessionId]);

  // Convenience methods for common events
  const trackSearch = useCallback((searchType: string, params: any) => {
    trackEvent({
      event_name: 'search_performed',
      properties: {
        category: 'search',
        search_type: searchType,
        ...params
      }
    });

    trackFunnelStep({
      step_name: 'search',
      step_order: 4,
      metadata: { search_type: searchType, params }
    });
  }, [trackEvent, trackFunnelStep]);

  const trackSelection = useCallback((itemType: string, itemId: string, itemData: any) => {
    trackEvent({
      event_name: `${itemType}_selected`,
      properties: {
        category: 'selection',
        item_type: itemType,
        item_id: itemId,
        ...itemData
      },
      value: itemData.price?.amount
    });

    trackFunnelStep({
      step_name: 'selection',
      step_order: 6,
      metadata: { item_type: itemType, item_id: itemId }
    });
  }, [trackEvent, trackFunnelStep]);

  const trackCheckout = useCallback((bookingData: any) => {
    trackEvent({
      event_name: 'checkout_started',
      properties: {
        category: 'checkout',
        booking_type: bookingData.type,
        booking_id: bookingData.id
      },
      value: bookingData.total_amount,
      currency: bookingData.currency
    });

    trackFunnelStep({
      step_name: 'checkout',
      step_order: 8,
      metadata: { booking_id: bookingData.id, booking_type: bookingData.type }
    });
  }, [trackEvent, trackFunnelStep]);

  const trackPurchase = useCallback((bookingData: any) => {
    trackEvent({
      event_name: 'booking_completed',
      properties: {
        category: 'conversion',
        booking_type: bookingData.type,
        booking_id: bookingData.id,
        booking_reference: bookingData.reference
      },
      value: bookingData.total_amount,
      currency: bookingData.currency
    });

    trackFunnelStep({
      step_name: 'completion',
      step_order: 10,
      metadata: { 
        booking_id: bookingData.id, 
        booking_reference: bookingData.reference,
        booking_type: bookingData.type 
      }
    });
  }, [trackEvent, trackFunnelStep]);

  const trackPageView = useCallback((pageName: string, pageData?: any) => {
    trackEvent({
      event_name: 'page_view',
      properties: {
        category: 'navigation',
        page_name: pageName,
        page_path: window.location.pathname,
        ...pageData
      }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackFunnelStep,
    trackSearch,
    trackSelection,
    trackCheckout,
    trackPurchase,
    trackPageView,
    getSessionId
  };
};