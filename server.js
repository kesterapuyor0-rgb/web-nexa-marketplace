import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { execFile } from "child_process";
import { Server as SocketServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createApp } from "./server/app.js";

export const app = createApp();

async function startServer() {
  const PORT = Number(process.env.PORT) || 5000;
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, { cors: { origin: true, credentials: true } });
  io.on("connection", (socket) => {
    socket.on("join-conversation", (conversationId) => {
      if (typeof conversationId === "string" && conversationId.length < 200) socket.join(conversationId);
    });
    socket.on("send-message", (message) => {
      if (message?.conversationId) io.to(message.conversationId).emit("message", message);
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  let attemptedPortRecovery = false;
  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      if (attemptedPortRecovery) {
        console.error(`[0] CRITICAL: Port ${PORT} is still in use after cleanup. Change process.env.PORT or stop the owning process.`);
        process.exitCode = 1;
        return;
      }
      attemptedPortRecovery = true;
      console.error(`[0] Port ${PORT} is occupied. Attempting to free port...`);
      execFile(process.platform === "win32" ? "npx.cmd" : "npx", ["kill-port", String(PORT)], (cleanupError, _stdout, stderr) => {
        if (cleanupError) {
          console.error(`[0] CRITICAL: Unable to free port ${PORT}: ${stderr || cleanupError.message}`);
          process.exitCode = 1;
          return;
        }
        setTimeout(() => httpServer.listen(PORT, "0.0.0.0", () => console.log(`[0] Express Server recovered at http://127.0.0.1:${PORT}`)), 500);
      });
    } else {
      console.error("[0] CRITICAL: Server failed to start:", err);
      process.exitCode = 1;
    }
  });
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log("[0] =================================");
    console.log(`[0] Express Server running at http://127.0.0.1:${PORT}`);
    console.log("[0] =================================");
  });
}

const isDirectExecution = process.argv[1] && import.meta.url === new URL(`file://${fileURLToPath(process.argv[1])}`).href;
if (isDirectExecution) {
  startServer().catch((err) => {
    console.error("Server startup failed:", err);
    process.exitCode = 1;
  });
}

export default app;
