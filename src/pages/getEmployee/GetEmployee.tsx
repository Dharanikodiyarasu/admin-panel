import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../modal/Modal';
import './GetEmployee.css';
import '../../styles/global.css';
import editIcon from '../../assests/edit-icon.png';
import deleteIcon from '../../assests/delete-icon.png';

interface DemoEntity {
  id: number;
  name: string;
  dob: string;
  email: string;
  phoneNo: string;
  status: string;
  roleName: string;

}

const GetEmployee: React.FC = () => {
  const [employees, setEmployees] = useState<DemoEntity[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<DemoEntity | null>(null);
  const [editForm, setEditForm] = useState<Partial<DemoEntity>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof DemoEntity, string>>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<number | null>(null);

  const token = localStorage.getItem('token');
  const roleName = localStorage.getItem('role');


  const apiFetch = (url: string, options: RequestInit = {}) => {
    return fetch(`http://localhost:8080/api${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
  };

  const fetchEmployees = async (pageNum: number = 1) => {
    try {
        const adminId =localStorage.getItem('adminId');
      const res = await apiFetch(`/get-users?page=${pageNum}&size=10&adminId=${adminId}`);
      const result = await res.json();
      const dataArray: DemoEntity[] = Array.isArray(result.data) ? result.data : [];
      setEmployees(dataArray);
 
      const total = typeof result.total === 'number' ? result.total : dataArray.length;
      const size = typeof result.size === 'number' ? result.size : 10;
   
      setTotalPages(Math.max(1, Math.ceil(total / size)));
      setError(null);
    } catch (e: any) {
      console.error('Fetch error:', e);
      setError(e?.message || 'Failed to fetch employees');
    }
  };

  useEffect(() => {
    fetchEmployees(page);
  }, [page]);

  const openAddModal = () => {
    setModalMode('add');
    setEditForm({});
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (emp: DemoEntity) => {
    setEditingEmployee(emp);
    setEditForm({
      name: emp.name,
      dob: emp.dob,
      email: emp.email,
      phoneNo: emp.phoneNo
    });
    setModalMode('edit');
    setFormErrors({});
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof DemoEntity, string>> = {};
    if (!editForm.name) errors.name = 'Name is required';
    if (!editForm.dob) errors.dob = 'DOB is required';
    if (!editForm.email) errors.email = 'Email is required';
    else if (!editForm.email.includes('@')) errors.email = 'Invalid email';
    if (!editForm.phoneNo) errors.phoneNo = 'Phone number is required';
    else if (editForm.phoneNo.length !== 10) errors.phoneNo = 'Phone must be 10 digits';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveNewEmployee = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const res = await apiFetch('/save-user', {
        method: 'POST',
        body: JSON.stringify({
          name: editForm.name,
          dob: editForm.dob,
          email: editForm.email,
          phoneNo: editForm.phoneNo,
          roleName: 'USER'
        })
      });
      const data = await res.json();
      if (data.code === '0000') {
        toast.success('User added successfully!');
        setShowModal(false);
        fetchEmployees(page);
      } else {
        toast.error(data.message || 'Failed to add user');
      }
    } catch (e) {
      console.error('Add error:', e);
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!validateForm() || !editingEmployee) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/update-user/${editingEmployee.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name,
          dob: editForm.dob,
          email: editForm.email,
          phoneNo: editForm.phoneNo
        })
      });
      const data = await res.json();
      if (data.code === '0000') {
        toast.success('User updated!');
        setShowModal(false);
        fetchEmployees(page);
      } else {
        toast.error(data.message || 'Failed to update user');
      }
    } catch (e) {
      console.error('Update error:', e);
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      await apiFetch(`/toggle-status/${id}`, { method: 'PUT' });
      toast.success('Status updated');
      fetchEmployees(page);
    } catch (e) {
      console.error('Toggle error:', e);
      toast.error('Failed to update status');
    }
  };

  const deleteEmployee = async () => {
    if (deleteEmployeeId === null) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/delete-user/${deleteEmployeeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.code === '0000') {
        toast.success('User deleted successfully!');
        fetchEmployees(page);
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (e) {
      console.error('Delete error:', e);
      toast.error('Server error');
    } finally {
      setShowModal(false);
      setShowDeleteModal(false);
      setDeleteEmployeeId(null);
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h2>Admin Panel</h2>
      <div className="content-card">
        <div className="top-bar">
          {roleName !== 'SUPER ADMIN' && (
            <button onClick={openAddModal} className="button">+ Add</button>
          )}
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
                <th>Name</th>
                <th>DOB</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees
                .filter(emp =>
                  emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  emp.phoneNo.includes(searchQuery) ||
                  emp.id.toString().includes(searchQuery))
                .map((emp, index) => (
                  <tr key={emp.id}>
                    <td>{index + 1 + (page - 1) * 10}</td>
                    <td>{emp.name}</td>
                    <td>{emp.dob}</td>
                    <td>{emp.email}</td>
                    <td>{emp.phoneNo}</td>
                    <td>
                      <button
                        className={`action-button ${emp.status === 'active' ? 'block-btn' : 'unblock-btn'}`}
                        onClick={() => toggleStatus(emp.id)}>
                        {emp.status === 'active' ? 'Block' : 'Unblock'}
                      </button>

                      <button
                        className="icon-button"
                        onClick={() => openEditModal(emp)}
                        disabled={emp.status !== 'active'}
                        title="Edit"
                      >
                        <img src={editIcon} alt="Edit" width="18" height="18" />
                      </button>

                      <button
                        className="icon-button"
                        onClick={() => {
                          setDeleteEmployeeId(emp.id);
                          setShowDeleteModal(true);
                        }}
                        disabled={emp.status !== 'active'}
                        title="Delete"
                      >
                        <img src={deleteIcon} alt="Delete" width="18" height="18" />
                      </button>
                    </td>
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

      {showModal && (
        <Modal title={modalMode === 'add' ? 'Add New User' : `Edit User ID: ${editingEmployee?.id}`} onClose={() => setShowModal(false)}>
          <form
            className="modal-form"
            onSubmit={e => { e.preventDefault(); modalMode === 'add' ? saveNewEmployee() : saveEdit(); }}
          >
            <input
              type="text" name="name" placeholder="Name" value={editForm.name || ''} onChange={handleInputChange} />
            {formErrors.name && <div className="field-error">{formErrors.name}</div>}
            <input
              type="date" name="dob" value={editForm.dob || ''} onChange={handleInputChange} />
            {formErrors.dob && <div className="field-error">{formErrors.dob}</div>}
            <input
              type="email" name="email" placeholder="Email" value={editForm.email || ''} onChange={handleInputChange} />
            {formErrors.email && <div className="field-error">{formErrors.email}</div>}
            <input
              type="text" name="phoneNo" placeholder="Phone" value={editForm.phoneNo || ''} onChange={handleInputChange} />
            {formErrors.phoneNo && <div className="field-error">{formErrors.phoneNo}</div>}
            <div className="modal-actions">
              <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Are you sure you want to delete?</h4>
            <div className="modal-buttons">
              <button onClick={deleteEmployee}>OK</button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GetEmployee;
