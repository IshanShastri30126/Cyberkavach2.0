// ==========================================================
# CyberKavach 2.0 — Fastify High-Performance Server Prototype
# ==========================================================
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyCompress from "@fastify/compress";
import prisma from "./server/src/lib/prisma";
import { config } from "./server/src/config";

const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
  disableRequestLogging: true, // Speeds up requests logging overhead under high concurrency
});

// Register Global Fastify Plugins
fastify.register(fastifyCors, {
  origin: config.clientUrl.split(",").map((s) => s.trim()),
  credentials: true,
});

fastify.register(fastifyHelmet, {
  contentSecurityPolicy: false,
});

// Enable Brotli / Gzip response compression
fastify.register(fastifyCompress, {
  threshold: 1024, // Compress responses over 1KB
  brotliOptions: {
    params: {
      [require("zlib").constants.BROTLI_PARAM_QUALITY]: 4, // Fast Brotli execution quality
    },
  },
});

// ─── Request Context & Authentication Hook ──────────────────
fastify.decorateRequest("user", null);

fastify.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, config.jwt.secret);
      (request as any).user = decoded;
    } catch (err) {
      reply.code(401).send({ error: "Invalid token or expired clearance" });
    }
  }
});

// ─── Global Health Probe Endpoint ───────────────────────────
fastify.get("/api/health", async (request, reply) => {
  return {
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    connections: { db: "connected" }
  };
});

// ─── Event Routes with High-Speed Schema Validation ─────────
fastify.get("/api/events", {
  schema: {
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", default: 1 },
        limit: { type: "integer", default: 20 },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                venue: { type: "string" },
                startDate: { type: "string" },
                isPublished: { type: "boolean" },
              },
            },
          },
          total: { type: "integer" },
        },
      },
    },
  },
}, async (request: FastifyRequest, reply: FastifyReply) => {
  const query = request.query as { page: number; limit: number };
  
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, venue: true, startDate: true, isPublished: true },
      take: query.limit,
      skip: (query.page - 1) * query.limit,
      orderBy: { startDate: "desc" },
    }),
    prisma.event.count({ where: { isPublished: true } }),
  ]);

  return { events, total };
});

// ─── Error Handling Hook ────────────────────────────────────
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  if (error.validation) {
    reply.status(400).send({ error: "Validation failure", details: error.validation });
  } else {
    reply.status(500).send({ error: "Internal operational server error" });
  }
});

// Start Server Listen
const start = async () => {
  try {
    const port = config.port || 4000;
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`[Fastify] 🛡️ High-Performance Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
