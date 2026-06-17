import type { VeroxaRole } from "@/lib/auth/authContract";

export type { VeroxaRole };
export type AccountStatus = "active" | "pending" | "disabled";
export type RestaurantStatus = AccountStatus;
export type RestaurantMembershipStatus = AccountStatus;
export type ProfileFieldStatus = "please_review" | "pre_filled" | "confirmed" | "optional" | "veroxa_review";
export type MediaAssetStatus = "uploaded" | "under_veroxa_review" | "ready_to_use" | "saved_for_later" | "better_version_helpful" | "used";
export type MessageStatus = "unread" | "read" | "resolved";
export type ProfileCorrectionStatus = "requested" | "under_veroxa_review" | "approved" | "rejected" | "needs_owner_input";
export type ActivityVisibility = "internal_only" | "client_visible";
export type AiDraftStatus = "drafted" | "ready_for_faraz_review" | "approved" | "rejected" | "held" | "needs_owner_input";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "held" | "needs_owner_confirmation";
export type ReportStatus = "draft" | "ready_for_faraz_review" | "approved" | "published_to_client";

export type Uuid = string;
export type IsoTimestamp = string;
export type IsoDate = string;
export type JsonObject = Record<string, unknown>;

export interface UserProfileRecord { id: Uuid; user_id: Uuid; email: string; role: VeroxaRole; display_name: string | null; status: AccountStatus; created_at: IsoTimestamp; updated_at: IsoTimestamp; }
export interface RestaurantRecord { id: Uuid; name: string; address: string | null; phone: string | null; timezone: string | null; status: RestaurantStatus; created_at: IsoTimestamp; updated_at: IsoTimestamp; }
export interface RestaurantMemberRecord { id: Uuid; restaurant_id: Uuid; user_id: Uuid; role: VeroxaRole; status: RestaurantMembershipStatus; created_at: IsoTimestamp; updated_at: IsoTimestamp; }
export interface RestaurantProfileFieldRecord { id: Uuid; restaurant_id: Uuid; section: string; label: string; value: string | null; status: ProfileFieldStatus; source: string | null; created_at: IsoTimestamp; updated_at: IsoTimestamp; }
export interface MediaAssetRecord { id: Uuid; restaurant_id: Uuid; storage_path: string | null; file_url: string | null; file_type: string | null; mime_type: string | null; file_size: number | null; uploaded_by: Uuid | null; status: MediaAssetStatus; ai_summary: string | null; veroxa_notes: string | null; created_at: IsoTimestamp; updated_at: IsoTimestamp; }
export interface MessageRecord { id: Uuid; restaurant_id: Uuid; sender_user_id: Uuid | null; sender_role: VeroxaRole | null; body: string; status: MessageStatus; created_at: IsoTimestamp; updated_at: IsoTimestamp; }
export interface ProfileCorrectionRecord { id: Uuid; restaurant_id: Uuid; field_id: Uuid | null; field_label: string | null; current_value: string | null; requested_value: string | null; status: ProfileCorrectionStatus; requested_by: Uuid | null; reviewed_by: Uuid | null; review_note: string | null; created_at: IsoTimestamp; updated_at: IsoTimestamp; }
export interface ActivityLogRecord { id: Uuid; restaurant_id: Uuid; actor_type: string; actor_user_id: Uuid | null; event_type: string; title: string; description: string | null; related_entity_type: string | null; related_entity_id: Uuid | null; visibility: ActivityVisibility; report_eligible: boolean; created_at: IsoTimestamp; }
export interface AiDraftRecord { id: Uuid; restaurant_id: Uuid; draft_type: string; source_entity_type: string | null; source_entity_id: Uuid | null; draft_text: string; status: AiDraftStatus; safety_flags: string[]; created_at: IsoTimestamp; updated_at: IsoTimestamp; }
export interface ApprovalRecord { id: Uuid; restaurant_id: Uuid; item_type: string; item_id: Uuid; status: ApprovalStatus; reviewed_by: Uuid | null; decision_note: string | null; created_at: IsoTimestamp; updated_at: IsoTimestamp; }
export interface ReportRecord { id: Uuid; restaurant_id: Uuid; report_type: string; period_start: IsoDate | null; period_end: IsoDate | null; status: ReportStatus; summary: string | null; body_json: JsonObject; created_at: IsoTimestamp; updated_at: IsoTimestamp; }
