import { SupabaseClient } from '@supabase/supabase-js';
import { StandardizedContext } from './standardized-context';

export interface ContextBuilderConfig {
  conversationId: string;
  agentId: string;
  userId?: string;
  supabase: SupabaseClient;
}

export abstract class BaseContextBuilder {
  protected config: ContextBuilderConfig;

  constructor(config: ContextBuilderConfig) {
    this.config = config;
  }

  abstract build(): Promise<StandardizedContext>;

  protected async loadUserProfile(): Promise<Record<string, any>> {
    if (!this.config.userId) return {};

    const { data } = await this.config.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', this.config.userId)
      .single();

    return data || {};
  }

  protected async loadUserPreferences(): Promise<Record<string, any>> {
    if (!this.config.userId) return {};

    const { data } = await this.config.supabase
      .from('communication_preferences')
      .select('*')
      .eq('user_id', this.config.userId)
      .single();

    return data?.preferences || {};
  }
}

export class TravelContextBuilder extends BaseContextBuilder {
  async build(): Promise<StandardizedContext> {
    const context = new StandardizedContext(
      this.config.conversationId,
      this.config.agentId,
      this.config.supabase,
      { userId: this.config.userId }
    );

    // Load user profile and preferences
    const [userProfile, preferences] = await Promise.all([
      this.loadUserProfile(),
      this.loadUserPreferences()
    ]);

    context.setUserProfile({ ...userProfile, preferences });

    // Load travel-specific data
    const travelContext = await this.loadTravelContext();
    context.setTravelContext(travelContext);

    // Set initial agent context for travel agents
    context.setAgentContext('domain', 'travel');
    context.setAgentContext('capabilities', [
      'search_flights',
      'search_hotels',
      'search_activities',
      'booking_assistance',
      'travel_planning'
    ]);

    // Add system message for travel context
    context.addMessage({
      role: 'system',
      content: `You are a travel assistant for MAKU.Travel. You help users with flight, hotel, and activity bookings. 
      User preferences: ${JSON.stringify(preferences)}
      Travel history available: ${travelContext.bookingHistory?.length || 0} previous bookings`
    });

    return context;
  }

