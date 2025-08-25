# MAKU.Travel - Project Knowledge Base

*Last Updated: 25 August 2025*

## Project Overview

MAKU.Travel is an enterprise-grade multi-service travel platform offering hotel, flight, and activity bookings with live integrations to industry-leading providers including Sabre, Amadeus, and HotelBeds. The platform features intelligent provider rotation, comprehensive error handling, and enterprise-level monitoring.

## Architecture & Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context + Zustand for complex state
- **Routing**: React Router v6 with lazy loading
- **Performance**: Code splitting, lazy loading, image optimization

### Backend & Infrastructure
- **Backend**: Supabase with Edge Functions (Deno runtime)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with role-based access control
- **Payment Processing**: Stripe with PaymentIntents and webhooks
- **File Storage**: Planned Supabase Storage integration
- **Monitoring**: Real-time health monitoring and error tracking

### External Integrations
- **Flight Providers**: Amadeus, Sabre
- **Hotel Providers**: Amadeus, HotelBeds, Sabre
- **Activity Providers**: HotelBeds
- **Payment**: Stripe (test and production environments)
- **Email**: Resend for transactional emails

## Provider Integration Details

### Provider Priority & Rotation
1. **Hotels**: HotelBeds (Priority 1) → Amadeus → Sabre
2. **Flights**: Sabre (Priority 1) → Amadeus
3. **Activities**: HotelBeds (Primary)

### API Rate Limits & Quotas
- **HotelBeds**: 100 requests/minute (test), varies by endpoint
- **Amadeus**: 10 requests/second (test), 500 requests/day
- **Sabre**: 150 requests/minute (test)

### Parameter Mapping Standards
- **Date Format**: ISO 8601 (YYYY-MM-DD) for all providers
- **IATA Codes**: 3-letter uppercase format (SYD, MEL, LAX)
- **Currency**: ISO 4217 codes (AUD, USD, EUR, GBP)
- **Passenger Types**: Adult (AD), Child (CH), Infant (IN)

## Database Schema Overview

### Core Tables
- `bookings`: Main booking records with user association
- `booking_items`: Individual booking components (rooms, flights, activities)
- `booking_transactions`: Payment and provider booking state tracking
- `payments`: Stripe payment records and status

### Provider Management
- `provider_configs`: Provider priority, circuit breaker state, health metrics
- `api_health_logs`: Provider API response times and error tracking
- `correlation_tracking`: Request tracing across provider calls

### Caching & Performance
- `flight_offers_cache`: Short-term flight search result caching (10 min TTL)
- `hotel_offers_cache`: Medium-term hotel search caching (30 min TTL)
- `activities_offers_cache`: Long-term activity caching (2 hour TTL)

### Security & Monitoring
- `critical_alerts`: System alerts requiring manual intervention
- `error_tracking`: Application error logging with context
- `user_activity_logs`: Security and audit trail

## Security Implementation

### Row Level Security (RLS)
- **Enabled on all tables** with user-specific access policies
- **Admin-only access** for system tables and metrics
- **Service role access** for edge functions and system operations

### Authentication & Authorization
- **Multi-factor authentication** via Supabase Auth
- **Role-based access control**: admin, partner, user roles
- **Secure admin functions** with double validation
- **Session management** with automatic expiry

### Payment Security
- **PCI-compliant** Stripe integration
- **No card data storage** in application database
- **Webhook signature verification** for payment events
- **Idempotency keys** for duplicate prevention

## API Documentation

### Core Search Parameters

#### Hotel Search
```typescript
interface HotelSearchParams {
  destination: string;      // IATA city code (e.g., "SYD")
  checkIn: string;         // ISO date (e.g., "2025-09-01")
  checkOut: string;        // ISO date (e.g., "2025-09-03")
  rooms: number;           // Default: 1
  adults: number;          // Default: 2
  children: number;        // Default: 0
  childAges?: number[];    // Required if children > 0
  currency: string;        // ISO code (e.g., "AUD")
}
```

#### Flight Search
```typescript
interface FlightSearchParams {
  origin: string;          // IATA airport code (e.g., "SYD")
  destination: string;     // IATA airport code (e.g., "MEL")
  departureDate: string;   // ISO date (e.g., "2025-09-01")
  returnDate?: string;     // ISO date for round-trip
  passengers: number;      // Default: 1
  cabin: string;          // "ECONOMY", "BUSINESS", "FIRST"
  currency: string;        // ISO code (e.g., "AUD")
}
```

#### Activity Search
```typescript
interface ActivitySearchParams {
  destination: string;     // IATA city code (e.g., "SYD")
  date: string;           // ISO date (e.g., "2025-09-01")
  participants: number;    // Default: 1
  currency: string;        // ISO code (e.g., "AUD")
}
```

