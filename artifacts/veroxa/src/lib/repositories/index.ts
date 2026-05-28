/**
 * Repositories barrel — read-only adapters that normalize demo
 * fixtures into the `veroxaDataContracts` shapes.
 *
 * Read-only. No writes. No network. No mutations.
 *
 * Import grouped functions from this file in pages and components:
 *
 *   import { clientRepository, healthRepository } from "@/lib/repositories";
 *
 * Or import individual functions directly from each module.
 */

export * as clientRepository from "./clientRepository";
export * as mediaRepository from "./mediaRepository";
export * as workflowRepository from "./workflowRepository";
export * as healthRepository from "./healthRepository";
export * as reportRepository from "./reportRepository";
export * as activityRepository from "./activityRepository";
export * as supabaseReadiness from "./supabaseReadiness";
