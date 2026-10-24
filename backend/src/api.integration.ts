// Isolated API smoke/integration test. It deliberately runs without a database
// URL and therefore cannot touch a developer or production PostgreSQL instance.
process.env.ENVIRONMENT = "test";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "";
process.env.SECRET_KEY = "test-only-secret-that-is-at-least-32-characters-long";
process.env.ADMIN_EMAIL = "admin@example.com";

async function main(): Promise<void> {
  const [{ app }, { initDb }] = await Promise.all([import("./app"), import("./db")]);
  await initDb();
  const server = app.listen(0);
  try {
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not bind to a port");
    const base = `http://127.0.0.1:${address.port}`;
    const email = `integration-${Date.now()}@example.com`;
    const register = await fetch(`${base}/api/v1/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, full_name: "Integration User", password: "ValidPassword123!" }) });
    if (register.status !== 201) throw new Error(`Register failed: ${register.status}`);
    const registerBody = await register.json() as { access_token: string };
    const cookie = register.headers.get("set-cookie");
    if (!cookie) throw new Error("Refresh cookie was not issued");
    const auth = { authorization: `Bearer ${registerBody.access_token}` };
    const me = await fetch(`${base}/api/v1/auth/me`, { headers: auth });
    if (me.status !== 200) throw new Error(`Authenticated /me failed: ${me.status}`);
    const refresh = await fetch(`${base}/api/v1/auth/refresh`, { method: "POST", headers: { cookie } });
    if (refresh.status !== 200) throw new Error(`Refresh failed: ${refresh.status}`);
    const replay = await fetch(`${base}/api/v1/auth/refresh`, { method: "POST", headers: { cookie } });
    if (replay.status !== 401) throw new Error(`Refresh replay was accepted: ${replay.status}`);
    const health = await fetch(`${base}/api/v1/health`);
    if (health.status !== 200) throw new Error(`Health failed: ${health.status}`);
    console.log("API integration checks passed: register, auth, refresh rotation, replay rejection, health");
  } finally {
    server.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
