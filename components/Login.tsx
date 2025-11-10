import React, { useState, useEffect } from 'react';
import { 
    Auth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail 
} from 'firebase/auth';

interface LoginProps {
  auth: Auth;
}

type View = 'login' | 'register' | 'reset';

const Login: React.FC<LoginProps> = ({ auth }) => {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [view]);

  const handleLogin = async () => {
    if (!email || !password) return setError("Please fill in all fields.");
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (view === 'register') {
      if (!consent) return setError("You must agree to the Terms of Use and Privacy Policy.");
      if (password !== confirmPassword) return setError("Passwords do not match.");
      if (!email || !password) return setError("Please fill in all fields.");
      
      setLoading(true);
      setError('');
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    } else {
      setView('register');
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return setError("Please enter your email address.");
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset link sent! Check your email.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setConsent(false);
    setError('');
    setSuccess('');
  };

  const getTitle = () => {
    if (view === 'register') return 'Create Account';
    if (view === 'reset') return 'Reset Password';
    return 'OMNI-CORE AI TRADER';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex justify-center items-center z-50 p-4">
      <div className="bg-[var(--bg-secondary)]/70 p-7 rounded-2xl w-full max-w-sm text-center border border-[var(--border-color)]">
        <h2 className="text-[var(--accent-primary)] text-2xl font-bold mb-5">{getTitle()}</h2>

        <div className="space-y-4">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" 
            className="w-full px-4 py-3 bg-black/30 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            disabled={loading}
          />

          {view !== 'reset' && (
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" 
              className="w-full px-4 py-3 bg-black/30 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              disabled={loading}
            />
          )}

          {view === 'register' && (
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password" 
              className="w-full px-4 py-3 bg-black/30 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              disabled={loading}
            />
          )}
        </div>

        {view === 'register' && (
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-300">
            <input 
              type="checkbox" 
              id="consent" 
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="w-4 h-4 bg-transparent border-white/30 rounded focus:ring-[var(--accent-secondary)] text-[var(--accent-secondary)]"
              disabled={loading}
            />
            <label htmlFor="consent">I agree to the <a href="#" className="text-[var(--accent-secondary)]">Terms</a> & <a href="#" className="text-[var(--accent-secondary)]">Privacy Policy</a>.</label>
          </div>
        )}
        
        {error && <p className="text-[#ff0000] text-sm mt-4 min-h-[1.25rem]">{error}</p>}
        {success && <p className="text-[var(--success-color)] text-sm mt-4 min-h-[1.25rem]">{success}</p>}
        {!error && !success && <div className="min-h-[1.25rem] mt-4"></div>}
        
        {view === 'reset' ? (
          <div className="mt-2">
            <button onClick={handlePasswordReset} disabled={loading} className="w-full py-3.5 border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 shadow-lg bg-[var(--accent-secondary)] text-black disabled:bg-gray-600 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="flex gap-4">
              <button onClick={handleLogin} disabled={loading} className="flex-1 py-3.5 border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 shadow-lg bg-[var(--success-color)] text-black disabled:bg-gray-600 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? '...' : 'Login'}
              </button>
              <button onClick={handleRegister} disabled={loading} className="flex-1 py-3.5 border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 shadow-lg bg-[var(--accent-primary)] text-white disabled:bg-gray-600 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? '...' : 'Register'}
              </button>
            </div>
            <button onClick={handleReset} disabled={loading} className="w-full py-3.5 border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 shadow-lg bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-70 disabled:cursor-not-allowed">
              Reset Form
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-between text-sm">
          {view !== 'reset' && <a onClick={() => setView('reset')} className="text-[var(--accent-secondary)] cursor-pointer hover:underline">Forgot Password?</a>}
          {(view === 'register' || view === 'reset') && <a onClick={() => setView('login')} className="text-[var(--accent-secondary)] cursor-pointer hover:underline">Back to Login</a>}
        </div>
      </div>
    </div>
  );
};

export default Login;
