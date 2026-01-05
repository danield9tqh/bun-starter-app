import { Hono } from "hono";
import backend from "../backend/server";

interface Env {
    ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const app = new Hono<{ Bindings: Env }>();

// API routes
app.route("/api", backend);

// Static assets for everything else
app.get("*", (c) => {
    return c.env.ASSETS.fetch(c.req.raw);
});

export default app;

