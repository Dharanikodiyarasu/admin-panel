import React, { JSX, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/login/login';
import GetEmployee from './pages/getEmployee/GetEmployee';
import Dashboard from './pages/dashboard/Dashboard';
import Sidebar from './pages/sidebar/Sidebar';
import Header from './pages/header/Header';
import Settings from './pages/setting/setting';
import Register from './pages/register/Register';
import Admin from './pages/admin/Admin';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import ResetPassword from './pages/resetPassword/ResetPassword';
import ForgotPassword from './pages/forgotPassword/ForgotPassword';


const App: React.FC = () => {
  const location = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem('token'));
      setRole(localStorage.getItem('role'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const showLayout = !!token && location.pathname !== '/login' && location.pathname !== '/register';

  const PrivateRoute = (element: JSX.Element) =>
    token ? element : <Navigate to="/login" />;


  const AdminRoute = (element: JSX.Element) =>
    token && (role === 'ADMIN' || role === 'SUPER ADMIN')
      ? element
      : token
        ? <Navigate to="/dashboard" />
        : <Navigate to="/login" />;


  return (
    <div className="app-container">
      {showLayout && <Header />}
      <div className="main-layout">
        {showLayout && <Sidebar />}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/dashboard" element={PrivateRoute(<Dashboard />)} />
            <Route path="/admin" element={AdminRoute(<Admin />)} />
            <Route path="/users" element={AdminRoute(<GetEmployee />)} />
            <Route path="/setting" element={AdminRoute(<Settings />)} />
            {/* <Route path="*" element={<Navigate to="/login" />} /> */}
          </Routes>
        </div>
      </div> 

      <ToastContainer
        position="top-right"
        autoClose={1200}
        hideProgressBar
        closeOnClick
        rtl={false}
        theme="colored"
      />
    </div>
  );
};

export default App;
