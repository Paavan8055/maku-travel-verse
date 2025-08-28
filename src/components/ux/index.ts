// User Experience Enhancement Components
export { UserFeedback, FloatingFeedback } from './UserFeedback';
export { LoadingState, SearchLoadingState, BookingLoadingState, PaymentLoadingState, LoadingOverlay } from './LoadingStates';
export { AccessibilityEnhancer, FocusTrap, AccessibleFormField, AccessibleNavigation } from './AccessibilityEnhancer';

// Enhanced UX Components (Phase C)
export { 
  AnimatedLoadingState, 
  EnhancedErrorState, 
  NetworkStatusIndicator,
  SmartSkeleton,
  ProgressIndicator
} from './EnhancedUserExperience';

export { 
  MobileBottomSheet,
  MobileSearchBar,
  SwipeableCard,
  MobileTabNavigation,
  MobileStickyHeader
} from './MobileOptimizedComponents';

export {
  SmartNotificationManager,
  BookingNotifications,
  SystemNotifications
} from './SmartNotifications';

export {
  EnhancedSearchBar,
  SmartSearchFilters,
  SmartSearchResults
} from './SearchEnhancements';

// Enhanced UI Components
export { EnhancedSkeleton, HotelCardSkeleton, FlightCardSkeleton, ActivityCardSkeleton, SearchResultsSkeleton } from '../ui/enhanced-skeleton';

// Enhanced Hooks
export { useEnhancedErrorHandler } from '../../hooks/useEnhancedErrorHandler';
export { 
  useEnhancedLoading,
  useMobileOptimization,
  useGestures,
  usePerformanceMonitoring,
  useAccessibilityEnhancements
} from '../../hooks/useEnhancedUX';