import { PrismaClient } from "@prisma/client";

let dbUrl = process.env.DATABASE_URL || "";
if (dbUrl && !dbUrl.includes("connection_limit")) {
  const separator = dbUrl.includes("?") ? "&" : "?";
  dbUrl = `${dbUrl}${separator}connection_limit=15&pool_timeout=30`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
});

// Note: Compatibility check for $queryRawUnsafe
// Ensure raw queries are sanitized and run safely inside the database thread pool.

export default prisma;
