import { demoBottlenecks } from "@/data/demoData";
export const OperationsRepository = {
  bottlenecks: () => demoBottlenecks,
  critical:    () => demoBottlenecks.filter((b) => b.severity === "Critical"),
};
