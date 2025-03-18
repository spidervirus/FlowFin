'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CurrencyCode, getUserCurrency } from '@/lib/utils';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}

// Create the context with a default value
export const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
});

// Export the hook as a named export
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get the user's currency from localStorage
    const userCurrency = getUserCurrency();
    setCurrency(userCurrency);
    setIsLoaded(true);
  }, []);

  const updateCurrency = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    
    // Update localStorage
    try {
      const setupDataStr = localStorage.getItem("setupData");
      let setupData = setupDataStr ? JSON.parse(setupDataStr) : {};
      
      localStorage.setItem("setupData", JSON.stringify({
        ...setupData,
        currency: newCurrency,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      console.error("Error updating currency in localStorage:", e);
    }
  };

  // Only render children once the currency is loaded from localStorage
  if (!isLoaded) {
    return null;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: updateCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
} 