"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

// Which portal a signed-in user's account belongs to — a user's id exists in
// exactly one of cqg_profiles / cutc_profiles, never both, since signup is
// domain-gated. null means "not yet resolved" or "no matching profile row".
export type PortalKind = "cqg" | "cutc" | null;

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    portalKind: PortalKind;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, portalKind: null });

const SUPABASE_CONFIGURED = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function resolvePortalKind(
    supabase: SupabaseClient<Database>,
    userId: string
): Promise<PortalKind> {
    const { data: cqg } = await supabase
        .from("cqg_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle()
        .overrideTypes<{ id: string }, { merge: false }>();
    if (cqg) return "cqg";

    const { data: cutc } = await supabase
        .from("cutc_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle()
        .overrideTypes<{ id: string }, { merge: false }>();
    if (cutc) return "cutc";

    return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [portalKind, setPortalKind] = useState<PortalKind>(null);
    const [loading, setLoading] = useState(SUPABASE_CONFIGURED);

    useEffect(() => {
        // Supabase isn't configured yet (no NEXT_PUBLIC_SUPABASE_URL) — skip
        // entirely rather than let createBrowserClient throw and take down
        // every page. Once real env vars are set this branch starts running.
        if (!SUPABASE_CONFIGURED) {
            return;
        }

        let cancelled = false;
        const supabase = createClient();

        supabase.auth.getUser().then(async ({ data }) => {
            if (cancelled) return;
            setUser(data.user);
            const kind = data.user ? await resolvePortalKind(supabase, data.user.id) : null;
            if (!cancelled) {
                setPortalKind(kind);
                setLoading(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                resolvePortalKind(supabase, session.user.id).then((kind) => {
                    if (!cancelled) setPortalKind(kind);
                });
            } else {
                setPortalKind(null);
            }
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    return <AuthContext.Provider value={{ user, loading, portalKind }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
