import { cache } from "react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatEventWhen, promotionEndsAt } from "@/lib/events";
import type { CqgEvent } from "@/lib/supabase/types";

// What the homepage, Events page, dashboard and sign-up guide need to promote an event.
export interface PromoEvent {
    id: string;
    title: string;
    description: string;
    location: string;
    when: string;
    audience: string | null;
    bannerText: string;
    buttonLabel: string;
    color: CqgEvent["promo_color"];
    eligibility: CqgEvent["eligibility"];
    instantRsvp: boolean;
    /** Where promotion links go: sign-up with the step-by-step guide (it forwards existing accounts to log in). */
    href: string;
}

export const promoHref = (eventId: string) => `/portal/signup?rsvp=${eventId}`;

export function toPromoEvent(e: CqgEvent): PromoEvent {
    return {
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        when: formatEventWhen(e.starts_at, e.ends_at),
        audience: e.promo_audience?.trim() || null,
        bannerText: e.promo_banner_text?.trim() || `RSVP: ${e.title}`,
        buttonLabel: e.promo_button_label?.trim() || `RSVP to ${e.title}`,
        color: e.promo_color,
        eligibility: e.eligibility,
        instantRsvp: e.instant_rsvp,
        href: promoHref(e.id),
    };
}

/**
 * Events being promoted right now, soonest first: flagged "promote on homepage", RSVPs not
 * locked, and not yet over. Reads with the service role so it works for logged-out visitors.
 * Never throws: a failed lookup just means nothing is promoted.
 */
export const getPromotedEvents = cache(async (): Promise<PromoEvent[]> => {
    try {
        const { data, error } = await createServiceRoleClient()
            .from("cqg_events")
            .select("*")
            .eq("promote_on_home", true)
            .eq("applications_locked", false)
            .order("starts_at", { ascending: true })
            .overrideTypes<CqgEvent[], { merge: false }>();
        if (error) throw error;
        const now = Date.now();
        return (data ?? []).filter((e) => promotionEndsAt(e.starts_at, e.ends_at).getTime() > now).map(toPromoEvent);
    } catch (err) {
        console.error("[home] promoted events lookup failed:", err);
        return [];
    }
});
