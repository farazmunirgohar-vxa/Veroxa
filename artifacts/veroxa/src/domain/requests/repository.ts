import { demoClientRequests } from "@/data/demoData";
export const RequestRepository = {
  list:     () => demoClientRequests,
  byClient: (id: string) => demoClientRequests.filter((r) => r.clientId === id),
  open:     () => demoClientRequests.filter((r) => r.status !== "Completed"),
};
