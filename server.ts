import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const apiHandler = require('./api/index.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  const wrap = (handler: any) => (req: any, res: any) => {
    try {
      const result = handler(req, res);
      if (result && typeof result.then === 'function') {
        result.catch((err: any) => { console.error('Async error:', err); res.status(500).json({ error: 'Internal error' }); });
      }
    } catch (err: any) { console.error('Sync error:', err); res.status(500).json({ error: 'Internal error' }); }
  };

  app.all('/api/:path*', wrap(apiHandler));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Comrades Gym running on http://localhost:${PORT}`);
  });
}

startServer();
