import React, { useState } from 'react';

const AdminPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webInviteLink, setWebInviteLink] = useState<string | null>(null);
  const [desktopInviteLink, setDesktopInviteLink] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  
  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !adminSecret) {
      setError('Email and admin secret are required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setWebInviteLink(null);
    setDesktopInviteLink(null);
    setInviteToken(null);
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
      
      const response = await fetch(`${API_BASE_URL}/auth/admin/generate-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, adminSecret })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate invite');
      }
      
      setWebInviteLink(data.webInviteUrl);
      setDesktopInviteLink(data.desktopInviteUrl);
      setInviteToken(data.inviteToken);
    } catch (error: any) {
      setError(error.message || 'Error generating invite link');
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };
  
  return (
    <div className="p-8 max-w-2xl mx-auto bg-card rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-white">Admin - Generate Invitation</h1>
      
      <form onSubmit={handleGenerateInvite} className="mb-8">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-700 rounded bg-surface text-white"
            placeholder="user@example.com"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="adminSecret" className="block text-sm font-medium text-gray-300 mb-2">
            Admin Secret Key
          </label>
          <input
            type="password"
            id="adminSecret"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            className="w-full p-2 border border-gray-700 rounded bg-surface text-white"
            placeholder="Enter admin secret key"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-opacity-90 text-white font-medium py-2 px-4 rounded transition"
        >
          {isLoading ? 'Generating...' : 'Generate Invite Link'}
        </button>
      </form>
      
      {error && (
        <div className="mb-6 p-4 bg-error bg-opacity-20 border border-error rounded-md text-white">
          {error}
        </div>
      )}
      
      {webInviteLink && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-white">Web Invitation Link:</h2>
          <div className="flex items-center">
            <div className="flex-1 p-3 bg-surface border border-gray-700 rounded-l-md text-white overflow-auto">
              <p className="text-sm break-all">{webInviteLink}</p>
            </div>
            <button
              onClick={() => copyToClipboard(webInviteLink)}
              className="bg-primary text-white p-3 rounded-r-md hover:bg-opacity-90"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-gray-400 text-sm">Share this link for browser access</p>
        </div>
      )}
      
      {desktopInviteLink && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-white">Desktop App Invitation Link:</h2>
          <div className="flex items-center">
            <div className="flex-1 p-3 bg-surface border border-gray-700 rounded-l-md text-white overflow-auto">
              <p className="text-sm break-all">{desktopInviteLink}</p>
            </div>
            <button
              onClick={() => copyToClipboard(desktopInviteLink)}
              className="bg-redbutton text-white p-3 rounded-r-md hover:bg-opacity-90"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-gray-400 text-sm">Share this link for direct desktop app registration</p>
        </div>
      )}
      
      {inviteToken && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-white">Invite Token:</h2>
          <div className="flex items-center">
            <div className="flex-1 p-3 bg-surface border border-gray-700 rounded-l-md text-white overflow-auto">
              <p className="text-sm break-all">{inviteToken}</p>
            </div>
            <button
              onClick={() => copyToClipboard(inviteToken)}
              className="bg-primary text-white p-3 rounded-r-md hover:bg-opacity-90"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-gray-400 text-sm">Token for manual registration</p>
        </div>
      )}
    </div>
  );
}

export default AdminPage; 