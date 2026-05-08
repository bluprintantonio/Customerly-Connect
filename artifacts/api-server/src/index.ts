import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function migrate() {
  await pool.query(`
    ALTER TABLE widgets
      ADD COLUMN IF NOT EXISTS agent_name  text,
      ADD COLUMN IF NOT EXISTS greeting    text,
      ADD COLUMN IF NOT EXISTS color       text,
      ADD COLUMN IF NOT EXISTS position    text,
      ADD COLUMN IF NOT EXISTS lang        text,
      ADD COLUMN IF NOT EXISTS logo_url    text,
      ADD COLUMN IF NOT EXISTS icon_style  text
  `);
  await pool.query(`
    ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS visitor_phone text
  `);
  logger.info("DB migration: columns ensured");
}

migrate()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Startup migration failed");
    process.exit(1);
  });
