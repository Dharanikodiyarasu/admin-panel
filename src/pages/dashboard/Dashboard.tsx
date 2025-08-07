import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../config/Api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import './Dashboard.css';

export interface DemoEntity {
  id: number;
  name: string;
  dob: string;
  email: string;
  phoneNo: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const [usersData, setUsersData] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [name, setName] = useState<string>('');


  useEffect(() => {
    const userRole = localStorage.getItem('role');
    const userName = localStorage.getItem('name');
    setRole(userRole || '');
    setName(userName || '');

    const fetchCounts = async () => {
      try {
        const res = await apiFetch('/user-count');
        const data = await res.json();
        if (data.code === '0000') {
          const updatedData = [
            { name: 'Active', users: data.active, color: '#28a745' },
            { name: 'Blocked', users: data.blocked, color: '#dc3545' },
            { name: 'Total', users: data.total, color: '#005782' }
          ];

          if (userRole === 'SUPER ADMIN') {
            updatedData.push({ name: 'Admin', users: data.admin, color: '#c0bc0bff' });
          }

          setUsersData(updatedData);
        } else {
          console.error('Failed to fetch user count:', data.message);
        }
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h4>👋 Welcome, <span className="username">{name}</span></h4>
      </div>

      <h2>Dashboard</h2>
      <div className="summary-cards">
        {usersData.map((item) => (
          <div className="card small" key={item.name}>
            <h3>{item.name === 'Admin' ? 'Admin' : `${item.name} Users`}</h3>
            <p>{item.users}</p>
          </div>
        ))}
      </div>
      <div className="charts-row">
        <div className="card chart">
          <h3>User Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={usersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="users" barSize={40} radius={[6, 6, 0, 0]}>
                {usersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
