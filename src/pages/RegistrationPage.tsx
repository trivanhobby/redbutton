import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from '@iconify/react';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const RegistrationPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { register } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const errorFromQuery = params.get('error');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await register(email, password, '');
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
        {(error || errorFromQuery) && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
            {error || errorFromQuery}
          </div>
        )}
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
            <label htmlFor="confirmPassword" className="block text-gray-300 mb-1">Confirm Password</label>
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
        </form>
        {/* Social login buttons */}
        <div className="mt-6 flex flex-row gap-4 justify-center">
          <button
            className="flex items-center justify-center bg-white text-black p-3 rounded-full hover:bg-gray-100 border border-gray-300"
            onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}
            aria-label="Sign up with Google"
          >
            <Icon icon="flat-color-icons:google" className="h-6 w-6" />
          </button>
          {/* <button
            className="flex items-center justify-center bg-[#1877f2] text-white p-3 rounded-full hover:bg-[#145db2] border border-[#1877f2]"
            onClick={() => window.location.href = `${API_BASE_URL}/auth/facebook`}
            aria-label="Sign up with Facebook"
          >
            <Icon icon="logos:facebook" className="h-6 w-6" />
          </button>
          <button
            className="flex items-center justify-center bg-black text-white p-3 rounded-full hover:bg-gray-900 border border-black"
            onClick={() => window.location.href = `${API_BASE_URL}/auth/apple`}
            aria-label="Sign up with Apple"
          >
            <Icon icon="logos:apple" className="h-6 w-6" />
          </button> */}
        </div>
        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-primary hover:underline text-sm"
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage; 