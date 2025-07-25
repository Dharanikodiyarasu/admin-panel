import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('adminId');
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
      
      {/* ✅ Show only if role is SUPER ADMIN */}
      {role === 'SUPER ADMIN' && (
        <NavLink to="/admin" className="sidebar-link">Admin</NavLink>
      )}
      <NavLink to="/users" className="sidebar-link">Users</NavLink>
      <NavLink to="/setting" className="sidebar-link">Settings</NavLink>
      <NavLink to="#" className="sidebar-link" onClick={handleLogoutClick}>
        Logout
      </NavLink>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Are you sure you want to Logout?</h4>
            <div className="modal-buttons">
              <button onClick={confirmLogout}>OK</button>
              <button onClick={cancelLogout}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
