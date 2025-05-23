import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get token from URL query parameters
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const error = params.get('error');

        if (error) {
          throw new Error(error);
        }

        if (!token) {
          throw new Error('No token received');
        }

        // Set the JWT token directly
        await setToken(token);
        
        // Redirect to main app
        navigate('/');
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        navigate(`/login?error=${encodeURIComponent(err instanceof Error ? err.message : 'oauth_failed')}`);
      }
    };

    handleOAuthCallback();
  }, [navigate, setToken, location]);

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  return <div className="text-center text-white mt-10">Processing login...</div>;
};

export default OAuthCallback; 