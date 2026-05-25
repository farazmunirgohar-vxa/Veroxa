import { demoAiSuggestions, demoAgents } from "@/data/demoData";
export const AIRepository = {
  recommendations: () => demoAiSuggestions,
  agents:          () => demoAgents,
};
