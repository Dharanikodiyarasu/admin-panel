import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';


const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    return expiry < now;
  } catch (e) {
    return true;
  }
};

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);

    const token = localStorage.getItem('token');
    if (isTokenExpired(token)) {
      setSessionExpired(true);
      setShowLogoutModal(true);
    }
  }, []);


  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (isTokenExpired(token)) {
      setSessionExpired(true);
      setShowLogoutModal(true); 
    } else {
      setSessionExpired(false);
      setShowLogoutModal(true); 
    }
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('adminId');
    localStorage.removeItem('name');
    window.dispatchEvent(new Event('storage'));
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="sidebar">
      <h3>Admin</h3>
      <NavLink to="/dashboard" className="sidebar-link">Dashboard</NavLink>

      {role === 'SUPER ADMIN' && (
        <NavLink to="/admin" className="sidebar-link">Admin</NavLink>
      )}

      <NavLink to="/users" className="sidebar-link">Users</NavLink>

      <NavLink to="#" className="sidebar-link" onClick={handleLogoutClick}>
        Logout
      </NavLink>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>
              {sessionExpired
                ? 'Session expired. Please login again.'
                : 'Are you sure you want to Logout?'}
            </h4>

            <div className="modal-buttons">
              <button onClick={confirmLogout}>OK</button>
              {<button onClick={cancelLogout}>Cancel</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
