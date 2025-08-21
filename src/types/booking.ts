export interface BookingPayload {
  [key: string]: unknown;
}

export interface BookingPaymentParams {
  bookingType: 'flight' | 'hotel' | 'activity' | 'package';
  bookingData: BookingPayload;
  amount: number;
  currency?: string;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  paymentMethod?: 'card' | 'fund' | 'split';
  fundAmount?: number;
}
