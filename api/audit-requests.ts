export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  return Response.json({ accepted: false, size: raw.length }, { status: 503 });
}
