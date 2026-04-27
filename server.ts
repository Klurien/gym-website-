import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

// API Handlers (CommonJS compatible imports)
// @ts-ignore
import registerHandler from './api/register.js';
// @ts-ignore
import loginHandler from './api/login.js';
// @ts-ignore
import postsHandler from './api/posts.js';
// @ts-ignore
import postsSocialHandler from './api/posts_social.js';
// @ts-ignore
import uploadHandler from './api/upload.js';
// @ts-ignore
import profileHandler from './api/profile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // --- Socket.io Logic ---
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("send_message", (data) => {
      // Broadcast message to others
      io.emit("receive_message", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // --- API Routes ---
  app.use(express.json());
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy to CommonJS handlers
  const wrap = (handler: any) => (req: any, res: any) => handler(req, res);
  
  app.all('/api/register', wrap(registerHandler));
  app.all('/api/login', wrap(loginHandler));
  app.all('/api/posts', wrap(postsHandler));
  app.all('/api/posts_social', wrap(postsSocialHandler));
  app.all('/api/upload', wrap(uploadHandler));
  app.all('/api/profile', wrap(profileHandler));

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
