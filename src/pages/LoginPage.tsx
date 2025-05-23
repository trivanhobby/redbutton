import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from '@iconify/react';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const errorFromQuery = params.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold inline-flex items-center gap-2">
            <span className="text-redbutton">Red</span>
            <span className="text-greenbutton">Button</span>
          </Link>
          <h2 className="text-xl text-gray-300 mt-2">Sign in to your account</h2>
        </div>

        {(error || errorFromQuery) && (
          <div className="bg-red-900 text-white p-3 rounded-md mb-4">
            {error || errorFromQuery}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-opacity-90 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Social login buttons */}
        <div className="mt-6 flex flex-row gap-4 justify-center">
          <button
            className="flex items-center justify-center bg-white text-black p-3 rounded-full hover:bg-gray-100 border border-gray-300"
            onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}
            aria-label="Sign in with Google"
          >
            <Icon icon="flat-color-icons:google" className="h-6 w-6" />
          </button>
          <button
            className="flex items-center justify-center bg-[#1877f2] text-white p-3 rounded-full hover:bg-[#145db2] border border-[#1877f2]"
            onClick={() => window.location.href = `${API_BASE_URL}/auth/facebook`}
            aria-label="Sign in with Facebook"
          >
            <Icon icon="logos:facebook" className="h-6 w-6" />
          </button>
          <button
            className="flex items-center justify-center bg-black text-white p-3 rounded-full hover:bg-gray-900 border border-black"
            onClick={() => window.location.href = `${API_BASE_URL}/auth/apple`}
            aria-label="Sign in with Apple"
          >
            <Icon icon="logos:apple" className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 