import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const PROCESS_START = Date.now();

// Catch unhandled promise rejections (e.g. transient DB connection drops)
process.on('unhandledRejection', (reason: any) => {
  const msg = reason?.message || String(reason);
  if (msg.includes('socket hang up') || msg.includes('Client network socket disconnected') || msg.includes('ECONNRESET')) {
    console.warn('⚠️  Transient DB connection error (suppressed):', msg);
  } else {
    console.error('Unhandled rejection:', reason);
  }
});

process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught exception:', err);
});

// Track process exit for diagnostics
process.on('exit', (code: number) => {
  const elapsed = Date.now() - PROCESS_START;
  process.stderr.write(`[EXIT] Process exiting with code ${code} at T+${elapsed}ms (${new Date().toISOString()})\n`);
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  const elapsed = Date.now() - PROCESS_START;
  process.stderr.write(`⚠️ SIGTERM at T+${elapsed}ms — shutting down in 2s\n`);
  setTimeout(() => process.exit(0), 2000);
});

process.on('SIGINT', () => {
  process.exit(0);
});

// CRITICAL FIX: Replit's infrastructure sends SIGHUP to workflow processes ~28 seconds
// after startup (when the controlling pty session refreshes). Node.js's default SIGHUP
// behaviour is to TERMINATE THE PROCESS. By registering this handler we override that
// default and keep the server running.
process.on('SIGHUP', () => {
  const elapsed = Date.now() - PROCESS_START;
  process.stderr.write(`⚠️ SIGHUP at T+${elapsed}ms — ignoring (Replit pty refresh)\n`);
});

// Prevent SIGPIPE (broken pipe) from terminating the process
process.on('SIGPIPE', () => {
  /* ignore */
});

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { registerRoutes } from "./routes";
import { registerSquareRoutes } from "./squareRoutes";
import { setupVite, serveStatic, log } from "./vite";
import { pool, createDatabaseIndexes } from "./db";
import { seedDatabase } from "./db/seed";
import { setupGoogleAuth } from "./googleAuth";
import { initializeSocketServer } from "./socketServer";
import { initialisePush } from "./pushService";

const app = express();

// Trust proxy for secure cookies behind reverse proxy (Replit deployments)
app.set('trust proxy', 1);

