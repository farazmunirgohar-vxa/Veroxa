import type { StatusBadgeTone } from "@/components/common/StatusBadge";

export type CpV1Status = "Completed" | "Prepared" | "In Progress" | "Under Veroxa Review" | "Waiting on You" | "Waiting on Access" | "Waiting on Media" | "Pending Verification" | "Needs Your Review" | "Missing" | "Ready to Use" | "Saved for Later" | "Need Better Version" | "Unread" | "Read" | "Needs Reply" | "Confirmed";
export type ProfileFieldStatus = "Pre-filled — please review" | "Needs owner verification" | "Missing" | "Owner edited" | "Confirmed" | "Pending Veroxa Review";
export type WebsiteAccessStatus = "Not Needed" | "Requested" | "Pending" | "Connected" | "Access Unavailable";

export function statusTone(status: string): StatusBadgeTone {
  if (/blocked|missing/i.test(status)) return "danger";
  if (/waiting|pending verification|needs your review|needs reply|unread|need better/i.test(status)) return "warning";
  if (/completed|confirmed|ready/i.test(status)) return "success";
  return "info";
}

export const momoCpV1Seed = {
  restaurantName: "Momo’s House",
  home: {
    completed: [
      { title: "Reviewed your online presence", status: "Completed", note: "Initial Momo House review has been organized for owner review." },
      { title: "Pre-filled your restaurant profile", status: "Prepared", note: "Business details are ready for you to confirm before Veroxa uses them." },
      { title: "Organized your first setup checklist", status: "Completed", note: "The next owner actions are grouped below." },
      { title: "Reviewed menu/order links", status: "Prepared", note: "Veroxa is checking the best owner-confirmed link to use." },
      { title: "Prepared first media guidance", status: "Prepared", note: "The Media page lists the specific photos and video that would help next." },
      { title: "Prepared Meta and Google access steps", status: "Prepared", note: "Connection steps are tracked without any live account integration." },
    ],
    needed: [
      { title: "Confirm business hours", status: "Needs Your Review", section: "profile" },
      { title: "Confirm menu/order link", status: "Needs Your Review", section: "profile" },
      { title: "Send 10–15 current food photos", status: "Waiting on You", section: "media" },
      { title: "Add Veroxa to Meta Business Suite", status: "Waiting on You", section: "connections" },
      { title: "Add Veroxa as Google Business Profile Manager", status: "Waiting on You", section: "connections" },
      { title: "Confirm catering availability", status: "Needs Your Review", section: "profile" },
    ],
    inProgress: [
      { title: "Preparing first content direction", status: "In Progress" },
      { title: "Reviewing Google Business Profile connection", status: "Waiting on Access" },
      { title: "Waiting on Meta access", status: "Waiting on Access" },
      { title: "Organizing media guidance", status: "Waiting on Media" },
      { title: "Preparing first weekly update draft", status: "Under Veroxa Review" },
      { title: "Preparing first monthly report structure", status: "Under Veroxa Review" },
    ],
    recentMessages: [
      "Veroxa: Please confirm your current business hours.",
      "Veroxa: Meta and Google access are still pending.",
      "Momo’s House: We will send new food photos this week.",
    ],
  },
  media: {
    needed: ["10 new momo photos", "3 sauce close-ups", "2 dining room photos", "1 short kitchen/prep video", "Catering/order photos if available"],
    feed: [
      { name: "Momo close-up photo", type: "photo", date: "Manual review pending", status: "Ready to Use", note: "Strong close-up. Good for Instagram/Facebook post." },
      { name: "Sauce tray photo", type: "photo", date: "Manual review pending", status: "Saved for Later", note: "Useful when Veroxa prepares sauce-focused content." },
      { name: "Dining room angle", type: "photo", date: "Manual review pending", status: "Need Better Version", note: "Too dark. Please send a brighter version if possible." },
      { name: "Kitchen prep clip", type: "video", date: "Manual review pending", status: "Under Review", note: "Saved for Veroxa review; video publishing is not active yet." },
    ],
  },
  messages: {
    inbox: [
      { subject: "Please confirm your menu link", status: "Needs Reply" },
      { subject: "Meta access is still pending", status: "Unread" },
      { subject: "First weekly update draft is under Veroxa review", status: "Read" },
      { subject: "New media needed for next week", status: "Needs Reply" },
    ],
    sent: [
      { subject: "We have new food photos coming Friday", status: "Completed" },
      { subject: "We are closed July 4th", status: "Read" },
      { subject: "Please promote catering next week", status: "Read" },
    ],
  },
  reports: {
    weeklyDone: ["Reviewed Google profile", "Organized new photos", "Prepared first content ideas", "Checked menu/order links", "Drafted first captions"],
    weeklyNext: ["Prepare 3 content pieces", "Review new food photos", "Prepare Google update draft", "Build first monthly report draft", "Confirm Meta access"],
    weeklyNeeds: ["Send new momo photos", "Confirm holiday hours", "Confirm catering availability", "Add Veroxa to Meta", "Add Veroxa to Google Business Profile"],
    monthlyHandled: ["Reviewed online presence setup", "Organized media guidance", "Prepared connection next steps"],
    worked: ["Close-up momo photos", "Sauce-focused posts", "Google photo freshness", "Best-seller content"],
    didnt: ["Dark photos", "Repeated angles", "Not enough new media", "Missing catering confirmation", "Pending Google/Meta access"],
    nextMonth: ["Focus on chicken momo and sauce content", "Add more Google photos", "Prepare catering visibility content", "Improve snack/drink content variety", "Need 10 new food photos", "Need confirmation of holiday hours", "Need confirmation of catering availability"],
  },
  connections: [
    { platform: "Meta Business Suite", status: "Pending Verification", updated: "Waiting on owner access", notes: "Waiting for Momo’s House to add Veroxa as a partner." },
    { platform: "Google Business Profile", status: "Pending Verification", updated: "Waiting on owner access", notes: "Momo’s House needs to add Veroxa as a manager before Google updates can begin." },
  ],
  profile: [
    { section: "Basic Info", fields: [
      { label: "Restaurant name", value: "Momo’s House", status: "Pre-filled — please review" },
      { label: "Address", value: "San Antonio, TX — exact street address needs owner verification", status: "Needs owner verification" },
      { label: "Phone number", value: "Owner verification needed before public use", status: "Needs owner verification" },
      { label: "Business hours", value: "Needs current owner-confirmed hours", status: "Missing" },
      { label: "Cuisine type", value: "Momo / dumpling restaurant", status: "Pre-filled — please review" },
    ]},
    { section: "Contacts", fields: [
      { label: "Primary contact", value: "Momo House owner contact — confirm best name/phone/email", status: "Needs owner verification" },
      { label: "Secondary contact", value: "Optional backup contact", status: "Missing" },
    ]},
    { section: "Menu & Ordering", fields: [
      { label: "Menu link", value: "Needs owner-confirmed current link", status: "Needs owner verification" },
      { label: "Online ordering link", value: "Needs owner-confirmed current link", status: "Needs owner verification" },
      { label: "Delivery availability", value: "Confirm available platforms before Veroxa mentions delivery", status: "Needs owner verification" },
      { label: "Catering availability", value: "Only mention catering if owner confirms exact availability", status: "Needs owner verification" },
    ]},
    { section: "Website", fields: [
      { label: "Website URL", value: "Needs owner-confirmed website or menu/order link", status: "Needs owner verification" },
      { label: "Website access status", value: "Pending", status: "Pending Veroxa Review", websiteAccessStatus: "Pending" as WebsiteAccessStatus },
    ]},
  ],
};
