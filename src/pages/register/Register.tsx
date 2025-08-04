import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../login/login.css';
import loginBackground from '../../assests/chat.jpg';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const generate16DigitId = () => {
    return Math.random().toString().slice(2, 18).padEnd(16, '0');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !name) {
      toast.error("All fields are required");
      return;
    }

    const id = generate16DigitId();

    try {
      const response = await fetch('http://localhost:8080/api/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name,
          email,
          password,
          roleName: 'ADMIN'
        }),
      });

      const data = await response.json();

      if (data.code === "0000") {
        toast.success("Registered Successfully!");
        navigate('/login');
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Server error");
      console.error(error);
    }
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
      <form className="login-form" onSubmit={handleRegister} style={{ zIndex: 1 }}>
        <h2 className="login-title">Registration</h2>

        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
          />
        </div>

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

        <button type="submit" className="login-button">Register</button>

        <p className="register-text">
          Already have an account?{' '}
          <span className="register-link" onClick={() => navigate('/login')}>
            Login Now
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
