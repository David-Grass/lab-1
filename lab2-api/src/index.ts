import { createApp } from "./app.js";
import { initDb } from "./db/initDb.js";

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap(): Promise<void> {
  await initDb();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
