// Unified Platform Orchestrator - Central coordination system for all Maku.Travel modules
// Eliminates fragmentation and ensures cohesive user experience across all dashboards

import { tierService } from './UnifiedTierService';

export interface UnifiedUserState {
  userId: string;
  profile: UserProfile;
  travelData: TravelData;
  rewardsData: RewardsData;
  aiContext: AIContext;
  dashboardStates: DashboardStates;
}

export interface UserProfile {
  basicInfo: {
    name: string;
    email: string;
    preferences: TravelPreferences;
  };
  travelDNA: {
    personality_type: string;
    confidence_score: number;
    factors: Array<{factor: string; weight: number; confidence: number}>;
  };
  settings: {
    notifications: NotificationSettings;
    privacy: PrivacySettings;
    dashboard_layout: DashboardLayout;
  };
}

export interface TravelData {
  bookingHistory: BookingRecord[];
  smartDreams: {
    destinations: DreamDestination[];
    journeyPlans: JourneyPlan[];
    aiRecommendations: AIRecommendation[];
  };
  searchHistory: SearchRecord[];
  preferences: {
    providers: string[];
    budgetRange: [number, number];
    travelStyle: string[];
  };
}

export interface RewardsData {
  nftCollection: NFTRecord[];
  airdropStatus: {
    total_points: number;
    current_tier: string;
    tier_progress: number;
    estimated_allocation: number;
  };
  achievements: Achievement[];
  questProgress: QuestProgress[];
  platformCredits: number;
}

export interface AIContext {
  learningProfile: AILearningProfile;
  activeInsights: AIInsight[];
  conversationHistory: ConversationRecord[];
  predictiveModels: PredictiveModel[];
}

export interface CrossModuleUpdate {
  sourceModule: string;
  targetModules: string[];
  updateType: string;
  data: any;
  timestamp: Date;
}

export interface UserAction {
  type: 'booking_completed' | 'nft_earned' | 'quest_completed' | 'page_visited' | 'search_performed';
  userId: string;
  data: any;
  context: {
    currentPage: string;
    sessionId: string;
    userAgent: string;
  };
}

export class UnifiedPlatformOrchestrator {
  private static instance: UnifiedPlatformOrchestrator;
  private userStates: Map<string, UnifiedUserState> = new Map();
  private eventSubscribers: Map<string, Function[]> = new Map();

  public static getInstance(): UnifiedPlatformOrchestrator {
    if (!UnifiedPlatformOrchestrator.instance) {
      UnifiedPlatformOrchestrator.instance = new UnifiedPlatformOrchestrator();
    }
    return UnifiedPlatformOrchestrator.instance;
  }

  /**
   * Process any user action and coordinate updates across all modules
   */
  async processUserAction(action: UserAction): Promise<UnifiedResponse> {
    try {
      // 1. Get current user state
      const currentState = await this.getUserState(action.userId);
      
      // 2. Process the primary action
      const primaryResult = await this.processPrimaryAction(action, currentState);
      
      // 3. Calculate cross-module impacts
      const crossModuleUpdates = await this.calculateCrossModuleUpdates(action, primaryResult, currentState);
      
      // 4. Execute all updates
      const updateResults = await this.executeCrossModuleUpdates(crossModuleUpdates);
      
      // 5. Generate AI insights
      const aiInsights = await this.generateUnifiedInsights(action, primaryResult, updateResults);
      
      // 6. Update user state
      const newState = await this.updateUserState(action.userId, crossModuleUpdates);
      
      // 7. Broadcast to connected dashboards
      await this.broadcastUpdates(action.userId, crossModuleUpdates);
      
      return {
        success: true,
        primaryResult,
        crossModuleUpdates: updateResults,
        aiInsights,
        newUserState: newState,
        recommendations: await this.generateNextRecommendations(newState)
      };
      
    } catch (error) {
      console.error('Platform orchestration error:', error);
      return {
        success: false,
        error: error.message,
        fallbackAction: this.getFallbackAction(action)
      };
    }
  }

