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
  const [usersData, setUsersData] = useState([
    { name: 'Active', users: 0, color: '#28a745' },
    { name: 'Blocked', users: 0, color: '#dc3545' },
    { name: 'Total', users: 0, color: '#005782' },
    { name: 'Admin', users: 0, color: '#c0bc0bff' },

  ]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await apiFetch('/user-count');
        const data = await res.json();
        if (data.code === '0000') {
          setUsersData([
            { name: 'Active', users: data.active, color: '#28a745' },
            { name: 'Blocked', users: data.blocked, color: '#dc3545' },
            { name: 'Total', users: data.total, color: '#005782' },
            { name: 'Admin', users: data.admin, color: '#c0bc0bff' },

          ]);
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
