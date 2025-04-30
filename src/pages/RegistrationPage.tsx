import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegistrationPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { register, verifyInvite } = useAuth();
  
  // Extract token from URL on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    
    if (token) {
      setInviteToken(token);
      checkInvite(token);
    }
  }, [location.search]);
  
  // Verify invite token
  const checkInvite = async (token: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isValid = await verifyInvite(token);
      
      if (isValid) {
        setIsValidToken(true);
      } else {
        setError('Invalid or expired invite token.');
        setIsValidToken(false);
      }
    } catch (err) {
      setError('Failed to verify invite token. It may be expired or invalid.');
      setIsValidToken(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!isValidToken) {
      setError('Invalid invite token. Please check your invitation link.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await register(email, password, inviteToken);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Your Account</h2>
        
        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {isLoading && !isValidToken ? (
          <div className="text-center py-4">
            <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-400">Verifying your invitation...</p>
          </div>
        ) : (
          <>
            {!isValidToken && !isLoading ? (
              <div className="text-center py-4">
                <p className="text-gray-300 mb-4">
                  This registration link appears to be invalid or has expired.
                </p>
                <p className="text-gray-400">
                  Please check if you have the correct link or contact your administrator.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-gray-300 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter the email address associated with your invitation.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-gray-300 mb-1">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    required
                    minLength={8}
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-opacity-90 text-white py-2 px-4 rounded flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin h-5 w-5 border-t-2 border-white rounded-full mr-2"></span>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
                
                <div className="text-center mt-4">
                  <a
                    href="/login"
                    className="text-primary hover:underline text-sm"
                  >
                    Already have an account? Log in
                  </a>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RegistrationPage; 