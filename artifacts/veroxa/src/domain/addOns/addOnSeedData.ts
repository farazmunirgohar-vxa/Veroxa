import { buildAddOnReadiness } from "./addOnReadinessEngine";
export const addOnSeedReadiness = buildAddOnReadiness({ needsBasicWebsite: true, missingFacebook: false, missingInstagram: true });
