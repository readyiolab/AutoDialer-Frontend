import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Building2, ArrowRight, ShieldCheck } from 'lucide-react';

function formatAuthError(errMessage) {
  if (!errMessage) return 'Invalid email/mobile or password';
  if (Array.isArray(errMessage)) return errMessage.join(', ');
  if (typeof errMessage === 'object') return errMessage.message || 'Login failed';
  return String(errMessage);
}

export const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('ADEMO');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const id = identifier.trim();
    if (!id || !password) {
      setError('Enter your email or mobile number and password');
      return;
    }
    setLoading(true);
    const res = await login(id, password.trim(), companyCode.trim() || undefined);
    setLoading(false);
    if (res.success) {
      navigate(res.mustChangePassword ? '/change-password' : '/dashboard');
    } else {
      const msg = formatAuthError(res.message) || 'Invalid email/mobile or password';
      setError(
        /too many requests/i.test(msg)
          ? 'Too many sign-in attempts. Wait about a minute, then try again.'
          : msg,
      );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F7F8F4] flex">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(198,232,0,0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, rgba(15,23,42,0.06), transparent 50%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 flex-1 hidden lg:flex flex-col justify-between p-12 xl:p-16 max-w-xl">
        <div>
          <div className="inline-flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#C6E800] flex items-center justify-center shadow-sm">
              <span className="text-[#0F172A] font-black text-lg tracking-tight">AD</span>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight">AutoDial Pro</div>
              <div className="text-xs font-medium text-slate-500">Campaign CRM · Admin Portal</div>
            </div>
          </div>
        </div>

        <div className="space-y-6 pr-8">
          <h1 className="text-4xl xl:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Run campaigns.
            <br />
            <span className="text-slate-600">Lead teams clearly.</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md">
            Sign in to manage campaigns, upload leads, distribute work to telecallers, and monitor
            productivity. Telecallers use the Android autodialer app.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6E800]" />
              Campaign-wise lead isolation
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6E800]" />
              Equal distribution & MIS
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6E800]" />
              Live dialer monitoring
            </li>
          </ul>
        </div>

        <p className="text-[11px] text-slate-400">© {new Date().getFullYear()} AutoDial Pro</p>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#C6E800] flex items-center justify-center">
              <span className="text-[#0F172A] font-black text-base">AD</span>
            </div>
            <div>
              <div className="text-lg font-black text-slate-900">AutoDial Pro</div>
              <div className="text-[11px] text-slate-500">Admin Portal</div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur border border-slate-200/80 rounded-[28px] shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)] p-8 sm:p-9">
            <div className="mb-7">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin sign in</h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Use your work email or registered mobile number. Telecallers sign in on Android only.
              </p>
            </div>

            {error && (
              <div className="mb-5 px-3.5 py-3 rounded-2xl bg-rose-50 text-rose-700 text-sm font-medium border border-rose-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email or mobile number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@company.com or 10-digit mobile"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6E800]/40 focus:border-[#C6E800] transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6E800]/40 focus:border-[#C6E800] transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company code
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    placeholder="ADEMO"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C6E800]/40 focus:border-[#C6E800] transition-all font-medium tracking-wide"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Required when your login exists in more than one company. Default demo code is ADEMO.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/15"
              >
                {loading ? (
                  <span>Signing in…</span>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Encrypted session</span>
              </div>
              <Link to="/accept-invite" className="text-slate-700 font-semibold hover:text-slate-900">
                Accept invite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
