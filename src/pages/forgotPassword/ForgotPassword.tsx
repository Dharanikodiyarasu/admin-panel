import React, { useState } from 'react';
import './ForgotPassword.css';
import { useNavigate } from 'react-router-dom';


const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();


    const handleForgotPassword = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            setMessage(data.message);
        } catch (err) {
            setMessage('Something went wrong while sending the reset email.');
        }
    };

    return (
        <div className="forgot-password-container">
            <h2>Forgot Password</h2>
            <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handleForgotPassword}>Send Reset Mail</button>
            <button
                type="button"
                className="backlogin"
                style={{ marginTop: '10px', backgroundColor: '#ccc', color: '#000' }}
                onClick={() => navigate('/login')}
            >
                Back to Login
            </button>
            <p>{message}</p>
        </div>
    );
};

export default ForgotPassword;
