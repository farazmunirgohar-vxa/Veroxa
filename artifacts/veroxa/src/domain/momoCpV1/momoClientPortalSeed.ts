import type { StatusBadgeTone } from "@/components/common/StatusBadge";

export type CpV1Status = "Completed" | "Prepared" | "In Progress" | "Under Veroxa Review" | "Waiting for Access" | "Waiting on Media" | "Pending Verification" | "Needs Your Attention" | "Ready to Use" | "Saved for Later" | "Better Version Helpful" | "Under Review" | "Used" | "Covered" | "Read";
export type ProfileFieldStatus = "Please Review" | "Pre-filled" | "Confirmed" | "Optional" | "Veroxa Review";
export type WebsiteAccessStatus = "Not Needed" | "Requested" | "Pending" | "Connected" | "Access Unavailable";

export function statusTone(status: string): StatusBadgeTone {
  if (/blocked/i.test(status)) return "danger";
  if (/waiting|pending|needs your attention|review|better version/i.test(status)) return "warning";
  if (/completed|confirmed|ready|covered|used/i.test(status)) return "success";
  return "info";
}

export const emptyStateCopy = {
  nothingNeeded: "Nothing needed at the moment.",
  ownerReview: "Veroxa will let you know when something needs your review.",
  media: "Veroxa will recommend new media when it is useful.",
  messages: "Veroxa will message you here when there is an update.",
};

export const momoCpV1Seed = {
  restaurantName: "Momo’s House",
  home: {
    ownerActions: [
      { title: "Confirm business hours", status: "Needs Your Attention", section: "profile", buttonLabel: "Review Profile" },
      { title: "Confirm menu source", status: "Needs Your Attention", section: "profile", buttonLabel: "Review Profile" },
      { title: "Add Veroxa to Meta or Google", status: "Waiting for Access", section: "connections", buttonLabel: "Open Connections" },
    ],
    veroxaWorkingOn: [
      { title: "Preparing first content direction", status: "In Progress" },
      { title: "Reviewing Meta/Google access", status: "Waiting for Access" },
      { title: "Preparing first weekly update", status: "Under Veroxa Review" },
    ],
    latestUpdate: "Veroxa has prepared your profile for review and is organizing the next setup steps. The next priority is confirming business details and access to Meta/Google.",
  },
  media: {
    recommendations: [
      { name: "Steamed momo photo", guidance: "Menu item photos as they are made", status: "Covered" },
      { name: "Fried momo photo", guidance: "Helpful when convenient", status: "Recommended" },
      { name: "Sauce tray photo", guidance: "Sauce photos when available", status: "Covered" },
      { name: "Snack or drink photo", guidance: "Useful when easy to capture", status: "Recommended" },
      { name: "Dining area photo", guidance: "Dining room or storefront photos when convenient", status: "Recommended" },
      { name: "Storefront photo", guidance: "Helpful for local trust when available", status: "Recommended" },
    ],
    reviewed: [
      { name: "Momo close-up photo", status: "Ready to Use", note: "Strong close-up. Good for social content." },
      { name: "Sauce tray photo", status: "Saved for Later", note: "Useful when Veroxa prepares sauce-focused content." },
      { name: "Dining room angle", status: "Better Version Helpful", note: "A brighter version would be helpful if it is easy to send." },
      { name: "Kitchen prep clip", status: "Under Review", note: "Veroxa is reviewing whether this is useful for later content." },
    ],
  },
  messages: {
    fromVeroxa: [
      { subject: "Please confirm your menu link", status: "Needs Your Attention" },
      { subject: "Meta access is still waiting for owner action", status: "Waiting for Access" },
      { subject: "New media recommendations are ready", status: "Read" },
    ],
  },
  reports: {
    weeklyIntro: "Veroxa is preparing your restaurant workspace, reviewing your profile, and organizing what is needed before public work begins.",
    weeklyDone: ["Profile prepared for review", "Initial media guidance prepared", "Meta/Google access steps identified"],
    weeklyNext: ["Confirm business details", "Confirm account access", "Review media recommendations"],
    weeklyNeeds: ["Confirm business hours", "Confirm menu source", "Add Veroxa to Meta/Google"],
  },
  connections: [
    {
      platform: "Meta Business Suite",
      status: "Waiting for Access",
      updated: "Waiting on owner access",
      meaning: "Veroxa needs access before helping with Facebook and Instagram setup.",
      next: "Please add Veroxa to Meta Business Suite when ready.",
    },
    {
      platform: "Google Business Profile",
      status: "Waiting for Access",
      updated: "Waiting on owner access",
      meaning: "Veroxa needs manager access before preparing Google profile updates.",
      next: "Please add Veroxa as a manager on your Google Business Profile when ready.",
    },
  ],
  profile: [
    {
      section: "Restaurant Basics",
      purpose: "Basic public restaurant information Veroxa should confirm before using.",
      fields: [
        { label: "Name", value: "Momo’s House", status: "Pre-filled" },
        { label: "Address", value: "San Antonio, TX — exact street address should be confirmed before public use", status: "Please Review" },
        { label: "Phone", value: "Owner confirmation needed before public use", status: "Please Review" },
        { label: "Hours", value: "Current hours should be confirmed before Veroxa uses them publicly", status: "Please Review" },
        { label: "Cuisine", value: "Momo / dumpling restaurant", status: "Pre-filled" },
      ],
    },
    {
      section: "Menu",
      purpose: "Veroxa will only use menu details after the current source is confirmed.",
      fields: [
        { label: "Current menu source", value: "Owner-confirmed menu needed", status: "Please Review" },
        { label: "Menu link or menu photo/PDF", value: "Please send or confirm the current menu source", status: "Please Review" },
        { label: "Menu accuracy status", value: "Veroxa will use the menu only after owner confirmation", status: "Veroxa Review" },
      ],
    },
    {
      section: "Delivery & Catering Notes",
      purpose: "Veroxa will only mention delivery or catering if the restaurant confirms it.",
      fields: [
        { label: "Delivery availability", value: "Confirm before Veroxa mentions delivery publicly", status: "Please Review" },
        { label: "Catering availability", value: "Only mention catering if owner confirms availability", status: "Please Review" },
      ],
    },
    {
      section: "Contacts",
      purpose: "Who Veroxa should contact if a profile detail needs a quick correction.",
      fields: [
        { label: "Primary contact", value: "Momo House owner contact — confirm best name, phone, or email", status: "Please Review" },
        { label: "Backup contact", value: "Optional backup contact", status: "Optional" },
      ],
    },
    {
      section: "Brand Notes",
      purpose: "Short notes so Veroxa stays accurate and avoids unconfirmed claims.",
      fields: [
        { label: "Popular items", value: "Steamed momo, fried momo, sauces — owner can confirm favorites", status: "Please Review" },
        { label: "Tone", value: "Warm, casual, family-friendly", status: "Pre-filled" },
        { label: "Claims to confirm", value: "Catering, delivery, discounts, ingredients, dietary claims", status: "Please Review" },
        { label: "Things Veroxa should avoid saying", value: "Halal, organic, healthy, spicy, or dietary claims unless confirmed", status: "Please Review" },
      ],
    },
    {
      section: "Website",
      purpose: "Website access is optional and only needed if Veroxa is asked to help refine the website.",
      fields: [
        { label: "Website URL", value: "Owner-confirmed website URL if available", status: "Optional" },
        { label: "Website access status", value: "Optional — only needed if Veroxa is asked to help refine the website", status: "Optional", websiteAccessStatus: "Pending" as WebsiteAccessStatus },
      ],
    },
  ],
};
