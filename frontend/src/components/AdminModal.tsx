import React, { useState, useEffect } from 'react';
import type { User, AdminStats } from '../types/auth';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, token }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/v1/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (err: any) {
      setMessage('Failed to load admin metrics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: 'USER' | 'ADMIN') => {
    const newRole = currentRole === 'USER' ? 'ADMIN' : 'USER';
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        setMessage(`Updated user role to ${newRole}`);
      } else {
        const data = await res.json();
        setMessage(data.detail || 'Could not update role');
      }
    } catch (err: any) {
      setMessage('Error updating role: ' + err.message);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (res.ok) {
        setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: newStatus } : u)));
        setMessage(`User account ${newStatus ? 'activated' : 'deactivated'}`);
      } else {
        const data = await res.json();
        setMessage(data.detail || 'Could not update status');
      }
    } catch (err: any) {
      setMessage('Error updating status: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        setMessage('User deleted successfully');
      } else {
        const data = await res.json();
        setMessage(data.detail || 'Could not delete user');
      }
    } catch (err: any) {
      setMessage('Error deleting user: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(21, 23, 27, 0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#25272C',
        border: '1px solid #363940',
        borderRadius: '16px',
        width: '95%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
        boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        color: '#FFFFFF',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #363940', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
              LisanHealth Administrator Panel
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#B8F7E4', fontWeight: 600 }}>
              RBAC & Database Governance {stats?.activeAdmin ? `(${stats.activeAdmin})` : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8A8F98',
              cursor: 'pointer',
              fontSize: '1.35rem',
              padding: '0.25rem',
            }}
          >
            ✕
          </button>
        </div>

        {message && (
          <div style={{
            background: 'rgba(184, 247, 228, 0.1)',
            border: '1px solid #B8F7E4',
            color: '#B8F7E4',
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}>
            {message}
          </div>
        )}

        {/* Stats Row */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: '#1D1E22', padding: '1rem', borderRadius: '10px', border: '1px solid #363940' }}>
              <div style={{ fontSize: '0.75rem', color: '#8A8F98', textTransform: 'uppercase', fontWeight: 700 }}>Total Registered Users</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B8F7E4', marginTop: '0.25rem' }}>{stats.totalUsers}</div>
            </div>
            <div style={{ background: '#1D1E22', padding: '1rem', borderRadius: '10px', border: '1px solid #363940' }}>
              <div style={{ fontSize: '0.75rem', color: '#8A8F98', textTransform: 'uppercase', fontWeight: 700 }}>Clinical Reports Logged</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.25rem' }}>{stats.totalReports}</div>
            </div>
            <div style={{ background: '#1D1E22', padding: '1rem', borderRadius: '10px', border: '1px solid #363940' }}>
              <div style={{ fontSize: '0.75rem', color: '#8A8F98', textTransform: 'uppercase', fontWeight: 700 }}>Database Infrastructure</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#B8F7E4', marginTop: '0.5rem' }}>{stats.dbStatus}</div>
            </div>
            <div style={{ background: '#1D1E22', padding: '1rem', borderRadius: '10px', border: '1px solid #363940' }}>
              <div style={{ fontSize: '0.75rem', color: '#8A8F98', textTransform: 'uppercase', fontWeight: 700 }}>Addis AI Localization</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#B8F7E4', marginTop: '0.5rem' }}>{stats.ai_providers.provider_b}</div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#FFFFFF' }}>User Management & Roles</h3>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#8A8F98' }}>Loading users...</div>
        ) : (
          <div style={{ overflowX: 'auto', background: '#1D1E22', borderRadius: '10px', border: '1px solid #363940' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #363940', color: '#8A8F98' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>User</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #2C2F36' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#FFFFFF' }}>{u.full_name}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#A0A6B1' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: u.role === 'ADMIN' ? 'rgba(184, 247, 228, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        color: u.role === 'ADMIN' ? '#B8F7E4' : '#A0A6B1',
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        color: u.is_active ? '#34D399' : '#F87171',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          style={{
                            background: '#25272C',
                            border: '1px solid #363940',
                            color: '#FFFFFF',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => handleStatusToggle(u.id, u.is_active)}
                          style={{
                            background: '#25272C',
                            border: '1px solid #363940',
                            color: u.is_active ? '#F87171' : '#34D399',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#FCA5A5',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
