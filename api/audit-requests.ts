type Request = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};
type Response = {
  setHeader(name: string, value: string): void;
  status(code: number): { json(payload: unknown): void };
};
export default async function handler(request: Request, response: Response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  if (request.method !== "POST") return response.status(405).json({ accepted: false });
  const body = request.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return response.status(400).json({ accepted: false });
  }
  return response.status(503).json({ accepted: false });
}
