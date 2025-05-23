import { useState, useEffect } from 'react';
import { getAuthToken } from '../utils/api';
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

interface Product {
  id: string;
  name: string;
  description: string;
  trialDays: number;
}

interface SubscriptionStatus {
  isSubscribed: boolean;
  subscriptionType: 'monthly' | 'yearly' | null;
  subscriptionEnd: string | null;
  activeProductId: string | null;
}

interface SubscriptionData {
  products: {
    monthly: Product;
    yearly: Product;
  };
  status: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
}

export const useSubscription = () => {
  const [data, setData] = useState<SubscriptionData>({
    products: {
      monthly: { id: '', name: '', description: '', trialDays: 0 },
      yearly: { id: '', name: '', description: '', trialDays: 0 }
    },
    status: null,
    isLoading: true,
    error: null
  });

  // Fetch products and status
  const fetchSubscriptionData = async () => {
    const token = getAuthToken();
    if (!token) return;

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch products
      const productsRes = await fetch(API_BASE_URL + '/api/subscription/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      const productsData = await productsRes.json();

      // Fetch status
      const statusRes = await fetch(API_BASE_URL + '/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!statusRes.ok) throw new Error('Failed to fetch status');
      const statusData = await statusRes.json();

      setData({
        products: productsData.data,
        status: statusData.data,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subscription data'
      }));
    }
  };

  // Create checkout session
  const createCheckoutSession = async (productId: string): Promise<string | null> => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const res = await fetch(API_BASE_URL + '/api/subscription/create-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });

      if (!res.ok) throw new Error('Failed to create checkout session');
      
      const data = await res.json();
      return data.data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  };

  // Initialize data
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchSubscriptionData();
    }
  }, []);

  return {
    ...data,
    refresh: fetchSubscriptionData,
    createCheckoutSession
  };
}; 