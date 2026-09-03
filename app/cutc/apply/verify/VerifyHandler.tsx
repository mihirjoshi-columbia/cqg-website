"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// See app/portal/verify/VerifyHandler.tsx — same reasoning: Supabase's
// admin-generated links redirect here with session tokens in the URL hash
// fragment, which only client-side JS can read.
export default function VerifyHandler() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            const supabase = createClient();
            const hash = window.location.hash.startsWith("#")
                ? window.location.hash.slice(1)
                : window.location.hash;
            const hashParams = new URLSearchParams(hash);
            const searchParams = new URLSearchParams(window.location.search);

            const errorDescription =
                hashParams.get("error_description") || searchParams.get("error_description");
            if (errorDescription) {
                if (!cancelled) setError(errorDescription.replace(/\+/g, " "));
                return;
            }

            const type = hashParams.get("type") || searchParams.get("type");
            const destination =
                type === "recovery" ? "/cutc/apply/reset-password" : "/cutc/apply/dashboard?verified=1";

            const accessToken = hashParams.get("access_token");
            const refreshToken = hashParams.get("refresh_token");
            if (accessToken && refreshToken) {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });
                if (cancelled) return;
                if (sessionError) {
                    setError("This link is invalid or has expired.");
                    return;
                }
                router.replace(destination);
                return;
            }

            const code = searchParams.get("code");
            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (cancelled) return;
                if (exchangeError) {
                    setError("This link is invalid or has expired.");
                    return;
                }
                router.replace(destination);
                return;
            }

            if (!cancelled) setError("This link is invalid or has expired.");
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [router]);

    if (error) {
        return (
            <div className="flex flex-col gap-4">
                <div className="form-banner form-banner-error">{error}</div>
                <Link href="/cutc/apply/login" className="text-pink-deep font-semibold text-sm">
                    Back to login
                </Link>
            </div>
        );
    }

    return <p className="text-ink-faint text-sm">Verifying…</p>;
}
