import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      setToken(token); // Store token in context/localStorage
      navigate('/');   // Redirect to main app
    } else if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`);
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [navigate, setToken]);

  return <div className="text-center text-white mt-10">Processing login...</div>;
};

export default OAuthCallback; 