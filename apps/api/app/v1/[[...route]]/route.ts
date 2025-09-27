import { Hono } from "hono";
import { cors } from "hono/cors";
import health from "../routes/alive";
import { handle } from "hono/vercel";
import admin from "../routes/admin";
import company from "../routes/company";
import tx from "../routes/tx";
import nfts from "../routes/nfts";
import projects from "../routes/projects";

export const runtime = "edge";
const app = new Hono().basePath("/v1");

const allowedOrigins = ["http://localhost:3000"];

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Import routes
app.route("/health", health);

// Main API routes
app.route("/admin", admin);
app.route("/company", company);
app.route("/tx", tx);
app.route("/nfts", nfts);
app.route("/projects", projects);

const GET = handle(app);
const POST = handle(app);
const PATCH = handle(app);
const DELETE = handle(app);
const OPTIONS = handle(app);
const PUT = handle(app);

export { GET, PUT, PATCH, POST, DELETE, OPTIONS };
