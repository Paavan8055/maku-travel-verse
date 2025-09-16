import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

// Car Rental API Client (mock implementation)
class CarRentalClient {
  constructor(private apiKey: string) {}

  async searchCars(params: any) {
    // Mock implementation - would integrate with real car rental APIs (Hertz, Avis, etc.)
    return {
      results: [{
        id: 'car_001',
        company: 'Hertz',
        vehicleClass: params.vehicleType || 'Economy',
        model: 'Toyota Corolla',
        price: { total: '89.99', currency: 'AUD', perDay: '45.00' },
        pickup: { location: params.pickupLocation, time: params.pickupTime },
        dropoff: { location: params.dropoffLocation, time: params.dropoffTime },
        features: ['Air Conditioning', 'Automatic', 'GPS'],
        insurance: ['Basic', 'Comprehensive', 'Premium'],
        requirements: { minimumAge: 21, licenseRequired: true }
      }]
    };
  }

  async createBooking(bookingData: any) {
    // Mock booking creation
    return {
      bookingId: `CAR${Date.now()}`,
      confirmationCode: `HR${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      status: 'confirmed',
      pickupInstructions: 'Present confirmation code and valid driver license at pickup counter'
    };
  }
}

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'car-rental-booking-assistant');
  
  try {
    const { 
      pickupLocation,
      dropoffLocation,
      pickupTime,
      dropoffTime,
      vehicleType = 'economy', // economy, compact, intermediate, standard, luxury, suv
      driverLicense,
      additionalDrivers = [],
      insuranceOptions = [],
      paymentMethod,
      contactInfo,
      specialRequests = []
    } = params;

    if (!pickupLocation || !dropoffLocation || !pickupTime || !dropoffTime) {
      return {
        success: false,
        error: 'Missing required parameters: pickup/dropoff location and times'
      };
    }

    // Validate driver license
    if (!driverLicense || !driverLicense.number || !driverLicense.country) {
      return {
        success: false,
        error: 'Valid driver license information required (number, country, expiration date)'
      };
    }

    // Check license validity
    const licenseExpiry = new Date(driverLicense.expiryDate);
    const tripEnd = new Date(dropoffTime);
    if (licenseExpiry < tripEnd) {
      return {
        success: false,
        error: 'Driver license expires before trip end date. Please renew license.'
      };
    }

    const carRentalClient = new CarRentalClient(
      Deno.env.get('CAR_RENTAL_API_KEY') || 'test'
    );

    // Search for available cars
    const searchResults = await carRentalClient.searchCars({
      pickupLocation,
      dropoffLocation,
      pickupTime,
      dropoffTime,
      vehicleType
    });

    if (intent === 'search_cars') {
      return {
        success: true,
        result: {
          availableCars: searchResults.results,
          searchCriteria: {
            pickupLocation,
            dropoffLocation,
            vehicleType,
            duration: `${Math.ceil((new Date(dropoffTime).getTime() - new Date(pickupTime).getTime()) / (1000 * 60 * 60 * 24))} days`
          }
        }
      };
    }

    // For booking intent, proceed with reservation
    const selectedCar = searchResults.results[0]; // In real app, user would select

    // Calculate total cost including insurance
    let totalCost = parseFloat(selectedCar.price.total);
    const insuranceCosts = {
      basic: 0,
      comprehensive: 15.99,
      premium: 29.99
    };

    insuranceOptions.forEach(option => {
      totalCost += insuranceCosts[option] || 0;
    });

    // Create booking record
    const bookingData = {
      user_id: userId,
      booking_type: 'car_rental',
      booking_data: {
        car: selectedCar,
        pickupLocation,
        dropoffLocation,
        pickupTime,
        dropoffTime,
        driverLicense,
        additionalDrivers,
        insuranceOptions,
        specialRequests,
        contactInfo
      },
      total_amount: totalCost,
      currency: selectedCar.price.currency,
      status: 'pending'
    };

    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    // Create car rental specific record
    const carRentalData = {
      user_id: userId,
      booking_id: booking.id,
      rental_company: selectedCar.company,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      pickup_date: pickupTime,
      dropoff_date: dropoffTime,
      vehicle_details: {
        class: selectedCar.vehicleClass,
        model: selectedCar.model,
        features: selectedCar.features
      },
      driver_license: driverLicense,
      insurance_options: insuranceOptions.reduce((acc, option) => {
        acc[option] = insuranceCosts[option] || 0;
        return acc;
      }, {}),
      total_cost: totalCost,
      currency: selectedCar.price.currency,
      status: 'reserved'
    };

    const { data: carRental, error: carRentalError } = await supabaseClient
      .from('car_rentals')
      .insert(carRentalData)
      .select()
      .single();

    if (carRentalError) {
      console.error('Car rental record creation error:', carRentalError);
    }

    // Process booking with car rental provider
    const providerBooking = await carRentalClient.createBooking({
      carId: selectedCar.id,
      customer: contactInfo,
      license: driverLicense,
      insurance: insuranceOptions
    });

    // Update booking with confirmation
    const confirmationCode = providerBooking.confirmationCode;
    await supabaseClient
      .from('bookings')
      .update({
        status: 'confirmed',
        booking_reference: confirmationCode,
        provider_confirmation_code: providerBooking.bookingId
      })
      .eq('id', booking.id);

    // Update car rental record
    if (carRental) {
      await supabaseClient
        .from('car_rentals')
        .update({
          status: 'confirmed',
          confirmation_code: confirmationCode
        })
        .eq('id', carRental.id);
    }

    await agent.logActivity(userId, 'car_rental_booked', {
      bookingId: booking.id,
      confirmationCode,
      company: selectedCar.company,
      vehicleClass: selectedCar.vehicleClass,
      totalCost
    });

    // Store booking in memory
    await memory?.setMemory(
      'car-rental-booking-assistant',
      userId,
      'recent_rental',
      {
        bookingId: booking.id,
        confirmationCode,
        status: 'confirmed',
        pickupInstructions: providerBooking.pickupInstructions
      },
      undefined,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    );

    return {
      success: true,
      result: {
        bookingConfirmation: {
          bookingId: booking.id,
          confirmationCode,
          status: 'confirmed',
          totalCost,
          currency: selectedCar.price.currency
        },
        vehicleDetails: {
          company: selectedCar.company,
          model: selectedCar.model,
          class: selectedCar.vehicleClass,
          features: selectedCar.features
        },
        rentalPeriod: {
          pickup: { location: pickupLocation, time: pickupTime },
          dropoff: { location: dropoffLocation, time: dropoffTime },
          duration: `${Math.ceil((new Date(dropoffTime).getTime() - new Date(pickupTime).getTime()) / (1000 * 60 * 60 * 24))} days`
        },
        driverRequirements: {
          licenseValidated: true,
          minimumAge: selectedCar.requirements.minimumAge,
          additionalDrivers: additionalDrivers.length
        },
        insuranceCoverage: insuranceOptions,
        pickupInstructions: providerBooking.pickupInstructions,
        nextSteps: [
          'Bring confirmation code and valid driver license',
          'Arrive 30 minutes before pickup time',
          'Inspect vehicle before accepting',
          'Keep rental agreement and contact numbers handy'
        ]
      }
    };

  } catch (error) {
    console.error('Car rental booking error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process car rental booking'
    };
  }
};