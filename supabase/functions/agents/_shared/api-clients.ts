// API client wrappers for external services
export class AmadeusClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = Deno.env.get('AMADEUS_API_KEY') || '';
    this.apiSecret = Deno.env.get('AMADEUS_API_SECRET') || '';
    this.baseUrl = 'https://test.api.amadeus.com';
  }

  async searchFlights(params: any): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/v2/shopping/flight-offers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Amadeus flight search error:', error);
      throw new Error('Flight search failed');
    }
  }

  async searchHotels(params: any): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/v3/shopping/hotel-offers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Amadeus hotel search error:', error);
      throw new Error('Hotel search failed');
    }
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.apiSecret}`
    });
    
    const data = await response.json();
    return data.access_token;
  }
}

export class HotelBedsClient {
  private apiKey: string;
  private secret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = Deno.env.get('HOTELBEDS_API_KEY') || '';
    this.secret = Deno.env.get('HOTELBEDS_SECRET') || '';
    this.baseUrl = 'https://api.test.hotelbeds.com';
  }

  async searchHotels(params: any): Promise<any> {
    try {
      const signature = this.generateSignature();
      const response = await fetch(`${this.baseUrl}/hotel-api/1.0/hotels`, {
        method: 'POST',
        headers: {
          'Api-key': this.apiKey,
          'X-Signature': signature,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      return await response.json();
    } catch (error) {
      console.error('HotelBeds search error:', error);
      throw new Error('Hotel search failed');
    }
  }

  private generateSignature(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = this.apiKey + this.secret + timestamp;
    
    // Note: In production, use proper crypto library for SHA256
    return btoa(message + timestamp);
  }
}

export class StripeClient {
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.secretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
    this.baseUrl = 'https://api.stripe.com/v1';
  }

  async createPaymentIntent(params: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(params)
      });
      return await response.json();
    } catch (error) {
      console.error('Stripe payment intent error:', error);
      throw new Error('Payment processing failed');
    }
  }

  async processRefund(paymentIntentId: string, amount?: number): Promise<any> {
    try {
      const params: any = { payment_intent: paymentIntentId };
      if (amount) params.amount = amount;

      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(params)
      });
      return await response.json();
    } catch (error) {
      console.error('Stripe refund error:', error);
      throw new Error('Refund processing failed');
    }
  }
}

export class SendGridClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = Deno.env.get('SENDGRID_API_KEY') || '';
    this.baseUrl = 'https://api.sendgrid.com/v3';
  }

  async sendEmail(params: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      return await response.json();
    } catch (error) {
      console.error('SendGrid email error:', error);
      throw new Error('Email sending failed');
    }
  }
}

export class WeatherAPIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = Deno.env.get('WEATHER_API_KEY') || '';
    this.baseUrl = 'https://api.weatherapi.com/v1';
  }

  async getCurrentWeather(location: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodeURIComponent(location)}`
      );
      return await response.json();
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Weather data fetch failed');
    }
  }

  async getForecast(location: string, days: number = 7): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&days=${days}`
      );
      return await response.json();
    } catch (error) {
      console.error('Weather forecast error:', error);
      throw new Error('Weather forecast fetch failed');
    }
  }
}