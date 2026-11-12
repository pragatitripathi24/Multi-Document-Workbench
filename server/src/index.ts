import { createApp } from './app.js';
import { config } from './config.js';
import { ensureUploadDir } from './services/documents.js';

async function main() {
  await ensureUploadDir();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`DocuMind API listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
