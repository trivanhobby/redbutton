import React, { useState } from 'react';

const AdminPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  
  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !adminSecret) {
      setError('Email and admin secret are required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setInviteLink(null);
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
      
      setInviteLink(data.inviteUrl);
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full bg-card shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Invite Generator</h1>
        
        {error && (
          <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleGenerateInvite} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-300 mb-1">
              Email to Invite
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="user@example.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="adminSecret" className="block text-gray-300 mb-1">
              Admin Secret Key
            </label>
            <input
              id="adminSecret"
              type="password"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="Enter admin secret key"
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
                Generating...
              </>
            ) : (
              'Generate Invite Link'
            )}
          </button>
        </form>
        
        {inviteLink && (
          <div className="mt-8 p-4 bg-gray-800 rounded-md">
            <h2 className="text-lg font-semibold text-white mb-2">Invitation Generated!</h2>
            
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-1">
                Invite Link:
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded-l text-white text-sm"
                />
                <button
                  onClick={() => copyToClipboard(inviteLink)}
                  className="bg-gray-700 hover:bg-gray-600 px-3 rounded-r text-white"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm mb-1">
                Invite Token:
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={inviteToken || ''}
                  readOnly
                  className="w-full p-2 bg-gray-900 border border-gray-700 rounded-l text-white text-sm"
                />
                <button
                  onClick={() => copyToClipboard(inviteToken || '')}
                  className="bg-gray-700 hover:bg-gray-600 px-3 rounded-r text-white"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>
            This tool is for administrators only. The generated link will be valid for 7 days.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage; 