### Error Codes & Handling

#### Common Error Responses
- **400**: Invalid parameters (missing dates, invalid IATA codes)
- **429**: Rate limit exceeded (provider quota reached)
- **500**: Provider API failure (service unavailable)
- **503**: Circuit breaker open (provider temporarily disabled)

#### Provider-Specific Errors
- **Amadeus 4xx**: Authentication or quota issues
- **HotelBeds 5xx**: Service degradation or maintenance
- **Sabre timeout**: Network connectivity issues

## Booking Flow Architecture

### 1. Search Phase
- Parameter validation using `ParameterMapper`
- Provider rotation via `provider-rotation` edge function
- Result caching with appropriate TTL
- Photo enhancement for hotel results

### 2. Selection Phase
- Add-on selection (rooms, seats, extras)
- Price confirmation via provider checkrates APIs
- Availability validation before proceeding

### 3. Booking Phase
- Guest information collection and validation
- Payment processing via Stripe PaymentIntents
- Atomic booking via `booking-integrity-manager`
- Provider booking confirmation

### 4. Confirmation Phase
- Email confirmation with provider references
- PDF voucher/ticket generation
- Booking status tracking and updates

## Environment Configuration

### Test Environment
- **Stripe**: Test keys with 4242 4242 4242 4242 card
- **Providers**: Sandbox/test endpoints
- **Rate Limits**: Reduced quotas for testing

### Production Environment
- **Stripe**: Live keys with real payment processing
- **Providers**: Production endpoints with full quotas
- **Monitoring**: Enhanced logging and alerting

## Monitoring & Observability

### Health Monitoring
- **Real-time provider health checks** every 5 minutes
- **Circuit breaker pattern** for failed providers
- **Automatic fallback** to backup providers

### Performance Metrics
- **Search response times** by provider
- **Booking success rates** by service type
- **Payment processing times** and failure rates
- **Cache hit rates** by search type

### Error Tracking
- **Correlation IDs** for request tracing
- **Structured logging** with context preservation
- **Critical alerts** for manual intervention
- **Automatic retry logic** with exponential backoff

## Development Guidelines

### Code Standards
- **TypeScript strict mode** for type safety
- **ESLint + Prettier** for code formatting
- **Functional components** with React Hooks
- **Error boundaries** for graceful failure handling

### Testing Strategy
- **Unit tests** for utility functions and hooks
- **Integration tests** for provider APIs
- **End-to-end tests** for booking flows
- **Manual UAT** before releases

### Deployment Process
1. **Internal testing** with team validation
2. **Staging deployment** with provider testing
3. **Beta release** to limited user group
4. **Production deployment** with monitoring
5. **Post-deployment validation** and metrics review

## Troubleshooting Guide

### Common Issues

#### Provider API Failures
- **Check health monitor** for provider status
- **Verify API credentials** in Supabase secrets
- **Review rate limits** and quota usage
- **Reset circuit breakers** if needed

#### Search Returning No Results
- **Validate search parameters** format and values
- **Check provider-specific requirements**
- **Verify date ranges** and availability
- **Review cache expiration** and invalidation

#### Booking Failures
- **Check payment processing** status and errors
- **Verify provider booking APIs** availability
- **Review booking transaction** audit trail
- **Check critical alerts** for system issues

#### Performance Issues
- **Monitor cache hit rates** and optimization
- **Check database query performance**
- **Review provider response times**
- **Analyze user session flows**

## Feature Roadmap

### Phase 1: Foundation (Completed)
- ✅ Provider rotation and fallback system
- ✅ Basic booking flow for all service types
- ✅ Payment processing with Stripe
- ✅ Admin dashboard and monitoring

### Phase 2: Enhancement (In Progress)
- ✅ Unified parameter mapping system
- ✅ Enhanced photo retrieval and caching
- ✅ Role-based access control
- ✅ Client-side caching with retry logic

### Phase 3: Growth (Planned)
- 🔄 Loyalty program implementation
- 🔄 Cross-selling and upselling features
- 🔄 Mobile app development
- 🔄 API partner portal

### Phase 4: Scale (Future)
- 📋 Multi-currency and localization
- 📋 Advanced analytics and ML recommendations
- 📋 Corporate travel management
- 📋 Third-party integration marketplace

## Contact & Support

### Development Team
- **Lead Developer**: [To be assigned]
- **DevOps Engineer**: [To be assigned]
- **Product Manager**: [To be assigned]

### External Contacts
- **Amadeus Support**: Via developer portal
- **HotelBeds Support**: Via partner portal
- **Sabre Support**: Via developer center
- **Stripe Support**: Via dashboard help center

---

*This document is maintained as a living resource. Please update after significant changes or deployments.*