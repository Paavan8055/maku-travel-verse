/**
 * Test Data Generator for MAKU.Travel
 * 
 * Generates realistic test data for bookings, searches, and user scenarios
 * to support comprehensive testing across all travel service types.
 */

import { addDays, format } from 'date-fns';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  type: 'hotel' | 'flight' | 'activity' | 'multi-service';
  complexity: 'simple' | 'medium' | 'complex';
  searchParams: any;
  expectedOutcome: 'success' | 'warning' | 'error';
  validationRules: string[];
  businessRules: string[];
}

export interface TestUserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferences: {
    currency: string;
    language: string;
    cabin: string;
    starRating: number;
  };
  travelHistory: Array<{
    destination: string;
    date: string;
    type: string;
  }>;
}

export interface TestBookingData {
  id: string;
  scenario: string;
  userProfile: TestUserProfile;
  searchParams: any;
  selectedOffer: any;
  guestDetails: any;
  paymentDetails: any;
  expectedConfirmation: any;
}

/**
 * Test Data Generator Class
 */
export class TestDataGenerator {
  
  // Major Australian and international destinations
  private static readonly DESTINATIONS = {
    domestic: ['SYD', 'MEL', 'BNE', 'PER', 'ADL', 'DRW', 'HOB', 'CNS'],
    international: ['LAX', 'LHR', 'NRT', 'SIN', 'BKK', 'DXB', 'HKG', 'AKL']
  };

  private static readonly AIRLINES = ['QF', 'VA', 'JQ', 'TT', 'EK', 'SQ', 'BA', 'QR'];
  
  private static readonly HOTEL_CHAINS = [
    'Hilton', 'Marriott', 'InterContinental', 'Hyatt', 'Accor', 'Shangri-La'
  ];