  private async loadTravelContext(): Promise<any> {
    if (!this.config.userId) return {};

    // Load recent searches
    const [flightSearches, hotelSearches, activitySearches, bookings] = await Promise.all([
      this.config.supabase
        .from('search_audit')
        .select('*')
        .eq('user_id', this.config.userId)
        .eq('product', 'flight')
        .order('created_at', { ascending: false })
        .limit(5),
      
      this.config.supabase
        .from('search_audit')
        .select('*')
        .eq('user_id', this.config.userId)
        .eq('product', 'hotel')
        .order('created_at', { ascending: false })
        .limit(5),
      
      this.config.supabase
        .from('search_audit')
        .select('*')
        .eq('user_id', this.config.userId)
        .eq('product', 'activity')
        .order('created_at', { ascending: false })
        .limit(5),
      
      this.config.supabase
        .from('bookings')
        .select('*')
        .eq('user_id', this.config.userId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    return {
      searchHistory: [
        ...(flightSearches.data || []),
        ...(hotelSearches.data || []),
        ...(activitySearches.data || [])
      ],
      bookingHistory: bookings.data || [],
      preferences: {} // Will be populated from user profile
    };
  }
}

export class AdminContextBuilder extends BaseContextBuilder {
  async build(): Promise<StandardizedContext> {
    const context = new StandardizedContext(
      this.config.conversationId,
      this.config.agentId,
      this.config.supabase,
      { userId: this.config.userId }
    );

    // Load admin profile
    const userProfile = await this.loadUserProfile();
    context.setUserProfile(userProfile);

    // Check admin privileges
    const isAdmin = await this.checkAdminPrivileges();
    
    // Set admin-specific context
    context.setAgentContext('domain', 'admin');
    context.setAgentContext('isAdmin', isAdmin);
    context.setAgentContext('capabilities', [
      'system_management',
      'user_management',
      'provider_management',
      'analytics_access',
      'agent_orchestration'
    ]);

    // Load admin-specific data
    const adminContext = await this.loadAdminContext();
    context.setSharedData('adminMetrics', adminContext);

    // Add system message for admin context
    context.addMessage({
      role: 'system',
      content: `You are an admin assistant for MAKU.Travel. You help with system management, analytics, and administrative tasks.
      Admin level: ${isAdmin ? 'full' : 'limited'}
      Available metrics: ${Object.keys(adminContext).join(', ')}`
    });

    return context;
  }

  private async checkAdminPrivileges(): Promise<boolean> {
    if (!this.config.userId) return false;

    const { data } = await this.config.supabase
      .from('admin_users')
      .select('is_active')
      .eq('user_id', this.config.userId)
      .single();

    return data?.is_active || false;
  }

  private async loadAdminContext(): Promise<any> {
    // Load recent system metrics and alerts
    const [alerts, metrics] = await Promise.all([
      this.config.supabase
        .from('critical_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      
      this.config.supabase
        .from('admin_metrics_cache')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    return {
      recentAlerts: alerts.data || [],
      systemMetrics: metrics.data || [],
      timestamp: new Date().toISOString()
    };
  }
}

export class LoyaltyContextBuilder extends BaseContextBuilder {
  async build(): Promise<StandardizedContext> {
    const context = new StandardizedContext(
      this.config.conversationId,
      this.config.agentId,
      this.config.supabase,
      { userId: this.config.userId }
    );

    // Load user profile and loyalty data
    const [userProfile, loyaltyData] = await Promise.all([
      this.loadUserProfile(),
      this.loadLoyaltyData()
    ]);

    context.setUserProfile(userProfile);
    
    // Set loyalty-specific context
    context.setAgentContext('domain', 'loyalty');
    context.setAgentContext('capabilities', [
      'points_management',
      'reward_redemption',
      'tier_information',
      'loyalty_history'
    ]);

    context.setSharedData('loyaltyData', loyaltyData);

    // Add system message for loyalty context
    context.addMessage({
      role: 'system',
      content: `You are a loyalty program assistant for MAKU.Travel. You help users with points, rewards, and loyalty benefits.
      Current points: ${loyaltyData.currentPoints || 0}
      Current tier: ${loyaltyData.currentTier || 'Bronze'}
      Available rewards: ${loyaltyData.availableRewards?.length || 0}`
    });

    return context;
  }

  private async loadLoyaltyData(): Promise<any> {
    if (!this.config.userId) return {};

    const { data } = await this.config.supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', this.config.userId)
      .single();

    return {
      currentPoints: data?.total_points || 0,
      currentTier: data?.tier || 'Bronze',
      availableRewards: [], // Would load from rewards table
      recentTransactions: [] // Would load from points transactions
    };
  }
}

export class GeneralContextBuilder extends BaseContextBuilder {
  async build(): Promise<StandardizedContext> {
    const context = new StandardizedContext(
      this.config.conversationId,
      this.config.agentId,
      this.config.supabase,
      { userId: this.config.userId }
    );

    // Load basic user data
    const userProfile = await this.loadUserProfile();
    context.setUserProfile(userProfile);

    // Set general agent context
    context.setAgentContext('domain', 'general');
    context.setAgentContext('capabilities', [
      'general_assistance',
      'information_retrieval',
      'task_routing'
    ]);

    // Add system message for general context
    context.addMessage({
      role: 'system',
      content: 'You are a general assistant for MAKU.Travel. You help users with general inquiries and can route them to specialized agents when needed.'
    });

    return context;
  }
}

// Context builder factory
export class ContextBuilderFactory {
  static create(
    agentType: string, 
    config: ContextBuilderConfig
  ): BaseContextBuilder {
    switch (agentType.toLowerCase()) {
      case 'travel':
      case 'flight':
      case 'hotel':
      case 'activity':
        return new TravelContextBuilder(config);
      
      case 'admin':
      case 'system':
        return new AdminContextBuilder(config);
      
      case 'loyalty':
      case 'points':
        return new LoyaltyContextBuilder(config);
      
      default:
        return new GeneralContextBuilder(config);
    }
  }
}