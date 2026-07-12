import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") || "/login";
  let next = "/login";
  if (requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\")) {
    const resolvedNext = new URL(requestedNext, requestUrl.origin);
    if (resolvedNext.origin === requestUrl.origin) {
      next = `${resolvedNext.pathname}${resolvedNext.search}${resolvedNext.hash}`;
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!code || !url || !key) return NextResponse.redirect(new URL("/login?auth_error=1", request.url));

  const cookieStore = await cookies();
  const response = NextResponse.redirect(new URL(next, request.url));
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        for (const item of items) response.cookies.set(item.name, item.value, item.options);
      },
    },
  });
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?auth_error=1", request.url));
  return response;
}
