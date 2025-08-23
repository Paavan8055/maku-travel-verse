
import { createContext, useContext, useState, ReactNode } from 'react';

interface PaymentContextType {
  paymentMethod: string | null;
  setPaymentMethod: (method: string) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  processPayment: (amount: number, currency: string) => Promise<boolean>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const processPayment = async (amount: number, currency: string): Promise<boolean> => {
    setProcessing(true);
    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch (error) {
      return false;
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        paymentMethod,
        setPaymentMethod,
        processing,
        setProcessing,
        processPayment,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};
