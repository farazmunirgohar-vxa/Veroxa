export type AddOnId = "new_basic_website" | "missing_facebook_profile" | "missing_instagram_profile";
export type AddOnReadinessStatus = "not_needed" | "may_be_needed" | "add_on_available" | "needs_client_approval" | "ready_for_manual_review" | "not_connected_to_payment";
export interface AddOnCatalogItem { id: AddOnId; label: string; displayPrice: string; included: string[]; notIncluded: string[]; clientSafeNote: string; }
export interface AddOnReadinessInput { needsBasicWebsite?: boolean; missingFacebook?: boolean; missingInstagram?: boolean; clientApproved?: boolean; }
export interface AddOnReadinessItem { id: AddOnId; label: string; status: AddOnReadinessStatus; displayPrice: string; message: string; nextAction: string; }
