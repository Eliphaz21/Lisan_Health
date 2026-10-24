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
    const refreshValue = cookie.match(/lisan_refresh=([^;]+)/)?.[1];
    const csrf = cookie.match(/lisan_csrf=([^;]+)/)?.[1];
    if (!refreshValue) throw new Error("Refresh cookie value was not issued");
    if (!csrf) throw new Error("CSRF cookie was not issued");
    const cookieHeader = `lisan_refresh=${refreshValue}; lisan_csrf=${csrf}`;
    const auth = { authorization: `Bearer ${registerBody.access_token}` };
    const me = await fetch(`${base}/api/v1/auth/me`, { headers: auth });
    if (me.status !== 200) throw new Error(`Authenticated /me failed: ${me.status}`);
    const refresh = await fetch(`${base}/api/v1/auth/refresh`, { method: "POST", headers: { cookie: cookieHeader, "x-csrf-token": decodeURIComponent(csrf) } });
    if (refresh.status !== 200) throw new Error(`Refresh failed: ${refresh.status}`);
    const replay = await fetch(`${base}/api/v1/auth/refresh`, { method: "POST", headers: { cookie: cookieHeader, "x-csrf-token": decodeURIComponent(csrf) } });
    if (replay.status !== 401) throw new Error(`Refresh replay was accepted: ${replay.status}`);
    const health = await fetch(`${base}/api/v1/health`);
    if (health.status !== 200) throw new Error(`Health failed: ${health.status}`);

    const reportPayload = {
      original_file_name: "synthetic.txt",
      report_text: "Hemoglobin: 11.2 g/dL",
      extracted_json: { test_category: "CBC", analytes: [{ name: "Hemoglobin", value: 11.2, unit: "g/dL" }] },
      explanation_json: { test_category: "CBC", analytes: [] },
    };
    const saved = await fetch(`${base}/api/v1/history/save`, { method: "POST", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify(reportPayload) });
    if (saved.status !== 201) throw new Error(`History save failed: ${saved.status}`);
    const savedBody = await saved.json() as { report: { id: string } };
    const listed = await fetch(`${base}/api/v1/history`, { headers: auth });
    if (listed.status !== 200 || !(await listed.text()).includes(savedBody.report.id)) throw new Error("History list failed");

    const secondRegister = await fetch(`${base}/api/v1/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `other-${Date.now()}@example.com`, full_name: "Other User", password: "ValidPassword123!" }) });
    const secondBody = await secondRegister.json() as { access_token: string };
    const otherAuth = { authorization: `Bearer ${secondBody.access_token}` };
    const crossDelete = await fetch(`${base}/api/v1/history/${savedBody.report.id}`, { method: "DELETE", headers: otherAuth });
    if (crossDelete.status !== 404) throw new Error(`Cross-user report access was allowed: ${crossDelete.status}`);
    const deleted = await fetch(`${base}/api/v1/history/${savedBody.report.id}`, { method: "DELETE", headers: auth });
    if (deleted.status !== 200) throw new Error("Owner report deletion failed");

    const userAdminAttempt = await fetch(`${base}/api/v1/admin/stats`, { headers: auth });
    if (userAdminAttempt.status !== 403) throw new Error(`User reached admin route: ${userAdminAttempt.status}`);
    const adminRegister = await fetch(`${base}/api/v1/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "admin@example.com", full_name: "Test Administrator", password: "ValidPassword123!" }) });
    const adminBody = await adminRegister.json() as { access_token: string };
    const adminStats = await fetch(`${base}/api/v1/admin/stats`, { headers: { authorization: `Bearer ${adminBody.access_token}` } });
    if (adminStats.status !== 200) throw new Error(`Admin access failed: ${adminStats.status}`);

    const unauthSpeech = await fetch(`${base}/api/v1/speech/synthesize`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "test" }) });
    if (unauthSpeech.status !== 401) throw new Error(`Unauthenticated speech access was allowed: ${unauthSpeech.status}`);
    const invalidUpload = await fetch(`${base}/api/v1/pipeline/upload`, { method: "POST", headers: auth, body: (() => { const form = new FormData(); form.append("file", new Blob(["not-a-pdf"]), "report.pdf"); return form; })() });
    if (invalidUpload.status !== 415) throw new Error(`Invalid upload was accepted: ${invalidUpload.status}`);

    console.log("API integration checks passed: auth, refresh replay, history ownership, admin authorization, upload rejection, speech authorization");
  } finally {
    server.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
