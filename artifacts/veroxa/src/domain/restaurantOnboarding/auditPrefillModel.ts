import type { AuditPrefilledOnboardingSection } from "./types";

export const MOMO_HOUSE_PILOT_CLIENT_ID = "pilot-momo-house-san-antonio";

export const momoHouseAuditPrefillSections: AuditPrefilledOnboardingSection[] = [
  { id: "restaurant_profile", title: "Restaurant profile", fields: [
    { id: "restaurant_name", label: "Restaurant name", value: "Momo House San Antonio", status: "prefilled_by_veroxa", source: "audit", required: true, note: "Canonical pilot match is safe only for San Antonio / strong-proof inputs." },
    { id: "cuisine", label: "Food concept", value: "Nepali-style dumplings / momo", status: "needs_owner_verification", source: "public_info", required: true },
    { id: "brand_positioning", label: "Helpful positioning", value: "Warm first-time momo education, De Zavala / UTSA local visibility, and owner-confirmed menu details.", status: "prefilled_by_veroxa", source: "veroxa_team", required: false },
  ]},
  { id: "business_identity", title: "Business identity", fields: [
    { id: "address", label: "Address", value: "4447 De Zavala Rd, San Antonio, TX 78249", status: "prefilled_by_veroxa", source: "public_info", required: true },
    { id: "phone", label: "Restaurant phone", value: "(210) 492-1711", status: "needs_owner_verification", source: "public_info", required: true },
    { id: "email", label: "Restaurant email", value: "momohousesa@gmail.com", status: "needs_owner_verification", source: "public_info", required: false },
    { id: "owner_contact", label: "Owner / manager contact", value: "Owner contact name, role, and best portal contact are still needed.", status: "missing", source: "owner", required: true },
    { id: "hours", label: "Hours and holiday hours", value: "Needed before public copy or profile cleanup.", status: "missing", source: "owner", required: true },
  ]},
  { id: "menu", title: "Menu", fields: [
    { id: "menu_link", label: "Menu link", value: "Website appears to carry menu/order paths; owner must confirm the preferred public link.", status: "needs_owner_verification", source: "audit", required: true },
    { id: "best_sellers", label: "Best sellers", value: "Steamed momo, fried momo, and soup momo are useful starting ideas only.", status: "needs_owner_verification", source: "manual_review", required: true },
    { id: "prices", label: "Menu prices", value: "Do not mention prices until owner confirms exact current menu/pricing.", status: "missing", source: "owner", required: true },
    { id: "claims", label: "Dietary / halal / health claims", value: "Hold all claims unless owner confirms exact wording.", status: "missing", source: "owner", required: true },
  ]},
  { id: "website", title: "Website", fields: [
    { id: "website_url", label: "Website", value: "https://momohousesa.com", status: "prefilled_by_veroxa", source: "public_info", required: true },
    { id: "website_access", label: "Website access if refinements are approved", value: "Team Faraz will complete small alignment items after access is provided.", status: "blocked_needs_access", source: "owner", required: false },
  ]},
  { id: "google_business_profile", title: "Google Business Profile", fields: [
    { id: "gbp_link", label: "Google profile / Maps link", value: "Profile should be verified manually before setup continues.", status: "needs_owner_verification", source: "manual_review", required: true },
    { id: "gbp_access", label: "Google Business Profile access", value: "Missing — needed before profile edits can be prepared for manual review.", status: "blocked_needs_access", source: "owner", required: true },
    { id: "google_posts", label: "Google posts opportunity", value: "Manual content opportunity only; no Google integration or automated publishing is connected.", status: "prefilled_by_veroxa", source: "veroxa_team", required: false },
  ]},
  { id: "ordering_links", title: "Ordering links", fields: [
    { id: "direct_ordering", label: "Direct ordering link", value: "https://momohousesa.com — preferred order path needs owner verification.", status: "needs_owner_verification", source: "audit", required: true },
    { id: "third_party_ordering", label: "DoorDash / Uber Eats / Grubhub", value: "Presence may exist; each manager link/access must be verified before use.", status: "needs_owner_verification", source: "manual_review", required: false },
    { id: "ordering_access", label: "Ordering platform access", value: "Missing — Team Faraz can only review manually after owner-provided access or confirmed public links.", status: "blocked_needs_access", source: "owner", required: false },
  ]},
  { id: "social_links", title: "Social links", fields: [
    { id: "instagram", label: "Instagram", value: "Presence known; exact link and access need owner verification.", status: "needs_owner_verification", source: "audit", required: true },
    { id: "facebook", label: "Facebook", value: "Presence known; exact Page link and access need owner verification.", status: "needs_owner_verification", source: "audit", required: true },
    { id: "social_access", label: "Facebook / Instagram access", value: "Missing — needed before Team Faraz can prepare manual updates for approval.", status: "blocked_needs_access", source: "owner", required: true },
  ]},
  { id: "review_reputation", title: "Review/reputation setup", fields: [
    { id: "review_workflow", label: "Review response workflow", value: "Pending manual workflow. Veroxa does not auto-reply to reviews, comments, DMs, or complaints.", status: "missing", source: "veroxa_team", required: true },
    { id: "complaint_boundary", label: "Complaint boundary", value: "Serious complaints require owner/team confirmation before any public response draft.", status: "completed_by_team", source: "veroxa_team", required: true },
  ]},
  { id: "media_readiness", title: "Media readiness", fields: [
    { id: "food_photos", label: "Usable food photos", value: "Fresh best-seller photos are needed for first setup.", status: "missing", source: "owner", required: true },
    { id: "storefront_logo", label: "Storefront / logo / dining area", value: "Helpful if available; not required before the first review.", status: "completed_by_team", source: "veroxa_team", required: false },
  ]},
  { id: "seo_google_visibility", title: "SEO/Google visibility readiness", fields: [
    { id: "nap_consistency", label: "Name/address/phone consistency", value: "Good starting point; owner must verify before public updates.", status: "needs_owner_verification", source: "audit", required: true },
    { id: "menu_readability", label: "Menu readability", value: "Manual checklist item: confirm menu is easy to read from Google, website, and social paths.", status: "needs_owner_verification", source: "veroxa_team", required: true },
    { id: "local_keywords", label: "Local visibility wording", value: "Team Faraz can prepare basic local wording after business truth is confirmed.", status: "completed_by_team", source: "veroxa_team", required: false },
  ]},
  { id: "credentials_access_required", title: "Credentials/access required", fields: [
    { id: "access_summary", label: "Access summary", value: "Google, Facebook, Instagram, ordering links, and website access if refinements are requested.", status: "blocked_needs_access", source: "owner", required: true },
    { id: "manual_only", label: "Manual-only safety", value: "Do not publish, automate, connect live APIs, or change public accounts from this page.", status: "completed_by_team", source: "veroxa_team", required: true },
  ]},
];

export function getMomoHouseAuditPrefillSections(): AuditPrefilledOnboardingSection[] {
  return momoHouseAuditPrefillSections;
}
