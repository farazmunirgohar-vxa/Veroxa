import type { AuditPrefilledOnboardingSection } from "./types";

export const MOMO_HOUSE_PILOT_CLIENT_ID = "pilot-momo-house-san-antonio";

export const momoHouseAuditPrefillSections: AuditPrefilledOnboardingSection[] = [
  { id: "business_identity", title: "Business identity", fields: [
    { id: "restaurant_name", label: "Restaurant name", value: "Momo House San Antonio", status: "prefilled", source: "audit", required: true },
    { id: "concept_cuisine", label: "Concept/cuisine", value: "Nepali-style dumplings / momo", status: "prefilled", source: "public_info", required: true },
    { id: "address", label: "Address", value: "4447 De Zavala Rd, San Antonio, TX 78249", status: "prefilled", source: "public_info", required: true },
    { id: "restaurant_phone", label: "Restaurant phone", value: "(210) 492-1711", status: "needs_owner_verification", source: "public_info", required: true },
    { id: "restaurant_email", label: "Restaurant email", value: "momohousesa@gmail.com", status: "needs_owner_verification", source: "public_info", required: false },
    { id: "website", label: "Website", value: "https://momohousesa.com", status: "prefilled", source: "public_info", required: true },
  ]},
  { id: "contact_model", title: "Contact model", fields: [
    { id: "primary_contact", label: "Primary contact", value: "Owner contact name needed", status: "missing", source: "owner", required: true },
    { id: "primary_contact_role", label: "Primary contact role", value: "Owner / manager role needed", status: "missing", source: "owner", required: true },
    { id: "primary_contact_phone_email", label: "Primary contact phone/email", value: "Use restaurant email/phone until owner confirms direct contact", status: "needs_owner_verification", source: "manual_review", required: true },
    { id: "secondary_contact", label: "Secondary contact", value: "Secondary contact needed", status: "missing", source: "owner", required: true },
    { id: "secondary_contact_role", label: "Secondary contact role", value: "Secondary role needed", status: "missing", source: "owner", required: true },
    { id: "secondary_contact_phone_email", label: "Secondary contact phone/email", value: "Secondary contact phone/email needed", status: "missing", source: "owner", required: true },
  ]},
  { id: "required_online_presence", title: "Required online presence", fields: [
    { id: "website_required", label: "Website required", value: "Website present", status: "prefilled", source: "audit", required: true },
    { id: "google_business_profile_required", label: "Google Business Profile required", value: "Needs access/link verification", status: "needs_owner_verification", source: "manual_review", required: true },
    { id: "facebook_required", label: "Facebook Page required", value: "Presence known; link/access needs verification", status: "needs_owner_verification", source: "audit", required: true },
    { id: "instagram_required", label: "Instagram required", value: "Presence known; link/access needs verification", status: "needs_owner_verification", source: "audit", required: true },
  ]},
  { id: "required_ordering_platforms", title: "Required ordering platforms", fields: [
    { id: "doordash_required", label: "DoorDash required", value: "Known presence; manager/access needs verification", status: "needs_owner_verification", source: "audit", required: true },
    { id: "ubereats_required", label: "Uber Eats required", value: "Known presence; manager/access needs verification", status: "needs_owner_verification", source: "audit", required: true },
    { id: "grubhub_required", label: "Grubhub required", value: "Known presence; manager/access needs verification", status: "needs_owner_verification", source: "audit", required: true },
  ]},
  { id: "credential_platform_connection", title: "Credential/platform connection checklist", fields: [
    { id: "gbp_access", label: "Google Business Profile access/connection", value: "Not connected; owner/team verification needed", status: "missing", source: "owner", required: true },
    { id: "facebook_access", label: "Facebook Page access/connection", value: "Not connected; owner/team verification needed", status: "missing", source: "owner", required: true },
    { id: "instagram_access", label: "Instagram Business access/connection", value: "Not connected; owner/team verification needed", status: "missing", source: "owner", required: true },
    { id: "website_access", label: "Website access if needed", value: "Needed only if Veroxa is asked to refine website details", status: "needs_owner_verification", source: "manual_review", required: true },
    { id: "doordash_manager", label: "DoorDash manager/access", value: "Not connected", status: "missing", source: "owner", required: true },
    { id: "ubereats_manager", label: "Uber Eats manager/access", value: "Not connected", status: "missing", source: "owner", required: true },
    { id: "grubhub_manager", label: "Grubhub manager/access", value: "Not connected", status: "missing", source: "owner", required: true },
    { id: "direct_ordering_access", label: "Direct ordering/app/rewards access", value: "Known direct ordering/app/rewards; access needs verification", status: "needs_owner_verification", source: "audit", required: true },
  ]},
  { id: "brand_voice", title: "Brand voice", fields: [
    { id: "tone", label: "Tone/brand voice notes", value: "Educational, warm, first-time-customer friendly; explain momo clearly", status: "prefilled", source: "veroxa_team", required: true },
    { id: "avoid", label: "Words/claims to avoid", value: "No unconfirmed offers, discounts, dietary/health/halal/organic claims, or guarantees", status: "prefilled", source: "veroxa_team", required: true },
    { id: "confirmed_claims", label: "Confirmed food/menu claims only", value: "Owner must confirm exact menu/claim details before public copy", status: "needs_owner_verification", source: "manual_review", required: true },
    { id: "no_invented_offers", label: "No invented offers/discounts", value: "Locked", status: "confirmed", source: "veroxa_team", required: true },
  ]},
  { id: "media_intake", title: "Media intake", fields: [
    { id: "food_photos_videos", label: "Food photos/videos", value: "Need usable current food media; video is internal/coming soon only", status: "needs_owner_verification", source: "owner", required: true },
    { id: "best_seller_media", label: "Best-seller media", value: "Momo education angles prepared; best-seller photos needed", status: "needs_owner_verification", source: "veroxa_team", required: true },
    { id: "menu_order_links", label: "Menu/order links", value: "Website/direct ordering known; final links need verification", status: "needs_owner_verification", source: "audit", required: true },
    { id: "content_supply", label: "Content supply status", value: "Initial supply not verified", status: "missing", source: "owner", required: true },
    { id: "logo_dining_optional", label: "Logo and dining area photos", value: "Optional, not mandatory", status: "completed_by_veroxa", source: "veroxa_team", required: false },
  ]},
  { id: "business_truth", title: "Business-truth confirmation", fields: [
    { id: "hours", label: "Hours", value: "Needs owner confirmation", status: "missing", source: "owner", required: true },
    { id: "holiday_hours", label: "Holiday hours", value: "Needs owner confirmation when relevant", status: "missing", source: "owner", required: true },
    { id: "menu_items", label: "Menu items", value: "Needs owner/menu verification", status: "needs_owner_verification", source: "owner", required: true },
    { id: "menu_prices", label: "Menu prices if mentioned", value: "Do not mention until owner-confirmed", status: "missing", source: "owner", required: true },
    { id: "offers", label: "Offers/promotions", value: "Only if already existing and owner-confirmed", status: "confirmed", source: "veroxa_team", required: true },
    { id: "catering", label: "Catering availability", value: "Known strategy angle; availability/details need owner confirmation", status: "needs_owner_verification", source: "audit", required: true },
    { id: "dietary_claims", label: "Dietary/health/halal/organic claims", value: "Do not use unless owner confirms", status: "missing", source: "owner", required: true },
    { id: "ordering_links", label: "Ordering links", value: "Direct ordering/app/rewards known; final links need owner/team verification", status: "needs_owner_verification", source: "audit", required: true },
  ]},
];

export function getMomoHouseAuditPrefillSections(): AuditPrefilledOnboardingSection[] {
  return momoHouseAuditPrefillSections;
}
