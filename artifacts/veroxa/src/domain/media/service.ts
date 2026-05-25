import { MediaRepository } from "./repository";

export const MediaService = {
  runwayFor:    (id: string) => MediaRepository.runwayFor(id),
  needsUpload:  ()           => MediaRepository.runway().filter((r) => r.health !== "Healthy"),
  critical:     ()           => MediaRepository.runway().filter((r) => r.health === "Critical"),
};
