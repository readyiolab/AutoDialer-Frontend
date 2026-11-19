import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Radio, ArrowRight } from 'lucide-react';

export const AcceptInvite = () => {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { acceptInvite } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const res = await acceptInvite(token, password);
    setLoading(false);
    if (res.success) {
      setSuccess('Password set. You can log in now.');
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setError(res.message || 'Failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <Radio className="w-10 h-10 text-blue-600 mx-auto mb-2" />
          <h2 className="text-xl font-black">Set your password</h2>
          <p className="text-xs text-gray-500">Complete your AutoDial Pro invitation</p>
        </div>
        {error && <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{error}</div>}
        {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold">Invitation token</label>
            <input
              className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold">New password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                className="w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold">Confirm password</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
          >
            {loading ? 'Saving...' : <>Activate account <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          <Link to="/login" className="text-blue-600 font-semibold">Back to login</Link>
        </p>
      </div>
    </div>
  );
};