  /**
   * Generate comprehensive test scenarios
   */
  static generateTestScenarios(): TestScenario[] {
    return [
      // Hotel Scenarios
      {
        id: 'hotel-domestic-simple',
        name: 'Simple Domestic Hotel Search',
        description: 'Basic hotel search in Sydney for 2 nights',
        type: 'hotel',
        complexity: 'simple',
        searchParams: {
          destination: 'SYD',
          checkIn: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          checkOut: format(addDays(new Date(), 32), 'yyyy-MM-dd'),
          adults: 2,
          children: 0,
          rooms: 1,
          currency: 'AUD'
        },
        expectedOutcome: 'success',
        validationRules: [
          'Check-in date must be in the future',
          'Check-out date must be after check-in',
          'Adults must be at least 1',
          'Currency must be valid ISO code'
        ],
        businessRules: [
          'Minimum 1 night stay required',
          'Maximum 30 days in advance booking',
          'Price must include taxes and fees'
        ]
      },
      {
        id: 'hotel-family-complex',
        name: 'Family Hotel Booking Complex',
        description: 'Multi-room family booking with children of different ages',
        type: 'hotel',
        complexity: 'complex',
        searchParams: {
          destination: 'GC', // Gold Coast
          checkIn: format(addDays(new Date(), 45), 'yyyy-MM-dd'),
          checkOut: format(addDays(new Date(), 49), 'yyyy-MM-dd'),
          adults: 4,
          children: 3,
          childAges: [12, 8, 4],
          rooms: 2,
          currency: 'AUD'
        },
        expectedOutcome: 'success',
        validationRules: [
          'Child ages must be provided when children > 0',
          'Room count must accommodate all guests',
          'All dates must be valid'
        ],
        businessRules: [
          'Children pricing applies for under 18',
          'Family rooms may have different rates',
          'Resort fees may apply for Gold Coast properties'
        ]
      },
      
      // Flight Scenarios
      {
        id: 'flight-domestic-oneway',
        name: 'Domestic One-Way Flight',
        description: 'Simple one-way flight from Sydney to Melbourne',
        type: 'flight',
        complexity: 'simple',
        searchParams: {
          origin: 'SYD',
          destination: 'MEL',
          departureDate: format(addDays(new Date(), 21), 'yyyy-MM-dd'),
          passengers: 1,
          cabin: 'ECONOMY',
          currency: 'AUD'
        },
        expectedOutcome: 'success',
        validationRules: [
          'Origin and destination must be different',
          'Departure date must be in the future',
          'Passenger count must be positive'
        ],
        businessRules: [
          'Domestic flights can be booked up to 330 days in advance',
          'Economy class is default',
          'Baggage policies vary by airline'
        ]
      },
      {
        id: 'flight-international-roundtrip',
        name: 'International Round-Trip Business',
        description: 'Sydney to London return in Business class',
        type: 'flight',
        complexity: 'complex',
        searchParams: {
          origin: 'SYD',
          destination: 'LHR',
          departureDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
          returnDate: format(addDays(new Date(), 74), 'yyyy-MM-dd'),
          passengers: 2,
          cabin: 'BUSINESS',
          currency: 'AUD'
        },
        expectedOutcome: 'success',
        validationRules: [
          'Return date must be after departure',
          'International flights require more advance booking',
          'Business class availability may be limited'
        ],
        businessRules: [
          'International flights require passport details',
          'Seat selection available in Business class',
          'Lounge access included with Business class'
        ]
      },
      
      // Activity Scenarios
      {
        id: 'activity-sydney-harbour',
        name: 'Sydney Harbour Cruise',
        description: 'Half-day harbour cruise for 4 adults',
        type: 'activity',
        complexity: 'simple',
        searchParams: {
          destination: 'SYD',
          date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
          participants: 4,
          currency: 'AUD'
        },
        expectedOutcome: 'success',
        validationRules: [
          'Activity date must be in the future',
          'Participant count must be positive',
          'Destination must have available activities'
        ],
        businessRules: [
          'Weather-dependent activities may be cancelled',
          'Group discounts may apply for 4+ participants',
          'Pickup locations may be limited'
        ]
      },
      
      // Multi-Service Scenarios
      {
        id: 'multi-service-package',
        name: 'Complete Travel Package',
        description: 'Flight + Hotel + Activities package booking',
        type: 'multi-service',
        complexity: 'complex',
        searchParams: {
          origin: 'SYD',
          destination: 'BNE',
          departureDate: format(addDays(new Date(), 35), 'yyyy-MM-dd'),
          returnDate: format(addDays(new Date(), 38), 'yyyy-MM-dd'),
          checkIn: format(addDays(new Date(), 35), 'yyyy-MM-dd'),
          checkOut: format(addDays(new Date(), 38), 'yyyy-MM-dd'),
          passengers: 2,
          adults: 2,
          rooms: 1,
          currency: 'AUD'
        },
        expectedOutcome: 'success',
        validationRules: [
          'Flight and hotel dates must align',
          'All components must be available',
          'Total package price must be calculated correctly'
        ],
        businessRules: [
          'Package discounts may apply',
          'Cancellation policies may differ by component',
          'Changes may affect entire package'
        ]
      }
    ];
  }

  /**
   * Generate test user profiles
   */
  static generateTestUsers(): TestUserProfile[] {
    return [
      {
        id: 'user-frequent-business',
        name: 'James Wilson',
        email: 'james.wilson@example.com',
        phone: '+61412345678',
        preferences: {
          currency: 'AUD',
          language: 'en',
          cabin: 'BUSINESS',
          starRating: 5
        },
        travelHistory: [
          { destination: 'LHR', date: '2024-11-15', type: 'business' },
          { destination: 'SIN', date: '2024-09-20', type: 'business' },
          { destination: 'LAX', date: '2024-07-10', type: 'business' }
        ]
      },
      {
        id: 'user-family-leisure',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+61487654321',
        preferences: {
          currency: 'AUD',
          language: 'en',
          cabin: 'ECONOMY',
          starRating: 4
        },
        travelHistory: [
          { destination: 'GC', date: '2024-12-20', type: 'leisure' },
          { destination: 'MEL', date: '2024-10-05', type: 'leisure' },
          { destination: 'CNS', date: '2024-06-15', type: 'leisure' }
        ]
      },
      {
        id: 'user-budget-backpacker',
        name: 'Alex Chen',
        email: 'alex.chen@example.com',
        phone: '+61456789123',
        preferences: {
          currency: 'AUD',
          language: 'en',
          cabin: 'ECONOMY',
          starRating: 3
        },
        travelHistory: [
          { destination: 'BKK', date: '2024-08-12', type: 'leisure' },
          { destination: 'KUL', date: '2024-06-28', type: 'leisure' },
          { destination: 'HKG', date: '2024-04-14', type: 'leisure' }
        ]
      }
    ];
  }

