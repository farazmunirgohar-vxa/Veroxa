# Veroxa Database Architecture

This folder contains the Veroxa database foundation as **TypeScript schema contracts only**.

## What this is

- Pure TypeScript enums, interfaces, relationship documentation, and derived-metric helpers.
- No runtime database connection.
- No ORM (no Drizzle, no Prisma, no Sequelize).
- No Supabase or Firebase client.
- No API routes.
- No authentication.

The portal UI continues to use hardcoded demo data and is completely unaffected by these files.

## What this is for

These contracts define the canonical shape of every Veroxa data entity. When the project moves to a real database, the implementation layer should map these contracts to the chosen store (PostgreSQL via Supabase is the recommended target) without changing the interface shapes.

## Build order

| Step | Description |
|------|-------------|
| 1    | Schema contracts ← **you are here** |
| 2    | Seed / demo data refactor (replace hardcoded demo data with typed seed objects) |
| 3    | Role permissions layer |
| 4    | Real database connection (PostgreSQL / Supabase) |
| 5    | API layer (Express routes, validated with Zod) |
| 6    | Authentication |
| 7    | Uploads |
| 8    | Automation engine |
| 9    | AI integration |
| 10   | Publishing and reporting integrations |

## Files

| File | Purpose |
|------|---------|
| `enums.ts` | All locked enum constants and their TypeScript union types |
| `models.ts` | TypeScript interfaces for every database table |
| `relationships.ts` | Relationship map and integrity rules as comments + constants |
| `derivedMetrics.ts` | Pure helper functions for content health and completion metrics |
| `index.ts` | Barrel export for the entire database architecture folder |
