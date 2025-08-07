import React, { useState } from 'react';
import './login.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import loginBackground from '../../assests/chat.jpg';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || (!password && !isForgotPassword)) {
      toast.error("All fields are required");
      return;
    }

    try {
      if (isForgotPassword) {
        const response = await fetch('http://localhost:8080/api/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (data.success) {
          toast.success("Password reset email sent!");
        } else {
          toast.error(data.message || "Email sending failed");
        }
      } else {
        const response = await fetch('http://localhost:8080/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.code === "0000") {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);
          localStorage.setItem('adminId', data.adminId);
          localStorage.setItem('name', data.name);

          window.dispatchEvent(new Event('storage'));
          toast.success('Login successful!');
          navigate('/dashboard');
        } else {
          toast.error(data.message || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Server error');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleForgotPasswordToggle = () => {
    setIsForgotPassword(true);
    setPassword('');
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `url(${loginBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <form className="login-form" onSubmit={handleLogin}>
        <h2 className="login-title">
          {isForgotPassword ? 'Forgot Password' : 'Login'}
        </h2>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
          />
        </div>

        {!isForgotPassword && (
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#555',
                }}
              >
                {showPassword ? '👁️' : '🔒'}
              </span>
            </div>
          </div>
        )}

        <button type="submit" className="login-button">
          {isForgotPassword ? 'Send Reset Email' : 'Login'}
        </button>

        {!isForgotPassword && (
          <p className="forgot-link" onClick={handleForgotPasswordToggle}>
            Forgot Password?
          </p>
        )}

        {!isForgotPassword && (
          <p className="register-text">
            Don’t have an account?{' '}
            <span className="register-link" onClick={handleRegister}>
              Register Now
            </span>
          </p>
        )}
      </form>
    </div>
  );
};

export default Login;
