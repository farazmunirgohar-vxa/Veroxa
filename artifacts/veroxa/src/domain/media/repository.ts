import { demoMediaItems, demoMediaRunway } from "@/data/demoData";
import type { MediaItem, MediaRunway } from "./types";

export const MediaRepository = {
  list:       (): MediaItem[]   => demoMediaItems,
  byClient:   (id: string)      => demoMediaItems.filter((m) => m.clientId === id),
  runway:     (): MediaRunway[] => demoMediaRunway,
  runwayFor:  (id: string)      => demoMediaRunway.find((r) => r.clientId === id),
};
