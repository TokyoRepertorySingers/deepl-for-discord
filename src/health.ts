import { createServer, Server } from "http";
import { Logger } from "./logger";

// Render's free Web Service requires an HTTP listener, and the external
// GAS keep-alive ping needs an endpoint to hit. A Discord bot otherwise only
// holds a Gateway WebSocket, so we expose this dummy endpoint on PORT.
export function startHealthServer(logger: Logger): Server {
  const port = Number(process.env.PORT) || 3000;

  const server = createServer((req, res) => {
    try {
      logger.debug(`health request: ${req.method} ${req.url}`);
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("OK: deepl-for-discord is running\n");
    } catch (e) {
      // Never let a stray request crash the process.
      logger.error("health request handling failed:", e);
      try {
        res.writeHead(500);
        res.end();
      } catch {
        // response already sent / socket gone — ignore
      }
    }
  });

  server.on("error", (e) => {
    logger.error("health server error:", e);
  });

  server.listen(port, () => {
    logger.info(`health server listening on port ${port}`);
  });

  return server;
}
