import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

// Refreshes the Supabase auth session on every request and redirects
// unauthenticated users away from portal routes. Route-specific tier checks
// (e.g. admin-only) happen in each protected page/layout itself, since they
// need a DB read (the profile row) that's cheaper to do once per page than
// on every single request through middleware.
export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Before Supabase is wired up (no env vars yet), let every request
    // through untouched rather than 500ing the whole site — only the portal
    // routes actually need a session, and they'll fail clearly on their own
    // once someone tries to use them.
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isCqgProtected = path.startsWith("/portal") && !isPublicPortalPath(path);
    const isCttProtected = path.startsWith("/ctt/apply") && !isPublicCttPath(path);

    if (!user && (isCqgProtected || isCttProtected)) {
        const redirectPath = isCttProtected ? "/ctt/apply/login" : "/portal/login";
        const url = request.nextUrl.clone();
        url.pathname = redirectPath;
        url.searchParams.set("next", path);
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

function isPublicPortalPath(path: string) {
    return [
        "/portal/login",
        "/portal/signup",
        "/portal/verify",
        "/portal/forgot-password",
        "/portal/reset-password",
    ].some((p) => path === p || path.startsWith(p + "/"));
}

function isPublicCttPath(path: string) {
    return [
        "/ctt/apply/login",
        "/ctt/apply/signup",
        "/ctt/apply/verify",
        "/ctt/apply/forgot-password",
        "/ctt/apply/reset-password",
    ].some((p) => path === p || path.startsWith(p + "/")) || path === "/ctt/apply";
}
