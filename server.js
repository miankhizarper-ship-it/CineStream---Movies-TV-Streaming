import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist');
const indexPath = path.join(distPath, 'index.html');

// Cloud Run health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Serve static assets from built dist directory
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1h' }));
}

// Fallback all other routes to index.html for client-side routing
app.get('*', (_req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`<!DOCTYPE html><html><head><title>CineStream</title></head><body><div id="root">Loading CineStream...</div><script type="module" src="/src/main.tsx"></script></body></html>`);
  }
});

// Bind to 0.0.0.0 for Cloud Run container ingress
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`CineStream server listening on 0.0.0.0:${PORT}`);
});

// Handle graceful termination signals
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
