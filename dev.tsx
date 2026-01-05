import { serve } from "bun";
import index from "./frontend/index.html";
import backend from "./backend/server";
import { Hono } from "hono";

const api = new Hono().route('/api', backend);
const server = serve({
  routes: {
    "/api/*": async (req) => api.fetch(req),
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Listening on ${server.url}`);
