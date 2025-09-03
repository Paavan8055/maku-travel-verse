import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import logger from "../_shared/logger.ts";


interface SabreAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CarSearchParams {
  pickUpLocationCode: string;
  dropOffLocationCode?: string;
  pickUpDate: string;
  pickUpTime: string;
  dropOffDate: string;
  dropOffTime: string;
  driverAge?: number;
  currencyCode?: string;
}

async function getSabreAccessToken(): Promise<string> {
  const clientId = Deno.env.get('SABRE_CLIENT_ID');
  const clientSecret = Deno.env.get('SABRE_CLIENT_SECRET');
  const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api-crt.cert.havail.sabre.com';
  
  if (!clientId || !clientSecret) {
    throw new Error('Sabre credentials not configured');
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);

  logger.info('Authenticating with Sabre...');

  const response = await fetch(`${baseUrl}/v2/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Sabre authentication failed:', errorText);
    throw new Error(`Sabre auth failed: ${response.statusText}`);
  }

  const data: SabreAuthResponse = await response.json();
  logger.info('Successfully authenticated with Sabre');
  return data.access_token;
}

async function searchSabreCars(params: CarSearchParams, accessToken: string): Promise<any> {
  const baseUrl = Deno.env.get('SABRE_BASE_URL') || 'https://api-crt.cert.havail.sabre.com';
  
  const requestBody = {
    GetVehAvailRQ: {
      VehAvailRQCore: {
        VehRentalCore: {
          PickUpLocation: {
            LocationCode: params.pickUpLocationCode
          },
          ReturnLocation: {
            LocationCode: params.dropOffLocationCode || params.pickUpLocationCode
          },
          PickUpDateTime: `${params.pickUpDate}T${params.pickUpTime}:00`,
          ReturnDateTime: `${params.dropOffDate}T${params.dropOffTime}:00`
        },
        DriverType: {
          Age: params.driverAge || 25
        },
        VendorPrefs: {
          Vendor: {
            Code: "All"
          }
        },
        VehPrefs: {
          VehClass: {
            Size: "All"
          }
        },
        RateQualifier: {
          RateCategory: "16", // Standard rate
          PromotionCode: "",
          RateAuthority: "",
          VendorRateID: ""
        }
      },
      VehAvailRQInfo: {
        Customer: {
          Primary: {
            CitizenCountryName: {
              Code: "US"
            }
          }
        },
        TPA_Extensions: {
          ConsumerIP: "192.168.1.1"
        }
      }
    }
  };

  logger.info('Sabre car search request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${baseUrl}/v1/shop/cars`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Sabre car search failed:', errorText);
    throw new Error(`Sabre car search failed: ${response.statusText}`);
  }

  return await response.json();
}

function transformSabreCarResults(sabreResponse: any): any[] {
  const vehicles = sabreResponse?.GetVehAvailRS?.VehAvailRSCore?.VehVendorAvails || [];
  const cars: any[] = [];

  vehicles.forEach((vendor: any) => {
    const vendorVehicles = vendor.VehAvails || [];
    
    vendorVehicles.forEach((vehicle: any, index: number) => {
      const vehAvail = vehicle.VehAvailCore;
      const totalCharge = vehicle.VehAvailInfo?.PricedEquips?.TotalCharge;
      
      cars.push({
        id: `sabre-${vendor.Vendor?.CompanyShortName}-${index}`,
        vehicle: {
          category: vehAvail?.Vehicle?.VehClass?.Size || 'Standard',
          description: `${vehAvail?.Vehicle?.VehMakeModel?.Name || 'Vehicle'} or similar`,
          imageURL: '/assets/car-default.jpg',
          seats: parseInt(vehAvail?.Vehicle?.PassengerQuantity) || 5,
          doors: parseInt(vehAvail?.Vehicle?.BaggageQuantity) || 4,
          fuelType: vehAvail?.Vehicle?.FuelType || 'Gasoline',
          transmission: vehAvail?.Vehicle?.TransmissionType || 'Automatic',
          airConditioning: vehAvail?.Vehicle?.AirConditionInd === 'true',
          navigationSystem: false
        },
        vendor: {
          name: vendor.Vendor?.CompanyShortName || 'Car Rental',
          code: vendor.Vendor?.Code || 'XX',
          logoUrl: '/assets/vendor-default.jpg',
          contactNumber: vendor.Info?.LocationDetails?.Telephone?.PhoneNumber || ''
        },
        pickUp: {
          location: params.pickUpLocationCode,
          address: vendor.Info?.LocationDetails?.Address?.AddressLine || 'Pick-up location',
          coordinates: {
            latitude: 0,
            longitude: 0
          },
          dateTime: `${params.pickUpDate}T${params.pickUpTime}:00`
        },
        dropOff: {
          location: params.dropOffLocationCode || params.pickUpLocationCode,
          address: vendor.Info?.LocationDetails?.Address?.AddressLine || 'Drop-off location',
          coordinates: {
            latitude: 0,
            longitude: 0
          },
          dateTime: `${params.dropOffDate}T${params.dropOffTime}:00`
        },
        price: {
          currency: totalCharge?.CurrencyCode || params.currencyCode || 'USD',
          amount: parseFloat(totalCharge?.RateTotalAmount) || 0,
          convertedAmount: parseFloat(totalCharge?.RateTotalAmount) || 0,
          taxes: [],
          inclusions: ['Basic insurance', 'Unlimited mileage']
        },
        policies: {
          cancellation: {
            description: 'Free cancellation up to 24 hours before pickup'
          },
          paymentType: 'AT_PICKUP',
          guarantee: {
            description: 'Guaranteed availability with confirmed booking'
          }
        },
        extras: [
          {
            name: 'GPS Navigation',
            price: 15,
            currency: totalCharge?.CurrencyCode || 'USD',
            perDay: true
          },
          {
            name: 'Child Seat',
            price: 10,
            currency: totalCharge?.CurrencyCode || 'USD',
            perDay: true
          }
        ],
        source: 'sabre',
        originalData: vehicle
      });
    });
  });

  return cars;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: CarSearchParams = await req.json();
    
    logger.info('Sabre car search:', params);

    // Get Sabre access token
    const accessToken = await getSabreAccessToken();
    
    // Search for cars
    const carResults = await searchSabreCars(params, accessToken);
    
    // Transform results
    const transformedCars = transformSabreCarResults(carResults);
    
    logger.info('Sabre car search successful:', transformedCars.length, 'cars found');

    return new Response(JSON.stringify({
      success: true,
      cars: transformedCars,
      searchCriteria: params,
      totalResults: transformedCars.length,
      source: 'sabre'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logger.error('Sabre car search error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Car search failed',
      cars: [],
      source: 'sabre'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});