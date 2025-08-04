import React, { useEffect, useState, useCallback } from 'react';
import '../../styles/global.css';

interface AdminEntity {
    id: number;
    adminId: number;
    name: string;
    email: string;
    roleName: string;
}

const GetAdmin: React.FC = () => {
    const [admins, setAdmins] = useState<AdminEntity[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const token = localStorage.getItem('token');

    const fetchAdmins = useCallback(async (pageNum = 1) => {
        try {
            const res = await fetch(`http://localhost:8080/api/all-admins`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (data.code === '0000') {
                const fullData = data.data || [];
                setAdmins(fullData);
                const size = 10;
                setTotalPages(Math.max(1, Math.ceil(fullData.length / size)));
                setError(null);
            } else {
                setError(data.message || 'Failed to fetch admins');
            }
        } catch (err: any) {
            console.error('Admin fetch error:', err);
            setError(err?.message || 'Failed to fetch admins');
        }
    }, [token]);

    useEffect(() => {
        fetchAdmins(page);
    }, [page, fetchAdmins]);

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.adminId.toString().includes(searchQuery) ||
        admin.id.toString().includes(searchQuery)
    );

    const pageSize = 10;
    const currentPageData = filteredAdmins.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="dashboard">
            <h2>Admin List</h2>
            <div className="content-card">
                <div className="top-bar">
                    <input
                        type="text"
                        placeholder="🔍 Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                {error && <div className="error-text">{error}</div>}

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>AdminId</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPageData.map(admin => (
                                <tr key={admin.id}>
                                    <td>{admin.id}</td>
                                    <td>{admin.adminId}</td>
                                    <td>{admin.name}</td>
                                    <td>{admin.email}</td>
                                    <td>{admin.roleName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Prev</button>
                    <span>Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Next</button>
                </div>
            </div>
        </div>
    );
};

export default GetAdmin;
