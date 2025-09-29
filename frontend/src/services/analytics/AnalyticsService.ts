/**
 * Analytics Tracking Service
 * 
 * Provides comprehensive event tracking for user interactions,
 * referral clicks, filter usage, and system events
 */

interface AnalyticsEvent {
  event_type: string;
  event_category: string;
  user_id?: string;
  session_id?: string;
  event_data?: any;
  properties?: any;
  context?: any;
}

class AnalyticsService {
  private backendUrl: string;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxBatchSize: number = 50;
  private isEnabled: boolean = true;

  constructor() {
    this.backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || '';
    this.sessionId = this.generateSessionId();
    
    // Check if analytics is enabled in environment
    this.isEnabled = import.meta.env.VITE_ENVIRONMENT !== 'development' || 
                     import.meta.env.VITE_ANALYTICS_ENABLED === 'true';
    
    // Start auto-flush interval
    if (this.isEnabled) {
      setInterval(() => this.flush(), this.flushInterval);
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private generateSessionId(): string {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private getContext(): any {
    return {
      page_url: window.location.href,
      page_path: window.location.pathname,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };
  }

  private async getUserId(): Promise<string | undefined> {
    // Try to get user ID from various sources
    try {
      // Check localStorage for user session
      const userSession = localStorage.getItem('maku_user_session');
      if (userSession) {
        const session = JSON.parse(userSession);
        return session.user_id;
      }
      
      // Check for authenticated user (if using Supabase auth)
      const supabaseSession = localStorage.getItem('sb-iomeddeasarntjhqzndu-auth-token');
      if (supabaseSession) {
        const session = JSON.parse(supabaseSession);
        return session?.user?.id;
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Track a single analytics event
   */
  async track(eventType: string, eventCategory: string = 'user_action', eventData: any = {}, properties: any = {}): Promise<void> {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      event_type: eventType,
      event_category: eventCategory,
      user_id: await this.getUserId(),
      session_id: this.sessionId,
      event_data: eventData,
      properties: properties,
      context: this.getContext()
    };

    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.maxBatchSize) {
      await this.flush();
    }
  }

  /**
   * Track page view
   */
  async trackPageView(pageName?: string): Promise<void> {
    await this.track('page_view', 'navigation', {
      page: pageName || window.location.pathname,
      title: document.title
    });
  }

  /**
   * Track search query
   */
  async trackSearch(query: string, filters: any = {}, resultsCount: number = 0): Promise<void> {
    await this.track('search_query', 'user_action', {
      query,
      filters,
      results_count: resultsCount,
      search_type: this.getSearchType()
    });
  }

  private getSearchType(): string {
    const path = window.location.pathname;
    if (path.includes('hotels')) return 'hotel';
    if (path.includes('flights')) return 'flight';
    if (path.includes('activities')) return 'activity';
    if (path.includes('cars')) return 'car';
    return 'general';
  }

  /**
   * Track filter usage
   */
  async trackFilterUsage(filterType: string, value: any, action: 'add' | 'remove' | 'change'): Promise<void> {
    await this.track('filter_applied', 'user_action', {
      filter_type: filterType,
      value: value,
      action: action
    });
  }

  /**
   * Track referral clicks
   */
  async trackReferralClick(referralCode: string, targetPage: string, source: string = 'unknown'): Promise<void> {
    await this.track('referral_click', 'user_action', {
      referral_code: referralCode,
      target_page: targetPage,
      source: source
    });
  }

  /**
   * Track booking flow events
   */
  async trackBooking(stage: 'started' | 'completed' | 'abandoned', bookingData: any): Promise<void> {
    await this.track(`booking_${stage}`, 'booking', bookingData);
  }

  /**
   * Track NFT and rewards interactions
   */
  async trackNFTInteraction(action: 'viewed' | 'claimed' | 'shared', nftData: any): Promise<void> {
    await this.track('nft_interaction', 'user_action', {
      action,
      ...nftData
    });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(featureName: string, action: string, metadata: any = {}): Promise<void> {
    await this.track('feature_usage', 'user_action', {
      feature: featureName,
      action: action,
      ...metadata
    });
  }

  /**
   * Track user engagement metrics
   */
  async trackEngagement(engagementType: 'time_on_page' | 'scroll_depth' | 'click_depth', value: number): Promise<void> {
    await this.track('user_engagement', 'engagement', {
      engagement_type: engagementType,
      value: value
    });
  }

  /**
   * Track errors and exceptions
   */
  async trackError(errorType: string, errorMessage: string, errorData: any = {}): Promise<void> {
    await this.track('error_occurred', 'system', {
      error_type: errorType,
      error_message: errorMessage,
      ...errorData
    });
  }

  /**
   * Flush queued events to backend
   */
  async flush(): Promise<void> {
    if (!this.isEnabled || this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(`${this.backendUrl}/api/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventsToSend),
      });

      if (!response.ok) {
        // If failed, put events back in queue for retry
        this.eventQueue.unshift(...eventsToSend);
        console.error('Analytics flush failed:', response.statusText);
      }
    } catch (error) {
      // If failed, put events back in queue for retry
      this.eventQueue.unshift(...eventsToSend);
      console.error('Analytics flush error:', error);
    }
  }

  /**
   * Set user context (call when user logs in/out)
   */
  setUserContext(userId: string | null, properties: any = {}): void {
    localStorage.setItem('maku_user_session', JSON.stringify({
      user_id: userId,
      properties: properties,
      session_start: new Date().toISOString()
    }));
  }

  /**
   * Enable/disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Auto-track page views on navigation
let currentPath = window.location.pathname;
const observer = new MutationObserver(() => {
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname;
    analyticsService.trackPageView();
  }
});

if (typeof document !== 'undefined') {
  observer.observe(document, { childList: true, subtree: true });
  
  // Track initial page load
  analyticsService.trackPageView();
  
  // Track time on page
  let pageStartTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Date.now() - pageStartTime;
    analyticsService.trackEngagement('time_on_page', Math.floor(timeOnPage / 1000));
  });
  
  // Track scroll depth
  let maxScrollDepth = 0;
  window.addEventListener('scroll', () => {
    const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
    if (scrollDepth > maxScrollDepth) {
      maxScrollDepth = scrollDepth;
      if (scrollDepth > 0.25 && scrollDepth <= 0.5) {
        analyticsService.trackEngagement('scroll_depth', 25);
      } else if (scrollDepth > 0.5 && scrollDepth <= 0.75) {
        analyticsService.trackEngagement('scroll_depth', 50);
      } else if (scrollDepth > 0.75 && scrollDepth <= 0.9) {
        analyticsService.trackEngagement('scroll_depth', 75);
      } else if (scrollDepth > 0.9) {
        analyticsService.trackEngagement('scroll_depth', 100);
      }
    }
  });
}

export { analyticsService };
export default analyticsService;