  /**
   * Calculate what other modules need to be updated based on this action
   */
  private async calculateCrossModuleUpdates(
    action: UserAction,
    primaryResult: any,
    currentState: UnifiedUserState
  ): Promise<CrossModuleUpdate[]> {
    const updates: CrossModuleUpdate[] = [];

    switch (action.type) {
      case 'booking_completed':
        // Update rewards system
        updates.push({
          sourceModule: 'booking',
          targetModules: ['nft', 'airdrop', 'gamification'],
          updateType: 'booking_rewards',
          data: {
            booking: primaryResult.booking,
            rewardCalculation: await this.calculateBookingRewards(primaryResult.booking, currentState),
            questUpdates: await this.getQuestUpdates(primaryResult.booking, currentState)
          },
          timestamp: new Date()
        });

        // Update Smart Dreams context
        updates.push({
          sourceModule: 'booking',
          targetModules: ['smart-dreams', 'ai-intelligence'],
          updateType: 'travel_context_update',
          data: {
            newExperience: primaryResult.booking,
            updatedPreferences: await this.updateTravelPreferences(primaryResult.booking, currentState),
            aiLearning: await this.updateAILearning(primaryResult.booking, currentState)
          },
          timestamp: new Date()
        });
        break;

      case 'nft_earned':
        // Update tier progression
        updates.push({
          sourceModule: 'nft',
          targetModules: ['airdrop', 'user-dashboard', 'admin'],
          updateType: 'tier_progression',
          data: {
            nft: primaryResult.nft,
            tierUpdate: await this.calculateTierUpdate(primaryResult.nft, currentState),
            newBenefits: await this.getNewBenefits(primaryResult.nft, currentState)
          },
          timestamp: new Date()
        });
        break;

      case 'quest_completed':
        // Update multiple systems
        updates.push({
          sourceModule: 'gamification',
          targetModules: ['airdrop', 'nft', 'smart-dreams'],
          updateType: 'quest_completion',
          data: {
            quest: primaryResult.quest,
            pointsEarned: primaryResult.points,
            tierProgress: await this.updateTierProgress(primaryResult.points, currentState),
            unlockRewards: await this.checkUnlockRewards(primaryResult.quest, currentState)
          },
          timestamp: new Date()
        });
        break;
    }

    return updates;
  }

