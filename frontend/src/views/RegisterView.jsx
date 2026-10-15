import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validatePhone, validateEmail } from '../utils/formatters';
import { UserPlus, Mail, Key, User, Phone, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

export const RegisterView = ({ setView }) => {
  const { register } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isPhoneValid = phone.trim().length === 0 || validatePhone(phone);
  const isEmailValid = email.trim().length === 0 || validateEmail(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      toast.warning('Invalid email address format.');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9820011223).');
      toast.warning('Invalid Indian mobile number.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      toast.warning('Password too short.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({ fullName, email, phone, password });
      const name = res?.user?.fullName || res?.fullName || fullName;
      toast.success(`Welcome to ParkCloud, ${name}! Account verified.`);
      setView('dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
      toast.error(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '30px auto' }}>
      <div className="glass-card" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-success)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
          }}>
            <UserPlus size={26} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>Create an Account</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Book parking slots instantly across Indian cities
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rahul Sharma"
                style={{ paddingLeft: '38px' }}
              />
              <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className={`form-input ${!isEmailValid ? 'input-invalid' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul.sharma@example.com"
                style={{ paddingLeft: '38px' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            </div>
            {!isEmailValid && (
              <span style={{ fontSize: '11px', color: 'var(--accent-danger)', marginTop: '4px', display: 'block' }}>
                Please enter a valid email format
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Indian Mobile Number</label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                required
                className={`form-input ${!isPhoneValid ? 'input-invalid' : ''}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9820011223"
                style={{ paddingLeft: '38px' }}
              />
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            </div>
            <span style={{ fontSize: '11px', color: isPhoneValid ? 'var(--text-muted)' : 'var(--accent-danger)', marginTop: '4px', display: 'block' }}>
              {isPhoneValid ? '10-digit Indian mobile number (e.g. 9820011223)' : 'Must be valid 10-digit number starting with 6, 7, 8, or 9'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
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
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Minimum 8 characters with at least one letter and number
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '12px', fontSize: '14px', fontWeight: '700' }}
          >
            {submitting ? 'Creating Account in RDS...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <span
            onClick={() => setView('login')}
            style={{ color: 'var(--accent-primary)', fontWeight: '700', cursor: 'pointer' }}
          >
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
};
