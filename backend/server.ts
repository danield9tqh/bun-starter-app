import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const backend = new Hono()
  .get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
  })
  .post(
    "/hello",
    zValidator(
      "json",
      z.object({
        name: z.string(),
      })
    ),
    (c) => {
      const { name } = c.req.valid("json");
      return c.json({ message: `Hello, ${name}!` });
    }
  );

export type App = typeof backend;
export default backend;
