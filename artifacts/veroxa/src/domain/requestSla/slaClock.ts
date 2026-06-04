export const RESPONSE_WINDOW_HOURS = 24;
export function addHours(iso: string, hours = RESPONSE_WINDOW_HOURS): string {
  return new Date(
    new Date(iso).getTime() + hours * 60 * 60 * 1000,
  ).toISOString();
}
export function minutesUntil(
  dueAt: string,
  nowIso = new Date().toISOString(),
): number {
  return Math.round(
    (new Date(dueAt).getTime() - new Date(nowIso).getTime()) / 60000,
  );
}
