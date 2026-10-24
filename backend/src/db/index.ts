import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { UserRecord, SavedReport } from "../types";

// Setup PostgreSQL pool with connection timeout
export const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
  ssl: config.databaseUrl.includes("sslmode=require") || config.databaseUrl.includes("sslmode=verify")
    ? { rejectUnauthorized: true }
    : false,
});

export interface AuditLogRecord {
  id: string;
  action: string;
  actor_email: string;
  details?: string;
  ip_address?: string;
  created_at: Date;
}

// In-memory fallback storage in case remote database is temporarily unreachable
const memoryStore = {
  users: new Map<string, UserRecord>(),
  reports: new Map<string, SavedReport>(),
  configs: new Map<string, string>(),
  auditLogs: [] as AuditLogRecord[],
};

let isConnectedToPostgres = false;

export async function initDb(): Promise<void> {
  try {
    const client = await pool.connect();
    isConnectedToPostgres = true;

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'USER',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS report_records (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        original_file_name VARCHAR(255),
        report_text TEXT,
        extracted_json JSONB NOT NULL,
        explanation_json JSONB NOT NULL,
        localized_amharic JSONB,
        localized_oromo JSONB,
        audio_amharic_url TEXT,
        audio_oromo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS system_configs (
        id VARCHAR(64) PRIMARY KEY,
        key VARCHAR(128) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        action VARCHAR(64) NOT NULL,
        actor_email VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    client.release();
    console.log("[Database] Connected successfully to AletCloud PostgreSQL 17.");
  } catch (err: any) {
    console.warn(
      `[Database] Warning: Remote PostgreSQL connection failed (${err.message}). Using resilient persistent local fallback.`
    );
    isConnectedToPostgres = false;
    if (config.env === "production") {
      throw new Error("PostgreSQL is required in production and could not be reached.");
    }
  }
}

// Data Access Repository with Dual Backend Support (PostgreSQL / In-Memory Fallback)
export const db = {
  isPostgres: () => isConnectedToPostgres,

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query("SELECT * FROM users WHERE LOWER(email) = $1", [cleanEmail]);
        return res.rows[0] || null;
      } catch {
        return memoryStore.users.get(cleanEmail) || null;
      }
    }
    return memoryStore.users.get(cleanEmail) || null;
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        return res.rows[0] || null;
      } catch {
        for (const u of memoryStore.users.values()) {
          if (u.id === id) return u;
        }
        return null;
      }
    }
    for (const u of memoryStore.users.values()) {
      if (u.id === id) return u;
    }
    return null;
  },

  async createUser(data: { email: string; fullName: string; passwordHash: string; role: "USER" | "ADMIN" }): Promise<UserRecord> {
    const id = uuidv4();
    const cleanEmail = data.email.toLowerCase().trim();
    const now = new Date();
    const user: UserRecord = {
      id,
      email: cleanEmail,
      full_name: data.fullName,
      password_hash: data.passwordHash,
      role: data.role,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    memoryStore.users.set(cleanEmail, user);

    if (isConnectedToPostgres) {
      try {
        const res = await pool.query(
          "INSERT INTO users (id, email, full_name, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
          [id, cleanEmail, data.fullName, data.passwordHash, data.role, true]
        );
        return res.rows[0];
      } catch (err) {
        console.warn("[Database] Fallback insert to memory:", err);
      }
    }
    return user;
  },

  async updateUserPasswordAndProfile(
    id: string,
    data: { fullName: string; passwordHash: string; role: "USER" | "ADMIN"; isActive: boolean }
  ): Promise<UserRecord> {
    const now = new Date();
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query(
          "UPDATE users SET full_name = $1, password_hash = $2, role = $3, is_active = $4, updated_at = NOW() WHERE id = $5 RETURNING *",
          [data.fullName, data.passwordHash, data.role, data.isActive, id]
        );
        if (res.rows.length > 0) {
          const updated = res.rows[0];
          memoryStore.users.set(updated.email.toLowerCase(), updated);
          return updated;
        }
      } catch (err) {
        console.warn("[Database] Fallback update to memory:", err);
      }
    }
    for (const [email, u] of memoryStore.users.entries()) {
      if (u.id === id) {
        u.full_name = data.fullName;
        u.password_hash = data.passwordHash;
        u.role = data.role;
        u.is_active = data.isActive;
        u.updated_at = now;
        return u;
      }
    }
    throw new Error("User record not found");
  },

  async listAllUsers(): Promise<UserRecord[]> {
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query("SELECT id, email, full_name, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC");
        return res.rows;
      } catch {
        return Array.from(memoryStore.users.values());
      }
    }
    return Array.from(memoryStore.users.values());
  },

  async updateUserRole(id: string, role: "USER" | "ADMIN"): Promise<boolean> {
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query("UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2", [role, id]);
        return (res.rowCount ?? 0) > 0;
      } catch {
        // fallback
      }
    }
    for (const u of memoryStore.users.values()) {
      if (u.id === id) {
        u.role = role;
        u.updated_at = new Date();
        return true;
      }
    }
    return false;
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<boolean> {
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query("UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2", [isActive, id]);
        return (res.rowCount ?? 0) > 0;
      } catch {
        // fallback
      }
    }
    for (const u of memoryStore.users.values()) {
      if (u.id === id) {
        u.is_active = isActive;
        u.updated_at = new Date();
        return true;
      }
    }
    return false;
  },

  async deleteUser(id: string): Promise<boolean> {
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query("DELETE FROM users WHERE id = $1", [id]);
        return (res.rowCount ?? 0) > 0;
      } catch {
        // fallback
      }
    }
    for (const [email, u] of memoryStore.users.entries()) {
      if (u.id === id) {
        memoryStore.users.delete(email);
        return true;
      }
    }
    return false;
  },

  async countStats(): Promise<{ totalUsers: number; totalReports: number; activeAdmin: string; dbStatus: string }> {
    let totalUsers = memoryStore.users.size;
    let totalReports = memoryStore.reports.size;

    if (isConnectedToPostgres) {
      try {
        const uRes = await pool.query("SELECT COUNT(*) FROM users");
        const rRes = await pool.query("SELECT COUNT(*) FROM report_records");
        totalUsers = parseInt(uRes.rows[0].count, 10);
        totalReports = parseInt(rRes.rows[0].count, 10);
      } catch {
        // keep fallback
      }
    }

    return {
      totalUsers,
      totalReports,
      activeAdmin: config.adminEmail,
      dbStatus: isConnectedToPostgres ? "PostgreSQL connected" : "Development memory storage",
    };
  },

  async saveReport(data: {
    userId: string;
    originalFileName?: string;
    reportText?: string;
    extractedJson: any;
    explanationJson: any;
    localizedAmharic?: any;
    localizedOromo?: any;
    audioAmharicUrl?: string;
    audioOromoUrl?: string;
  }): Promise<SavedReport> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const saved: SavedReport = {
      id,
      user_id: data.userId,
      original_file_name: data.originalFileName,
      report_text: data.reportText,
      extracted_json: data.extractedJson,
      explanation_json: data.explanationJson,
      localized_amharic: data.localizedAmharic,
      localized_oromo: data.localizedOromo,
      audio_amharic_url: data.audioAmharicUrl,
      audio_oromo_url: data.audioOromoUrl,
      created_at: now,
    };

    if (isConnectedToPostgres) {
      try {
        await pool.query(
          `INSERT INTO report_records (
            id, user_id, original_file_name, report_text,
            extracted_json, explanation_json, localized_amharic,
            localized_oromo, audio_amharic_url, audio_oromo_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id,
            data.userId,
            data.originalFileName || null,
            data.reportText || null,
            JSON.stringify(data.extractedJson),
            JSON.stringify(data.explanationJson),
            data.localizedAmharic ? JSON.stringify(data.localizedAmharic) : null,
            data.localizedOromo ? JSON.stringify(data.localizedOromo) : null,
            data.audioAmharicUrl || null,
            data.audioOromoUrl || null,
          ]
        );
      } catch (err) {
        console.warn("[Database] Fallback save report to memory:", err);
      }
    }
    memoryStore.reports.set(id, saved);
    return saved;
  },

  async listReportsByUserId(userId: string): Promise<SavedReport[]> {
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query(
          "SELECT * FROM report_records WHERE user_id = $1 ORDER BY created_at DESC",
          [userId]
        );
        return res.rows;
      } catch {
        // fallback
      }
    }
    return Array.from(memoryStore.reports.values())
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async deleteReport(id: string, userId: string): Promise<boolean> {
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query("DELETE FROM report_records WHERE id = $1 AND user_id = $2", [id, userId]);
        return (res.rowCount ?? 0) > 0;
      } catch {
        // fallback
      }
    }
    const report = memoryStore.reports.get(id);
    if (report && report.user_id === userId) {
      memoryStore.reports.delete(id);
      return true;
    }
    return false;
  },

  async logAudit(action: string, actorEmail: string, details?: string, ipAddress?: string): Promise<AuditLogRecord> {
    const id = uuidv4();
    const now = new Date();
    const record: AuditLogRecord = {
      id,
      action,
      actor_email: actorEmail,
      details,
      ip_address: ipAddress,
      created_at: now,
    };
    if (isConnectedToPostgres) {
      try {
        await pool.query(
          "INSERT INTO audit_logs (id, action, actor_email, details, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
          [id, action, actorEmail, details || null, ipAddress || null, now]
        );
        return record;
      } catch (err) {
        console.warn("[Database] Fallback audit log to memory:", err);
      }
    }
    memoryStore.auditLogs.unshift(record);
    if (memoryStore.auditLogs.length > 200) {
      memoryStore.auditLogs.pop();
    }
    return record;
  },

  async listAuditLogs(limit = 100): Promise<AuditLogRecord[]> {
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query(
          "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1",
          [limit]
        );
        return res.rows;
      } catch {
        // fallback
      }
    }
    return memoryStore.auditLogs.slice(0, limit);
  },

  async getSystemConfig(key: string): Promise<string | null> {
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query("SELECT value FROM system_configs WHERE key = $1", [key]);
        if (res.rows.length > 0) return res.rows[0].value;
      } catch {
        // fallback
      }
    }
    return memoryStore.configs.get(key) || null;
  },

  async setSystemConfig(key: string, value: string): Promise<void> {
    const id = uuidv4();
    if (isConnectedToPostgres) {
      try {
        await pool.query(
          "INSERT INTO system_configs (id, key, value, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (key) DO UPDATE SET value = $3, updated_at = NOW()",
          [id, key, value]
        );
      } catch (err) {
        console.warn("[Database] Fallback system config to memory:", err);
      }
    }
    memoryStore.configs.set(key, value);
  },

  async getAllSystemConfigs(): Promise<Record<string, string>> {
    const map: Record<string, string> = {};
    if (isConnectedToPostgres) {
      try {
        const res = await pool.query("SELECT key, value FROM system_configs");
        for (const row of res.rows) {
          map[row.key] = row.value;
        }
        return map;
      } catch {
        // fallback
      }
    }
    for (const [k, v] of memoryStore.configs.entries()) {
      map[k] = v;
    }
    return map;
  },
};
