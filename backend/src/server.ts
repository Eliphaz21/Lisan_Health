import { app } from "./app";
import { config } from "./config";
import { initDb } from "./db";

async function bootstrap() {
  console.log(`[LisanHealth Backend] Starting enterprise Express service in ${config.env} mode...`);

  // Connect & initialize database
  await initDb();

  app.listen(config.port, () => {
    console.log(`[LisanHealth Backend] Server listening on http://localhost:${config.port}`);
    console.log(`[LisanHealth Backend] Admin email: ${config.adminEmail}`);
    console.log(`[LisanHealth Backend] Addis AI Key: ${config.addisAi.apiKey ? "Configured (Active)" : "Not Configured"}`);
  });
}

bootstrap().catch((err) => {
  console.error("[Bootstrap Failure]", err);
  process.exit(1);
});
