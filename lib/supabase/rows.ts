import type { CqgEventApplication, CqgMembershipApplication, CqgMembershipCycle, CqgProfile } from "./types";

// Applications with their person (and cycle) attached by the database in one
// query, instead of collecting ids and looking each table up separately. Each
// of these tables links to cqg_profiles more than once (the applicant, plus
// decided_by and so on), so the join has to name the column it means.

export const MEMBERSHIP_APPLICATION_SELECT = "*, profile:cqg_profiles!profile_id(*), cycle:cqg_membership_cycles(*)";

export type MembershipApplicationRow = CqgMembershipApplication & {
    profile: CqgProfile | null;
    cycle: CqgMembershipCycle | null;
};

export const EVENT_APPLICATION_SELECT = "*, profile:cqg_profiles!profile_id(*)";

export type EventApplicationRow = CqgEventApplication & { profile: CqgProfile | null };
