import type { ActivityLogRecord, AiDraftRecord, ApprovalRecord, MediaAssetRecord, MessageRecord, ProfileCorrectionRecord, ReportRecord, RestaurantProfileFieldRecord, RestaurantRecord, Uuid } from "./databaseTypes";

export interface RestaurantRepository { getRestaurant(id: Uuid): Promise<RestaurantRecord | null>; listProfileFields(restaurantId: Uuid): Promise<RestaurantProfileFieldRecord[]>; }
export interface MediaAssetRepository { listMediaAssets(restaurantId: Uuid): Promise<MediaAssetRecord[]>; }
export interface MessageRepository { listMessages(restaurantId: Uuid): Promise<MessageRecord[]>; }
export interface ProfileCorrectionRepository { listProfileCorrections(restaurantId: Uuid): Promise<ProfileCorrectionRecord[]>; }
export interface ActivityLogRepository { listActivity(restaurantId: Uuid): Promise<ActivityLogRecord[]>; }
export interface AiDraftRepository { listDrafts(restaurantId: Uuid): Promise<AiDraftRecord[]>; }
export interface ApprovalRepository { listApprovals(restaurantId: Uuid): Promise<ApprovalRecord[]>; }
export interface ReportRepository { listReports(restaurantId: Uuid): Promise<ReportRecord[]>; }

export interface LiveAutomationRepositoryBundle { restaurants: RestaurantRepository; mediaAssets: MediaAssetRepository; messages: MessageRepository; profileCorrections: ProfileCorrectionRepository; activityLog: ActivityLogRepository; aiDrafts: AiDraftRepository; approvals: ApprovalRepository; reports: ReportRepository; }
