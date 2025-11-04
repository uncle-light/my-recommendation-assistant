import fs from "node:fs";
import path from "node:path";

import { PostgresStore, type PostgresStoreConfig } from "@mastra/pg";

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const readOptionalFile = (filePath?: string) => {
  if (!filePath) {
    return undefined;
  }

  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(resolved)) {
    return undefined;
  }

  return fs.readFileSync(resolved, "utf8");
};

const createSslConfig = (): PostgresStoreConfig["ssl"] | undefined => {
  const rawMode =
    process.env.PG_SSL_MODE ??
    (process.env.NODE_ENV === "production" ? "require" : "disable");
  const normalized = rawMode.toLowerCase();
  const mode =
    normalized === "disable"
      ? "disable"
      : normalized === "no-verify"
      ? "no-verify"
      : "require";

  if (mode === "disable") {
    return false;
  }

  const rejectUnauthorized = toBoolean(
    process.env.PG_SSL_REJECT_UNAUTHORIZED,
    mode === "require"
  );

  const ca =
    process.env.PG_SSL_CA ?? readOptionalFile(process.env.PG_SSL_CA_FILE);
  const cert =
    process.env.PG_SSL_CERT ?? readOptionalFile(process.env.PG_SSL_CERT_FILE);
  const key =
    process.env.PG_SSL_KEY ?? readOptionalFile(process.env.PG_SSL_KEY_FILE);

  const sslOptions: Record<string, unknown> = { rejectUnauthorized };

  if (ca) sslOptions.ca = ca;
  if (cert) sslOptions.cert = cert;
  if (key) sslOptions.key = key;

  if (
    Object.keys(sslOptions).length === 1 &&
    sslOptions.rejectUnauthorized === true
  ) {
    return true;
  }

  return sslOptions as PostgresStoreConfig["ssl"];
};

const buildConnectionConfig = (): PostgresStoreConfig => {
  const ssl = createSslConfig();
  const shared = {
    schemaName: process.env.PG_SCHEMA ?? "public",
    max: parseNumber(process.env.PG_POOL_MAX, 20),
    idleTimeoutMillis: parseNumber(
      process.env.PG_POOL_IDLE_TIMEOUT_MS,
      30_000
    ),
  };

  const connectionString = process.env.DATABASE_URL?.trim();

  if (connectionString) {
    return {
      ...shared,
      connectionString,
      ...(ssl === undefined ? {} : { ssl }),
    };
  }

  const passwordFromEnv =
    process.env.PG_PASSWORD ??
    (process.env.NODE_ENV === "production" ? undefined : "postgres");

  if (process.env.NODE_ENV === "production" && passwordFromEnv === undefined) {
    throw new Error(
      "PG_PASSWORD must be set in production when DATABASE_URL is not provided."
    );
  }

  const password = passwordFromEnv ?? "postgres";

  return {
    ...shared,
    host: process.env.PG_HOST ?? "localhost",
    port: parseNumber(process.env.PG_PORT, 5432),
    database: process.env.PG_DATABASE ?? "recommendation_db",
    user: process.env.PG_USER ?? "postgres",
    password,
    ...(ssl === undefined ? {} : { ssl }),
  };
};

export const postgres = new PostgresStore(buildConnectionConfig());
