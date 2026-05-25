import type { Client, ClientLifecycle } from "@/domain/clients/types";
import type { ContentItem, WorkflowStage } from "@/domain/content/types";
import type { ReportOperation } from "@/domain/reports/types";
import { WorkflowService } from "@/domain";

export interface ValidationResult { ok: boolean; errors: string[] }
const ok: ValidationResult = { ok: true, errors: [] };
const fail = (...errors: string[]): ValidationResult => ({ ok: false, errors });

export function validateClient(c: Partial<Client> & Partial<ClientLifecycle>): ValidationResult {
  const errors: string[] = [];
  if (!c.name)         errors.push("Client name is required.");
  if (!c.cuisine)      errors.push("Cuisine is required.");
  if (c.monthlyFee !== undefined && c.monthlyFee <= 0) errors.push("Monthly fee must be positive.");
  if (c.healthScore !== undefined && (c.healthScore < 0 || c.healthScore > 100)) errors.push("Health score must be 0–100.");
  return errors.length ? fail(...errors) : ok;
}

export function validateContent(c: Partial<ContentItem>): ValidationResult {
  const errors: string[] = [];
  if (!c.title)        errors.push("Content title is required.");
  if (!c.clientId)     errors.push("Content must be linked to a client.");
  if (!c.currentStage) errors.push("Content must have a current workflow stage.");
  return errors.length ? fail(...errors) : ok;
}

export function validateReport(r: Partial<ReportOperation>): ValidationResult {
  const errors: string[] = [];
  if (!r.clientId)               errors.push("Report must be linked to a client.");
  if (!r.period)                 errors.push("Report period is required.");
  if (!r.type)                   errors.push("Report type (Weekly/Monthly) is required.");
  if (r.status === "Published" && !r.publishedDate) errors.push("Published reports must have a publish date.");
  return errors.length ? fail(...errors) : ok;
}

export function validateWorkflow(from: WorkflowStage, to: WorkflowStage): ValidationResult {
  const r = WorkflowService.validateTransition(from, to);
  return r.ok ? ok : fail(r.reason ?? "Invalid transition.");
}
