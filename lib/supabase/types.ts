// Hand-written to match supabase/migrations/0001_init.sql. If the schema
// changes, update this alongside the migration (no live project to run
// `supabase gen types` against yet).

export type CqgTier = "general_body" | "member" | "admin";
export type CqgSchool = "CC" | "SEAS" | "Barnard" | "GS" | "GRAD";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type EventApplicationStatus =
    | "pending"
    | "accepted"
    | "waitlisted"
    | "rejected"
    | "withdrawn";
export type CutcApplicantType = "cqg_member" | "external";
export type BlastSegmentType = "cqg_tier" | "cutc_group" | "event_group";
export type BlastStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type BlastRecipientStatus = "pending" | "sent" | "failed";
export type ProfileKind = "cqg" | "cutc";

export interface CqgProfile {
    id: string;
    email: string;
    name: string;
    school: CqgSchool;
    grad_program: string | null;
    year: string;
    major: string;
    resume_path: string | null;
    tier: CqgTier;
    gender: string | null;
    resume_reminder_sent_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CqgMembershipCycle {
    id: string;
    label: string;
    opens_at: string;
    closes_at: string;
    created_by: string | null;
    created_at: string;
}

export interface CqgMembershipApplication {
    id: string;
    profile_id: string;
    cycle_id: string;
    status: ApplicationStatus;
    accomplishments: string[];
    submitted_at: string;
    decided_at: string | null;
    decided_by: string | null;
}

export interface CutcProfile {
    id: string;
    email: string;
    name: string;
    resume_path: string | null;
    attestation: boolean;
    resume_reminder_sent_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CutcCycle {
    id: string;
    label: string;
    opens_at: string;
    closes_at: string;
    created_by: string | null;
    created_at: string;
}

export interface CutcApplication {
    id: string;
    cycle_id: string;
    status: ApplicationStatus;
    applicant_type: CutcApplicantType;
    cqg_profile_id: string | null;
    cutc_profile_id: string | null;
    college: string;
    major: string;
    grad_year: string;
    country: string;
    gender: string;
    prior_internship: boolean;
    internship_lined_up: boolean;
    submitted_at: string;
    decided_at: string | null;
    decided_by: string | null;
}

export interface CqgEvent {
    id: string;
    title: string;
    description: string;
    location: string;
    starts_at: string;
    ends_at: string | null;
    capacity: number | null;
    applications_locked: boolean;
    created_by: string | null;
    created_at: string;
}

export interface CqgEventApplication {
    id: string;
    event_id: string;
    profile_id: string;
    status: EventApplicationStatus;
    attended: boolean;
    attended_marked_at: string | null;
    attended_marked_by: string | null;
    applied_at: string;
    decided_at: string | null;
    decided_by: string | null;
}

export interface EmailBlast {
    id: string;
    subject: string;
    body_html: string;
    segment_type: BlastSegmentType;
    segment_params: Record<string, unknown>;
    scheduled_at: string | null;
    status: BlastStatus;
    created_by: string | null;
    created_at: string;
    sent_at: string | null;
}

export interface EmailBlastRecipient {
    id: string;
    blast_id: string;
    profile_kind: ProfileKind;
    profile_id: string;
    email: string;
    name: string;
    status: BlastRecipientStatus;
    sent_at: string | null;
    error: string | null;
}

export interface Database {
    __InternalSupabase: {
        PostgrestVersion: "13";
    };
    public: {
        Tables: {
            cqg_profiles: {
                Row: CqgProfile;
                Insert: Omit<CqgProfile, "created_at" | "updated_at" | "tier" | "resume_path" | "resume_reminder_sent_at"> &
                    Partial<Pick<CqgProfile, "tier" | "resume_path" | "resume_reminder_sent_at">>;
                Update: Partial<CqgProfile>;
                Relationships: [];
            };
            cqg_membership_cycles: {
                Row: CqgMembershipCycle;
                Insert: Omit<CqgMembershipCycle, "id" | "created_at">;
                Update: Partial<CqgMembershipCycle>;
                Relationships: [];
            };
            cqg_membership_applications: {
                Row: CqgMembershipApplication;
                Insert: Omit<
                    CqgMembershipApplication,
                    "id" | "status" | "submitted_at" | "decided_at" | "decided_by"
                >;
                Update: Partial<CqgMembershipApplication>;
                Relationships: [];
            };
            cutc_profiles: {
                Row: CutcProfile;
                Insert: Omit<CutcProfile, "created_at" | "updated_at" | "resume_path" | "resume_reminder_sent_at"> &
                    Partial<Pick<CutcProfile, "resume_path" | "resume_reminder_sent_at">>;
                Update: Partial<CutcProfile>;
                Relationships: [];
            };
            cutc_cycles: {
                Row: CutcCycle;
                Insert: Omit<CutcCycle, "id" | "created_at">;
                Update: Partial<CutcCycle>;
                Relationships: [];
            };
            cutc_applications: {
                Row: CutcApplication;
                Insert: Omit<
                    CutcApplication,
                    "id" | "status" | "submitted_at" | "decided_at" | "decided_by"
                >;
                Update: Partial<CutcApplication>;
                Relationships: [];
            };
            cqg_events: {
                Row: CqgEvent;
                Insert: Omit<CqgEvent, "id" | "created_at" | "applications_locked"> &
                    Partial<Pick<CqgEvent, "applications_locked">>;
                Update: Partial<CqgEvent>;
                Relationships: [];
            };
            cqg_event_applications: {
                Row: CqgEventApplication;
                // writes go through the cqg_event_* RPC functions only
                Insert: Record<string, never>;
                Update: Record<string, never>;
                Relationships: [];
            };
            email_blasts: {
                Row: EmailBlast;
                Insert: Omit<
                    EmailBlast,
                    "id" | "status" | "created_at" | "sent_at"
                > &
                    Partial<Pick<EmailBlast, "status">>;
                Update: Partial<EmailBlast>;
                Relationships: [];
            };
            email_blast_recipients: {
                Row: EmailBlastRecipient;
                Insert: Omit<EmailBlastRecipient, "id" | "status" | "sent_at" | "error"> &
                    Partial<Pick<EmailBlastRecipient, "status" | "sent_at" | "error">>;
                Update: Partial<EmailBlastRecipient>;
                Relationships: [];
            };
        };
        Views: Record<never, never>;
        Functions: {
            cqg_event_apply: {
                Args: { p_event_id: string };
                Returns: CqgEventApplication;
            };
            cqg_event_withdraw: {
                Args: { p_application_id: string };
                Returns: undefined;
            };
            cqg_event_decide: {
                Args: { p_application_id: string; p_approve: boolean };
                Returns: undefined;
            };
            cqg_event_set_attendance: {
                Args: { p_application_id: string; p_attended: boolean };
                Returns: undefined;
            };
        };
    };
}
