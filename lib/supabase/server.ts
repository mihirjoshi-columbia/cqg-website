import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Server Component / Server Action / Route Handler client — respects RLS as
// the signed-in user via their session cookies.
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // setAll called from a Server Component (no response to write
                        // cookies to) — safe to ignore as long as middleware.ts is
                        // refreshing the session on every request.
                    }
                },
            },
        }
    );
}

// Service-role client — bypasses RLS entirely. Only use this for trusted
// server-only work that legitimately needs to act outside a user's own RLS
// scope (e.g. the email-blast dispatch route). Never import this from
// anything that runs in the browser.
export function createServiceRoleClient() {
    return createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}
