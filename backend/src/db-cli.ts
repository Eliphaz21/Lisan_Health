import { pool, db, initDb } from "./db";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "users";

  console.log("================================================================");
  console.log("  LISANHEALTH DATABASE CLI                                      ");
  console.log("================================================================");

  await initDb();
  console.log(`[Storage Mode]: ${db.isPostgres() ? "AletCloud PostgreSQL 17 (Live)" : "Local Resilient Storage"}`);

  try {
    if (command === "users") {
      const users = await db.listAllUsers();
      console.log(`\nFound ${users.length} registered user(s):\n`);
      if (users.length === 0) {
        console.log("  (No users registered yet)");
      } else {
        const display = users.map((u) => ({
          ID: u.id,
          Email: u.email,
          FullName: u.full_name,
          Role: u.role,
          Active: u.is_active,
          CreatedAt: u.created_at,
        }));
        console.table(display);
      }
    } else if (command === "stats") {
      const stats = await db.countStats();
      console.log("\nDatabase Governance & Metrics:");
      console.log(`  - Status:            ${stats.dbStatus}`);
      console.log(`  - Designated Admin:  ${stats.activeAdmin}`);
      console.log(`  - Total Users:       ${stats.totalUsers}`);
      console.log(`  - Total Reports:     ${stats.totalReports}`);
    } else if (command === "reports") {
      if (db.isPostgres()) {
        const res = await pool.query(
          "SELECT id, user_id, original_file_name, created_at FROM report_records ORDER BY created_at DESC LIMIT 20"
        );
        console.log(`\nFound ${res.rows.length} report(s):\n`);
        console.table(res.rows);
      } else {
        console.log("\n(Local fallback storage engaged. Reports available through API)");
      }
    } else if (command === "sql") {
      const query = args.slice(1).join(" ");
      if (!query) {
        console.error("Error: Please provide a SQL query. Example: npm run db sql \"SELECT * FROM users;\"");
        process.exit(1);
      }
      if (!db.isPostgres()) {
        console.log("Remote database not currently connected for raw SQL. Check connection string.");
      } else {
        const res = await pool.query(query);
        if (res.rows && res.rows.length > 0) {
          console.table(res.rows);
        } else {
          console.log(`Success. Rows affected: ${res.rowCount ?? 0}`);
        }
      }
    } else {
      console.log(`\nAvailable Commands:`);
      console.log("  npm run db users    - List all registered users");
      console.log("  npm run db stats    - View database metrics & counts");
      console.log("  npm run db reports  - List saved patient medical reports");
      console.log("  npm run db sql <q>  - Run arbitrary SQL query");
    }
  } catch (err: any) {
    console.error("\n[Database CLI Error]:", err.message);
  } finally {
    if (db.isPostgres()) {
      await pool.end();
    }
    process.exit(0);
  }
}

main();