  /**
   * Execute updates across all relevant modules
   */
  private async executeCrossModuleUpdates(updates: CrossModuleUpdate[]): Promise<UpdateResult[]> {
    const results = [];

    for (const update of updates) {
      for (const targetModule of update.targetModules) {
        try {
          const result = await this.updateModule(targetModule, update);
          results.push(result);
        } catch (error) {
          console.error(`Failed to update module ${targetModule}:`, error);
          results.push({
            module: targetModule,
            success: false,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Update specific module based on cross-module trigger
   */
  private async updateModule(moduleName: string, update: CrossModuleUpdate): Promise<UpdateResult> {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://travel-dna.preview.emergentagent.com';

    switch (moduleName) {
      case 'nft':
        if (update.updateType === 'booking_rewards') {
          return await this.updateNFTSystem(update.data, backendUrl);
        }
        break;

      case 'airdrop':
        if (update.updateType === 'quest_completion' || update.updateType === 'tier_progression') {
          return await this.updateAirdropSystem(update.data, backendUrl);
        }
        break;

      case 'smart-dreams':
        if (update.updateType === 'travel_context_update') {
          return await this.updateSmartDreamsContext(update.data, backendUrl);
        }
        break;

      case 'ai-intelligence':
        return await this.updateAIContext(update.data, backendUrl);

      default:
        return { module: moduleName, success: true, message: 'No update needed' };
    }
  }

  /**
   * Calculate unified rewards across all systems
   */
  private async calculateBookingRewards(booking: BookingRecord, userState: UnifiedUserState) {
    const userTier = tierService.calculateUserTier(userState.rewardsData.airdropStatus.total_points);
    const rewards = tierService.calculateBookingRewards(booking.totalValue, booking.provider, userTier);
    
    // Add cross-module bonuses
    const crossModuleBonuses = {
      smartDreamsBonus: this.calculateSmartDreamsBonus(booking, userState.travelData.smartDreams),
      aiBonus: this.calculateAIEngagementBonus(userState.aiContext),
      socialBonus: this.calculateSocialBonus(userState.rewardsData.achievements)
    };

    return {
      ...rewards,
      crossModuleBonuses,
      totalWithBonuses: rewards.total_credits + Object.values(crossModuleBonuses).reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Generate unified AI insights across all modules
   */
  private async generateUnifiedInsights(
    action: UserAction,
    primaryResult: any,
    updateResults: UpdateResult[]
  ): Promise<AIInsight[]> {
    const insights = [];

    // Cross-module opportunity insights
    if (action.type === 'booking_completed') {
      insights.push({
        type: 'opportunity',
        title: 'Reward Optimization',
        message: await this.generateRewardOptimizationInsight(primaryResult.booking),
        actions: ['View Quest Opportunities', 'Explore Provider Bonuses'],
        confidence: 0.92
      });
    }

    // Predictive insights
    const predictiveInsights = await this.generatePredictiveInsights(action);
    insights.push(...predictiveInsights);

    return insights;
  }

  /**
   * Subscribe to cross-module events
   */
  subscribe(eventType: string, callback: Function) {
    if (!this.eventSubscribers.has(eventType)) {
      this.eventSubscribers.set(eventType, []);
    }
    this.eventSubscribers.get(eventType)!.push(callback);
  }

  /**
   * Broadcast events to subscribers
   */
  private async broadcastEvent(eventType: string, data: any) {
    const subscribers = this.eventSubscribers.get(eventType) || [];
    await Promise.all(subscribers.map(callback => callback(data)));
  }

  /**
   * Get personalized next recommendations based on unified state
   */
  private async generateNextRecommendations(userState: UnifiedUserState): Promise<Recommendation[]> {
    const recommendations = [];

    // Smart Dreams recommendations
    if (userState.travelData.smartDreams.destinations.length === 0) {
      recommendations.push({
        type: 'feature_discovery',
        title: 'Build Your Dream Collection',
        description: 'Add destinations to Smart Dreams for personalized AI recommendations',
        action: { type: 'navigate', url: '/smart-dreams' },
        priority: 'medium'
      });
    }

    // Reward optimization recommendations
    const rewardOpportunities = await this.calculateRewardOpportunities(userState);
    if (rewardOpportunities.length > 0) {
      recommendations.push({
        type: 'optimization',
        title: 'Maximize Your Rewards',
        description: `Complete ${rewardOpportunities[0].action} for ${rewardOpportunities[0].potential} extra credits`,
        action: rewardOpportunities[0].action,
        priority: 'high'
      });
    }

    // AI feature recommendations
    if (userState.aiContext.activeInsights.length === 0) {
      recommendations.push({
        type: 'ai_enhancement',
        title: 'Unlock AI Travel Insights',
        description: 'Get personalized travel recommendations based on your preferences',
        action: { type: 'navigate', url: '/ai-intelligence-hub' },
        priority: 'medium'
      });
    }

    return recommendations.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
  }

  private getPriorityScore(priority: string): number {
    const scores = { high: 3, medium: 2, low: 1 };
    return scores[priority] || 0;
  }
}

// Export singleton instance
export const platformOrchestrator = UnifiedPlatformOrchestrator.getInstance();

// React hook for accessing unified state
export const useUnifiedPlatform = (userId?: string) => {
  const [state, setState] = useState<UnifiedUserState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      platformOrchestrator.getUserState(userId).then(userState => {
        setState(userState);
        setLoading(false);
      });
    }
  }, [userId]);

  const processAction = async (action: Omit<UserAction, 'userId'>) => {
    if (!userId) return;
    
    const fullAction = { ...action, userId };
    const result = await platformOrchestrator.processUserAction(fullAction);
    
    if (result.success && result.newUserState) {
      setState(result.newUserState);
    }
    
    return result;
  };

  return {
    userState: state,
    loading,
    processAction,
    orchestrator: platformOrchestrator
  };
};

export default platformOrchestrator;