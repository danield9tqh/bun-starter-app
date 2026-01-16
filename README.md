# Typescript Start

Full-stack starter template with Bun runtime, Hono backend, and React frontend.

## To Start

Run `bun create github.com/danield9tqh/bun-starter-app your-app-name`

Run `bun install` and `bun dev` to start dev.

## To Deploy

1. Have a cloudflare account with a domain name managed by cloudflare
2. Run `bunx wrangler login` to authenticate your account
3. Set `ALCHEMY_PASSWORD` and `CUSTOM_DOMAIN` in .env
4. Run `bun run deploy`

Should work :fingers-crossed:

## Why?

This app is meant to be a starter app that can evolve to scale to 90% of use cases while being super simple up front. To do that it makes some opinionated decisions about runtimes, libraries and infrastructure.

## Auth

Uses [BetterAuth](https://www.better-auth.com/) which is an open source library that handles a large number of auth use cases and doesn't rely on any external services. The implementation in this project does sign up and login with just passkeys. The BetterAuth instance relies on a self hosted SQLite database.
In dev that's a SQLite file accessed through Bun.sql and when deployed to Cloudflare it's a Cloudflare D1 instance that's created on deploy. Better

## Infrastructure

All the deploy code is writted in /infra/deploy.ts using [Alchemy](https://alchemy.run/). Alchemy is a pure typescript IaC library. Read the [author's blog post](https://alchemy.run/blog/2025-04-08-decade-long-journey/) for more on the motivation behind it and why I think it's a great library.

The intial deploy script deploys to cloudflare workers/pages but

## Prioritizing

### Avoiding Config Hell

Put as much config into typescript code as possible. Having as much logic as possible in a single language allows

- better interoperability between all logic
- consistent typechecking across different parts of the stack like frontend, backend, DB schema, infrastructure and any other code

### Modularity

Frontend and Backend should be able to evolve separately. No vendor lockin, the core stack can be deployed to many different environments.

- Hono backend can be deployed to pretty much any serverless infra framework
- Frontend just creates a simple JS/HTML/CSS bundle which can be hosted anywhere

### Scalability

As your app evolves you shouldn't be hit with high usage bills from services that only provide good free tier pricing but then expensive scaling. Cloudflare seems to offer a good middle ground between simplicity (compared to AWS) and price (compared to Vercel). All services, including D1 database, can be scaled to 0 so no worrying about ongoing cost for unused apps.

### Stack

**Backend:** Hono with Zod validation, type-safe client
**Frontend:** React 19 + TanStack Router  
**Dev Runtime:** Bun
**Infrastructure:** Cloudflare Workers, Cloudflare D1 Database, Alchemy IaC
**Auth:** BetterAuth
**SQL Schema Management:** Drizzle
**Type Input Validation:** Zod