// Security headers with Helmet - configured for high Mozilla Observatory score
app.use(helmet({
  // Content Security Policy - protects against XSS
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://maps.googleapis.com", "https://www.paypal.com", "https://www.sandbox.paypal.com", "https://*.paypal.com", "https://sandbox.web.squarecdn.com", "https://web.squarecdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://maps.googleapis.com", "wss:", "ws:", "https://*.paypal.com", "https://api-m.paypal.com", "https://www.paypal.com", "https://pci-connect.squareup.com", "https://connect.squareup.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://*.paypal.com", "https://www.paypal.com", "https://www.sandbox.paypal.com", "https://pci-connect.squareup.com", "https://connect.squareup.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'", "https://*.paypal.com"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  // Strict Transport Security - forces HTTPS
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // Prevent clickjacking
  xFrameOptions: { action: 'deny' },
  // Prevent MIME type sniffing
  xContentTypeOptions: true,
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Required for Stripe
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Permissions Policy header (not included in Helmet by default)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=(), payment=(self "https://js.stripe.com" "https://www.paypal.com")');
  next();
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 5000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for essential shopping routes
  skip: (req) => {
    const skipPaths = ['/api/cart', '/api/products', '/api/wishlist', '/api/site-settings', '/api/announcement-banner'];
    return skipPaths.some(path => req.path.startsWith(path));
  },
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/customer/login', authLimiter);
app.use('/api/auth/customer/register', authLimiter);
app.use('/api/auth/admin/login', authLimiter);
app.use('/api/auth/reseller/login', authLimiter);
app.use('/api/auth/vendor/login', authLimiter);
app.use('/api/auth/b2b/login', authLimiter);

// Use raw body parser for Stripe webhooks, JSON for everything else
app.use((req, res, next) => {
  if (req.path === '/api/stripe/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session configuration with enhanced security
const PgSession = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === 'production';

// Validate session secret exists in production
if (isProduction && !process.env.SESSION_SECRET) {
  console.warn('⚠️ WARNING: SESSION_SECRET not set in production. Using fallback.');
}

// Use standard pg.Pool (TCP-based) for session store instead of the Neon serverless WebSocket pool.
// The Neon serverless pool uses WebSockets which frequently drop connections, causing server crashes.
// Standard pg.Pool uses persistent TCP connections which are far more stable for session storage.
const sessionPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

sessionPool.on('error', (err) => {
  console.warn('⚠️  Session pool error (will reconnect):', err.message);
});

const pgSessionStore = new PgSession({
  pool: sessionPool,
  tableName: 'user_sessions',
  pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
  errorLog: (err: Error) => {
    console.warn('⚠️  Session store error (non-fatal):', err?.message || String(err));
  },
});

// COOKIE_SECURE lets this be forced off for pre-HTTPS testing (e.g. a raw
// http://ip:port link) without changing default production behavior.
const cookieSecure = process.env.COOKIE_SECURE === 'false' ? false : isProduction;

app.use(session({
  store: pgSessionStore,
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  name: '__1strep_sid', // Custom session cookie name (security through obscurity)
  resave: false,
  saveUninitialized: true, // Enable for anonymous cart functionality
  rolling: true, // Reset expiry on activity
  cookie: {
    secure: cookieSecure, // Only require HTTPS in production
    httpOnly: true, // Prevent XSS access to cookies
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax', // Use lax for better cookie compatibility with navigation
  }
}));

console.log(`🍪 Session configured: secure=${isProduction}, sameSite=lax, saveUninitialized=true`);

// Serve attached assets (product images, etc.) with cache headers for performance
app.use('/attached_assets', express.static(path.resolve(import.meta.dirname, '../attached_assets'), {
  maxAge: '7d',           // Cache images for 7 days
  etag: true,             // Enable ETags for cache validation
  lastModified: true,     // Enable Last-Modified headers
  immutable: true,        // Assets don't change, enable immutable caching
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup auth route handlers first (fast — just registers routes, no DB blocking)
  await setupGoogleAuth(app);

  // Register all API routes and get the underlying HTTP server object
  const server = await registerRoutes(app);
  registerSquareRoutes(app);

  // Error handler must be registered after routes
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error('Express error handler:', err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Setup static file serving (or Vite dev middleware)
  // Must come after API routes so the catch-all doesn't swallow them
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ─── START LISTENING IMMEDIATELY ─────────────────────────────────────────
  // The server binds to the port NOW so Cloud Run's startup healthcheck on
  // GET / gets a 200 straight away (served by serveStatic/Vite above).
  // Heavy initialisation (DB seeding, indexes, WebSockets, cron) runs
  // concurrently in the background — it does not block the port binding.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
  // ─────────────────────────────────────────────────────────────────────────

  // Initialize WebSocket immediately after listen (attaches to the live server,
  // but requires no DB — safe to do before seeding completes)
  initializeSocketServer(server);

  // ─── Background initialisation (non-blocking) ────────────────────────────
  // Runs asynchronously so it never delays the healthcheck response.
  (async () => {
    // Seed database with initial data (only if empty)
    await seedDatabase();

    // Initialise Web Push (creates VAPID keys if not already stored)
    try {
      await initialisePush();
    } catch (err) {
      console.error("[Push] Failed to initialise:", err);
    }

    // Create database indexes for better query performance
    await createDatabaseIndexes();

    // NOTE (cost optimisation): The Weekly Email, Review Request, and
    // Marketing Automation jobs used to run as in-process cron timers here.
    // That forced this web server to stay alive 24/7, which defeats
    // autoscale's scale-to-zero behaviour and inflates hosting cost.
    // They now run via a separate `server/scheduledJobs.ts` entry point,
    // intended to be triggered hourly by a Replit Scheduled Deployment
    // instead of running inside this always-on-while-cron-exists process.
  })().catch(err => {
    console.error("[Startup] Background initialisation error:", err);
  });
  // ─────────────────────────────────────────────────────────────────────────
})();
