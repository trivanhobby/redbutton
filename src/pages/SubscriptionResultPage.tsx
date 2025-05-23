import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';

const SubscriptionResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refresh } = useSubscription();

  const isSuccess = location.pathname.includes('/subscription/success');
  const isCancel = location.pathname.includes('/subscription/cancel');

  useEffect(() => {
    if (isSuccess) {
      refresh();
      // Redirect to settings after 2.5 seconds
      const timeout = setTimeout(() => {
        navigate('/settings');
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess, refresh, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {isSuccess && (
          <>
            <div className="text-green-400 text-4xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2">Subscription Successful!</h2>
            <p className="text-gray-300 mb-4">Thank you for subscribing. Your subscription is now active.</p>
            <p className="text-gray-400 text-sm">Redirecting to settings...</p>
          </>
        )}
        {isCancel && (
          <>
            <div className="text-red-400 text-4xl mb-4">✗</div>
            <h2 className="text-2xl font-bold mb-2">Subscription Canceled</h2>
            <p className="text-gray-300 mb-4">You have canceled or not completed the subscription process.</p>
            <button
              className="mt-4 px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              onClick={() => navigate('/settings')}
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionResultPage; 