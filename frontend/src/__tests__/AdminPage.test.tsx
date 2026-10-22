import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminPage } from '../pages/AdminPage';
import type { User } from '../types/auth';

describe('AdminPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdminUser: User = {
    id: 'admin-001',
    email: 'admin@lisanhealth.org',
    full_name: 'System Administrator',
    role: 'ADMIN',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const mockNormalUser: User = {
    id: 'user-001',
    email: 'patient@example.com',
    full_name: 'Abebe Bikila',
    role: 'USER',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  it('blocks access and displays restricted warning when user is not an admin', () => {
    render(
      <BrowserRouter>
        <AdminPage currentUser={mockNormalUser} token="mock-user-token" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Restricted Administrator Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/restricted to authorized LisanHealth system administrators/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign In with Admin Account/i)).toBeInTheDocument();
  });

  it('blocks access when no user or token is provided', () => {
    render(
      <BrowserRouter>
        <AdminPage currentUser={null} token="" />
      </BrowserRouter>
    );

    expect(screen.getByText(/Restricted Administrator Portal/i)).toBeInTheDocument();
  });

  it('renders admin dashboard and tabs when authenticated as ADMIN', async () => {
    // Mock the fetch responses
    vi.spyOn(global, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const u = url.toString();
      if (u.includes('/api/v1/admin/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            total_users: 15,
            active_users: 14,
            admin_users: 2,
            total_reports: 120,
            active_ai_provider: 'addis_ai',
          }),
        } as Response);
      }
      if (u.includes('/api/v1/admin/users')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            mockAdminUser,
            mockNormalUser,
          ],
        } as Response);
      }
      if (u.includes('/api/v1/admin/logs')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'log-1',
              actor_id: 'admin-001',
              actor_email: 'admin@lisanhealth.org',
              action: 'LOGIN',
              details: 'Admin logged in',
              ip_address: '127.0.0.1',
              created_at: new Date().toISOString(),
            },
          ],
        } as Response);
      }
      if (u.includes('/api/v1/admin/ai-config')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            active_provider: 'addis_ai',
            addis_ai: {
              base_url: 'https://api.addis.ai/v1',
              api_key_configured: true,
              api_key_masked: 'sk_addis_...999',
              model: 'addis-clinical-am-v1',
              tts_enabled: true,
              voice_amharic: 'am-ET-Standard-A',
              voice_oromo: 'om-ET-Standard-A',
            },
            gemini_ai: {
              api_key_configured: true,
              api_key_masked: 'AIzaSy...000',
              model: 'gemini-2.5-flash',
            },
          }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown url: ' + u));
    });

    render(
      <BrowserRouter>
        <AdminPage currentUser={mockAdminUser} token="mock-admin-token" />
      </BrowserRouter>
    );

    // Verify Title & Admin email
    expect(screen.getByText(/LisanHealth Admin Portal/i)).toBeInTheDocument();
    expect(screen.getByText('admin@lisanhealth.org')).toBeInTheDocument();

    // Verify and wait for Tabs with data counts
    const userTab = await screen.findByRole('button', { name: /User Management/i });
    expect(userTab).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /System Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI Models & API Keys/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /System Audit Logs/i })).toBeInTheDocument();

    // Switch to User Management Tab
    fireEvent.click(userTab);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search users by name or email/i)).toBeInTheDocument();
      expect(screen.getByText('+ Add New User')).toBeInTheDocument();
    });

    // Switch to AI Models & API Keys Tab
    const aiTab = screen.getByRole('button', { name: /AI Models & API Keys/i });
    fireEvent.click(aiTab);
    await waitFor(() => {
      expect(screen.getByText(/Dynamic AI Model & API Key Configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/Addis AI Configuration/i)).toBeInTheDocument();
      expect(screen.getByText(/Gemini Reasoning Model/i)).toBeInTheDocument();
    });

    // Switch to System Audit Logs Tab
    const logsTab = screen.getByRole('button', { name: /System Audit Logs/i });
    fireEvent.click(logsTab);
    await waitFor(() => {
      expect(screen.getByText(/Immutable Audit Log Trail/i)).toBeInTheDocument();
    });
  });
});
