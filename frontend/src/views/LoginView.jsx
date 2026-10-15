import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogIn, Key, Mail, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

export const LoginView = ({ setView }) => {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(email, password);
      const name = res?.user?.fullName || res?.fullName || 'User';
      toast.success(`Welcome back, ${name}! Connected to Mumbai AWS cluster.`);
      setView('dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = (userType) => {
    if (userType === 'admin') {
      setEmail('admin@parkcloud.in');
      setPassword('Admin@ParkCloud2026!');
      toast.info('Loaded ParkCloud Administrator credentials.');
    } else {
      setEmail('rahul.sharma@example.com');
      setPassword('User@ParkCloud2026!');
      toast.info('Loaded Demo User (Rahul Sharma) credentials.');
    }
    setError('');
  };

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto' }}>
      <div className="glass-card" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: 'var(--accent-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
          }}>
            <LogIn size={26} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Welcome Back</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sign in to access your smart parking dashboard & active passes
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Credentials Fill Pills */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '12px 14px',
          marginBottom: '22px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '10px' }}>
            <Sparkles size={14} color="var(--accent-warning)" /> One-Click Quick Fill:
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleFillDemo('user')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '11px', padding: '6px 8px' }}
            >
              Demo User (Rahul)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '11px', padding: '6px 8px', borderColor: 'var(--accent-purple)' }}
            >
              Admin (Operations)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{ paddingLeft: '38px' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
              />
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '12px', fontSize: '14px', fontWeight: '700' }}
          >
            {submitting ? 'Authenticating with RDS...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <span
            onClick={() => setView('register')}
            style={{ color: 'var(--accent-primary)', fontWeight: '700', cursor: 'pointer' }}
          >
            Create free account
          </span>
        </div>
      </div>
    </div>
  );
};
