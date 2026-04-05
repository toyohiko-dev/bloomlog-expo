import { NextRequest, NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";

function createRedirectResponse(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  const response = createRedirectResponse(request, nextPath);
  const supabase = createRouteHandlerSupabaseClient(request, response);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return createRedirectResponse(request, "/login?error=oauth");
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createRedirectResponse(request, "/login?error=oauth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const destination = profile
    ? nextPath
    : `/profile/setup?next=${encodeURIComponent(nextPath)}`;

  response.headers.set("Location", new URL(destination, request.url).toString());
  return response;
}
