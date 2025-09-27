import { Hono } from "hono";
import { cors } from "hono/cors";
import health from "../routes/alive";
import { handle } from "hono/vercel";
import offset from "../routes/offset";
import order from "../routes/order";
import property from "../routes/property";

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

// Contract routes
app.route("/contracts/offset", offset);
app.route("/contracts/order", order);
app.route("/contracts/property", property);

const GET = handle(app);
const POST = handle(app);
const PATCH = handle(app);
const DELETE = handle(app);
const OPTIONS = handle(app);
const PUT = handle(app);

export { GET, PUT, PATCH, POST, DELETE, OPTIONS };
