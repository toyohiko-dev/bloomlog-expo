import { NextRequest, NextResponse } from "next/server";
import { hasDisplayName } from "@/lib/profiles";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

function createRedirect(origin: string, path: string) {
  return NextResponse.redirect(new URL(path, origin));
}

function applyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
}

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return createRedirect(origin, "/login?error=callback_failed");
  }

  const authResponse = createRedirect(origin, "/");
  const supabase = createRouteHandlerSupabaseClient(request, authResponse);
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const response = createRedirect(origin, "/login?error=callback_failed");
    applyCookies(authResponse, response);
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const response = createRedirect(origin, "/login?error=callback_failed");
    applyCookies(authResponse, response);
    return response;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    const response = createRedirect(origin, "/login?error=callback_failed");
    applyCookies(authResponse, response);
    return response;
  }

  const destination = hasDisplayName(profile?.display_name) ? "/" : "/profile/setup";
  const response = createRedirect(origin, destination);
  applyCookies(authResponse, response);
  return response;
}
