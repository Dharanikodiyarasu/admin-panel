import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password rules
  const [rules, setRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    specialChar: false,
  });

  useEffect(() => {
    setRules({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      specialChar: /[@$!%*?&]/.test(password),
    });
  }, [password]);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      toast.error('Both fields are required');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const allRulesPassed = Object.values(rules).every(Boolean);
    if (!allRulesPassed) {
      toast.error('Password does not meet complexity requirements');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (data.code === '0000') {
        toast.success('Password updated successfully!');
        navigate('/login');
      } else {
        toast.error(data.message || 'Reset failed');
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="reset-container">
      <h2>Reset Password</h2>
      <div className="form-group">
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ul className="password-rules">
          <li className={rules.length ? 'valid' : ''}>Minimum 8 characters</li>
          <li className={rules.uppercase ? 'valid' : ''}>At least 1 uppercase letter</li>
          <li className={rules.lowercase ? 'valid' : ''}>At least 1 lowercase letter</li>
          <li className={rules.digit ? 'valid' : ''}>At least 1 number</li>
          <li className={rules.specialChar ? 'valid' : ''}>At least 1 special character (@$!%*?&)</li>
        </ul>
      </div>

      <div className="form-group">
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {confirmPassword && (
          <p className={password === confirmPassword ? 'match' : 'mismatch'}>
            {password === confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
          </p>
        )}
      </div>

      <button onClick={handleReset}>Reset Password</button>
    </div>
  );
};

export default ResetPassword;
