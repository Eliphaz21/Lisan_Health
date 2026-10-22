import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, AlertShieldIcon, CheckIcon } from '../components/Icons';
import type { User, AdminStats, AuditLogItem, AiConfigData } from '../types/auth';

interface AdminPageProps {
  currentUser: User | null;
  token: string;
}

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser, token }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'ai' | 'logs'>('overview');
  
  // Data State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [aiConfig, setAiConfig] = useState<AiConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // New User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');
  const [submittingUser, setSubmittingUser] = useState(false);

  // AI Configuration Form State
  const [selectedProvider, setSelectedProvider] = useState<'addis_ai' | 'gemini_ai' | 'hybrid' | 'mock'>('addis_ai');
  const [addisKeyInput, setAddisKeyInput] = useState('');
  const [addisBaseUrlInput, setAddisBaseUrlInput] = useState('');
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiModelInput, setGeminiModelInput] = useState('gemini-2.5-flash');
  const [showAddisKey, setShowAddisKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [savingAi, setSavingAi] = useState(false);

  useEffect(() => {
    if (!token || currentUser?.role !== 'ADMIN') {
      return;
    }
    loadAllAdminData();
  }, [token, currentUser]);

  const loadAllAdminData = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, usersRes, logsRes, aiRes] = await Promise.all([
        fetch('/api/v1/admin/stats', { headers }),
        fetch('/api/v1/admin/users', { headers }),
        fetch('/api/v1/admin/logs?limit=50', { headers }),
        fetch('/api/v1/admin/ai-config', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(Array.isArray(uData) ? uData : uData?.users || []);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(Array.isArray(lData) ? lData : lData?.logs || []);
      }
      if (aiRes.ok) {
        const aiData: AiConfigData = await aiRes.json();
        setAiConfig(aiData);
        if (aiData.active_provider) setSelectedProvider(aiData.active_provider);
        if (aiData.addis_ai?.base_url) setAddisBaseUrlInput(aiData.addis_ai.base_url);
        if (aiData.gemini_ai?.model) setGeminiModelInput(aiData.gemini_ai.model);
      }
    } catch {
      setMessage({ text: 'Unable to load administrative telemetry.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // RBAC Access Guard
  if (!token || currentUser?.role !== 'ADMIN') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8F9FA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '14px',
          padding: '2.5rem 2rem',
          maxWidth: '420px',
          textAlign: 'center',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
        }}>
          <AlertShieldIcon size={44} color="#DC2626" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '1rem 0 0.5rem', color: '#111827' }}>
            Restricted Administrator Portal
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.5rem' }}>
            This portal is restricted to authorized LisanHealth system administrators. Please sign in with administrative credentials.
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              padding: '0.65rem 1.25rem',
              backgroundColor: '#25272C',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            Sign In with Admin Account
          </Link>
        </div>
      </div>
    );
  }

  // User Actions
  const handleToggleRole = async (userId: string, currentRole: 'USER' | 'ADMIN') => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update role');
      }
      setMessage({ text: `User role updated to ${newRole}.`, type: 'success' });
      loadAllAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update status');
      }
      setMessage({ text: `User status changed to ${nextStatus ? 'Active' : 'Deactivated'}.`, type: 'success' });
      loadAllAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${email}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete user');
      }
      setMessage({ text: `User ${email} deleted successfully.`, type: 'success' });
      loadAllAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingUser(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to provision user');
      }
      setMessage({ text: `Account for ${newEmail} provisioned successfully.`, type: 'success' });
      setShowAddUser(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      loadAllAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSubmittingUser(false);
    }
  };

  // Save AI Config
  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAi(true);
    setMessage(null);
    try {
      const payload: any = {
        active_provider: selectedProvider,
      };
      if (addisKeyInput.trim()) payload.addis_ai_key = addisKeyInput.trim();
      if (addisBaseUrlInput.trim()) payload.addis_ai_base_url = addisBaseUrlInput.trim();
      if (geminiKeyInput.trim()) payload.gemini_ai_key = geminiKeyInput.trim();
      if (geminiModelInput.trim()) payload.gemini_model = geminiModelInput.trim();

      const res = await fetch('/api/v1/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update AI configuration');
      }
      setMessage({ text: 'AI providers and API credentials saved successfully in database.', type: 'success' });
      setAddisKeyInput('');
      setGeminiKeyInput('');
      loadAllAdminData();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSavingAi(false);
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((u) =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F9FA',
      color: '#1F2937',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Header */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Link
              to="/"
              aria-label="Back to explainer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#F8F9FA',
                border: '1px solid #E5E7EB',
                color: '#1F2937',
                textDecoration: 'none',
              }}
            >
              <ArrowLeftIcon size={18} color="#1F2937" />
            </Link>

            <img
              src="/logo.png"
              alt="LisanHealth Logo"
              style={{ width: '38px', height: '38px', objectFit: 'contain' }}
            />

            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                LisanHealth Admin Portal
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: '#E8FBF4',
                  color: '#0D6E54',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  border: '1px solid #89E6CB',
                }}>
                  Live Cloud
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                RBAC Security • AletCloud PostgreSQL 17 • Addis AI & Gemini Hub
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              fontSize: '0.75rem',
              color: '#374151',
              backgroundColor: '#F3F4F6',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontWeight: 600,
              border: '1px solid #E5E7EB',
            }}>
              {currentUser.email}
            </div>
            <Link
              to="/"
              style={{
                fontSize: '0.8rem',
                color: '#6B7280',
                textDecoration: 'none',
                fontWeight: 600,
                padding: '0.35rem 0.65rem',
              }}
            >
              Exit to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: '1.75rem 1.25rem 3rem',
        flex: 1,
      }}>
        {/* Alerts Banner */}
        {message && (
          <div style={{
            backgroundColor: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${message.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            color: message.type === 'success' ? '#15803D' : '#DC2626',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            {message.type === 'success' ? <CheckIcon size={16} color="#15803D" /> : <AlertShieldIcon size={16} color="#DC2626" />}
            <span>{message.text}</span>
          </div>
        )}

        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            backgroundColor: '#F3F4F6',
            color: '#4B5563',
            fontSize: '0.8rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            width: 'fit-content',
            border: '1px solid #E5E7EB',
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00D09C' }} />
            Synchronizing administrative telemetry...
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #E5E7EB',
          marginBottom: '1.5rem',
          paddingBottom: '0.25rem',
        }}>
          {[
            { id: 'overview', label: 'System Overview' },
            { id: 'users', label: `User Management (${users.length})` },
            { id: 'ai', label: 'AI Models & API Keys' },
            { id: 'logs', label: `System Audit Logs (${logs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.65rem 1.15rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === tab.id ? '#25272C' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : '#4B5563',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.75rem',
            }}>
              {/* Stat Card 1 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                  Registered Users
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0.35rem 0' }}>
                  {stats?.totalUsers ?? users.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                  Active in AletCloud PostgreSQL
                </div>
              </div>

              {/* Stat Card 2 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                  Clinical Reports Logged
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0.35rem 0' }}>
                  {stats?.totalReports ?? 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  CBC, Lipid & Synthetic Panels
                </div>
              </div>

              {/* Stat Card 3 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                  Database Engine
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0D6E54', margin: '0.45rem 0' }}>
                  PostgreSQL 17 (Connected)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  AletCloud Dedicated Host (196.190.212.135)
                </div>
              </div>

              {/* Stat Card 4 */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                  Active AI Engine
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#25272C', margin: '0.45rem 0', textTransform: 'capitalize' }}>
                  {aiConfig?.active_provider ? aiConfig.active_provider.replace('_', ' ') : 'Addis AI'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  Dual-AI Pipeline with zero-hallucination preservation
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#111827' }}>
                Governance & Rapid Access
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.25rem' }}>
                Manage system users, switch AI inference models dynamically, or review tamper-evident audit logs.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('users')}
                  style={{
                    padding: '0.55rem 1rem',
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Manage Users & Roles
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  style={{
                    padding: '0.55rem 1rem',
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Configure AI Providers & Keys
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  style={{
                    padding: '0.55rem 1rem',
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Inspect Audit Trail
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div>
            {/* Action Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.6rem 0.85rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  width: '320px',
                  outline: 'none',
                }}
              />

              <button
                onClick={() => setShowAddUser(!showAddUser)}
                style={{
                  padding: '0.6rem 1rem',
                  backgroundColor: '#25272C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>{showAddUser ? 'Close Form' : '+ Add New User'}</span>
              </button>
            </div>

            {/* Inline Add User Card */}
            {showAddUser && (
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                  Provision New Account
                </h4>
                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.35rem' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sara Tadesse"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.35rem' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="sara@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.35rem' }}>
                      Password (min. 8 chars)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.35rem' }}>
                      Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#FFFFFF', boxSizing: 'border-box' }}
                    >
                      <option value="USER">USER (Standard)</option>
                      <option value="ADMIN">ADMIN (Full Access)</option>
                    </select>
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={submittingUser}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        backgroundColor: '#0D6E54',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: submittingUser ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {submittingUser ? 'Saving...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '0.75rem 1rem', color: '#6B7280', fontWeight: 600 }}>User</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#6B7280', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#6B7280', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#6B7280', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#6B7280', fontWeight: 600 }}>Registered</th>
                    <th style={{ padding: '0.75rem 1rem', color: '#6B7280', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#111827' }}>
                        {u.full_name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#4B5563' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          backgroundColor: u.role === 'ADMIN' ? '#E8FBF4' : '#F3F4F6',
                          color: u.role === 'ADMIN' ? '#0D6E54' : '#4B5563',
                          border: `1px solid ${u.role === 'ADMIN' ? '#89E6CB' : '#E5E7EB'}`,
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          fontSize: '0.775rem',
                          fontWeight: 600,
                          color: u.is_active ? '#10B981' : '#EF4444',
                        }}>
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#6B7280', fontSize: '0.8rem' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleToggleRole(u.id, u.role)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: '#F3F4F6',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u.id, u.is_active)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: '#F3F4F6',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: u.is_active ? '#DC2626' : '#10B981',
                            }}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: '#FEF2F2',
                              border: '1px solid #FCA5A5',
                              color: '#DC2626',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AI CONFIGURATION & API KEYS */}
        {activeTab === 'ai' && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '1.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#111827' }}>
              Dynamic AI Model & API Key Configuration
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.75rem' }}>
              Configure active inference providers, insert or rotate API keys, and adjust model parameters. Keys are securely persisted in PostgreSQL.
            </p>

            <form onSubmit={handleSaveAiConfig}>
              {/* Active Provider Selector */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '0.65rem' }}>
                  Select Active AI Provider
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  {[
                    { id: 'addis_ai', title: 'Addis AI (Primary)', desc: 'Specialized for Amharic & Afaan Oromoo localization & speech' },
                    { id: 'gemini_ai', title: 'Gemini AI (Google DeepMind)', desc: 'High-speed reasoning using Gemini 2.5 Flash' },
                    { id: 'hybrid', title: 'Hybrid Dual-AI', desc: 'Clinical extraction via Gemini + Ethiopian speech via Addis AI' },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProvider(p.id as any)}
                      style={{
                        border: selectedProvider === p.id ? '2px solid #0D6E54' : '1px solid #E5E7EB',
                        backgroundColor: selectedProvider === p.id ? '#F0FDF9' : '#FFFFFF',
                        borderRadius: '10px',
                        padding: '1rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {p.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Addis AI Key Section */}
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                backgroundColor: '#FAFAFA',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                    Addis AI Configuration
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    backgroundColor: aiConfig?.addis_ai.api_key_configured ? '#E8FBF4' : '#FEF3C7',
                    color: aiConfig?.addis_ai.api_key_configured ? '#0D6E54' : '#D97706',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    {aiConfig?.addis_ai.api_key_configured ? 'Key Configured' : 'Key Not Set'}
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.35rem' }}>
                    Addis AI API Key
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showAddisKey ? 'text' : 'password'}
                      placeholder={aiConfig?.addis_ai.api_key_masked || 'sk_df5e... (Enter new key to update)'}
                      value={addisKeyInput}
                      onChange={(e) => setAddisKeyInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddisKey(!showAddisKey)}
                      style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                    >
                      {showAddisKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.35rem' }}>
                    Addis AI Base URL
                  </label>
                  <input
                    type="url"
                    value={addisBaseUrlInput}
                    onChange={(e) => setAddisBaseUrlInput(e.target.value)}
                    placeholder="https://api.addisassistant.com"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Gemini AI Key Section */}
              <div style={{
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                backgroundColor: '#FAFAFA',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                    Google Gemini AI Configuration
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    backgroundColor: aiConfig?.gemini_ai.api_key_configured ? '#E8FBF4' : '#FEF3C7',
                    color: aiConfig?.gemini_ai.api_key_configured ? '#0D6E54' : '#D97706',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    {aiConfig?.gemini_ai.api_key_configured ? 'Key Configured' : 'Key Not Set'}
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.35rem' }}>
                    Gemini API Key
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      placeholder={aiConfig?.gemini_ai.api_key_masked || 'AIzaSy... (Enter new key to update)'}
                      value={geminiKeyInput}
                      onChange={(e) => setGeminiKeyInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                    >
                      {showGeminiKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.35rem' }}>
                    Gemini Reasoning Model
                  </label>
                  <select
                    value={geminiModelInput}
                    onChange={(e) => setGeminiModelInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Ultra-fast Clinical Reasoning)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Complex Clinical Reference Synthesis)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingAi}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#25272C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: savingAi ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                {savingAi ? 'Saving to Database...' : 'Save AI Credentials & Configuration'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#111827' }}>
                  Immutable Audit Log Trail
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
                  Chronological record of user provisioning, role promotions, and AI key modifications.
                </p>
              </div>

              <button
                onClick={loadAllAdminData}
                style={{
                  padding: '0.45rem 0.85rem',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Refresh Logs
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '0.75rem 1rem', color: '#6B7280', fontWeight: 600 }}>Action</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#6B7280', fontWeight: 600 }}>Actor</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#6B7280', fontWeight: 600 }}>Details</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#6B7280', fontWeight: 600 }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        backgroundColor: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#374151' }}>
                      {log.actor_email}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#4B5563', fontSize: '0.825rem' }}>
                      {log.details || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#6B7280', fontSize: '0.775rem' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