  /**
   * Generate complete booking test data
   */
  static generateTestBookings(): TestBookingData[] {
    const scenarios = this.generateTestScenarios();
    const users = this.generateTestUsers();
    
    return scenarios.slice(0, 3).map((scenario, index) => ({
      id: `booking-test-${index + 1}`,
      scenario: scenario.id,
      userProfile: users[index],
      searchParams: scenario.searchParams,
      selectedOffer: this.generateMockOffer(scenario.type),
      guestDetails: this.generateGuestDetails(users[index]),
      paymentDetails: this.generatePaymentDetails(),
      expectedConfirmation: this.generateExpectedConfirmation(scenario.type)
    }));
  }

  /**
   * Generate realistic pricing data
   */
  static generatePricingScenarios() {
    return {
      hotel: {
        budget: { min: 80, max: 150, currency: 'AUD' },
        midRange: { min: 150, max: 300, currency: 'AUD' },
        luxury: { min: 300, max: 800, currency: 'AUD' }
      },
      flight: {
        domestic: { min: 150, max: 600, currency: 'AUD' },
        international: { min: 800, max: 5000, currency: 'AUD' }
      },
      activity: {
        halfDay: { min: 50, max: 200, currency: 'AUD' },
        fullDay: { min: 150, max: 500, currency: 'AUD' }
      }
    };
  }

  /**
   * Generate error scenarios for negative testing
   */
  static generateErrorScenarios(): TestScenario[] {
    return [
      {
        id: 'error-invalid-dates',
        name: 'Invalid Date Range',
        description: 'Check-out date before check-in date',
        type: 'hotel',
        complexity: 'simple',
        searchParams: {
          destination: 'SYD',
          checkIn: '2025-09-10',
          checkOut: '2025-09-08', // Invalid: before check-in
          adults: 2,
          rooms: 1
        },
        expectedOutcome: 'error',
        validationRules: ['Check-out must be after check-in'],
        businessRules: ['Minimum 1 night stay required']
      },
      {
        id: 'error-invalid-iata',
        name: 'Invalid IATA Code',
        description: 'Flight search with non-existent airport code',
        type: 'flight',
        complexity: 'simple',
        searchParams: {
          origin: 'XXX', // Invalid IATA code
          destination: 'SYD',
          departureDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
          passengers: 1
        },
        expectedOutcome: 'error',
        validationRules: ['IATA codes must be valid 3-letter codes'],
        businessRules: ['Airport must exist in system']
      }
    ];
  }

  // Private helper methods
  private static generateMockOffer(type: string) {
    switch (type) {
      case 'hotel':
        return {
          id: 'hotel-offer-123',
          name: 'Sydney Harbour Hotel',
          price: { total: '450.00', currency: 'AUD' },
          rating: 4.5,
          amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant']
        };
      case 'flight':
        return {
          id: 'flight-offer-456',
          airline: 'QF',
          flightNumber: 'QF472',
          price: { total: '289.00', currency: 'AUD' },
          duration: '1h 25m'
        };
      case 'activity':
        return {
          id: 'activity-offer-789',
          name: 'Sydney Harbour Bridge Climb',
          price: { total: '189.00', currency: 'AUD' },
          duration: '3h 30m',
          includes: ['Safety equipment', 'Certificate', 'Photos']
        };
      default:
        return { id: 'unknown-offer' };
    }
  }

  private static generateGuestDetails(user: TestUserProfile) {
    return {
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ')[1],
      email: user.email,
      phone: user.phone,
      dateOfBirth: '1985-06-15',
      nationality: 'AU',
      passportNumber: 'P1234567',
      passportExpiry: '2030-06-15'
    };
  }

  private static generatePaymentDetails() {
    return {
      cardNumber: '4242424242424242', // Stripe test card
      expiryMonth: '12',
      expiryYear: '2026',
      cvv: '123',
      cardholderName: 'Test User',
      billingAddress: {
        line1: '123 Test Street',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'AU'
      }
    };
  }

  private static generateExpectedConfirmation(type: string) {
    return {
      bookingReference: `BK${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      confirmationEmail: true,
      pdfVoucher: type === 'hotel' || type === 'activity',
      eTicket: type === 'flight',
      providerConfirmation: `PROV${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };
  }
}

export default TestDataGenerator;