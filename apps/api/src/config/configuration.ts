export default () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "5024", 10),
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5023",
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB ?? "0", 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
  encryption: {
    key: process.env.TOKEN_ENCRYPTION_KEY,
  },
  mcom: {
    baseUrl: process.env.MCOM_SOLUTIONS_URL ?? "http://localhost:3010",
    clientId: process.env.MCOM_CLIENT_ID,
    clientSecret: process.env.MCOM_CLIENT_SECRET,
    // Accept the partner-doc alias as a fallback.
    apiKey: process.env.MCOM_API_KEY ?? process.env.MCOM_SOLUTION_API_KEY,
    hmacSecret: process.env.MCOM_HMAC_SECRET,
    webhookSecret: process.env.MCOM_WEBHOOK_SECRET,
    platformSlug: process.env.MCOM_PLATFORM_SLUG ?? "fundordonate",
    redirectUri: process.env.MCOM_REDIRECT_URI,
    scopes: process.env.MCOM_SCOPES ?? "profile email business membership packages",
    ssoSecret: process.env.SSO_SECRET || undefined,
    service: {
      enabled: (process.env.MCOM_SERVICE_ENABLED ?? "false") === "true",
      baseUrl: process.env.MCOM_SERVICE_BASE_URL,
      scopes: process.env.MCOM_SERVICE_SCOPES ?? "",
    },
  },
});
