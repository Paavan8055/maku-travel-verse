// Shared API clients for external services

export class AmadeusClient {
  private baseUrl: string;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(private clientId: string, private clientSecret: string, private environment = 'test') {
    this.baseUrl = environment === 'production' 
      ? 'https://api.amadeus.com' 
      : 'https://test.api.amadeus.com';
  }

  async authenticate(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      })
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
  }

  async makeRequest(endpoint: string, params: any = {}): Promise<any> {
    if (!this.accessToken || Date.now() >= (this.tokenExpiry || 0)) {
      await this.authenticate();
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });

    return response.json();
  }
}

export class StripeClient {
  constructor(private secretKey: string) {}

  async createPaymentIntent(amount: number, currency = 'usd', metadata = {}): Promise<any> {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency,
        'metadata[source]': 'maku_travel',
        ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`metadata[${k}]`, String(v)]))
      })
    });

    return response.json();
  }

  async processRefund(paymentIntentId: string, amount?: number): Promise<any> {
    const body: any = { payment_intent: paymentIntentId };
    if (amount) body.amount = amount.toString();

    const response = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body)
    });

    return response.json();
  }
}

export class SendGridClient {
  constructor(private apiKey: string) {}

  async sendEmail(to: string, subject: string, content: string, templateId?: string): Promise<any> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'noreply@maku.travel', name: 'MAKU Travel' },
        subject,
        content: [{ type: 'text/html', value: content }],
        template_id: templateId
      })
    });

    return response.json();
  }
}

export class HotelBedsClient {
  constructor(
    private apiKey: string, 
    private secret: string,
    private environment = 'test'
  ) {}

  private createSignature(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    return btoa(`${this.apiKey}${this.secret}${timestamp}`);
  }

  async searchHotels(params: any): Promise<any> {
    const signature = this.createSignature();
    const baseUrl = this.environment === 'production' 
      ? 'https://api.hotelbeds.com' 
      : 'https://api.test.hotelbeds.com';

    const response = await fetch(`${baseUrl}/hotel-api/1.0/hotels`, {
      method: 'POST',
      headers: {
        'Api-key': this.apiKey,
        'X-Signature': signature,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    return response.json();
  }
}