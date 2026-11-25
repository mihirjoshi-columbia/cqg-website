-- CTT waitlist: applicants who weren't offered a spot yet but haven't been turned down.
-- Flow: pending -> waitlisted -> offered -> accepted | declined | expired (or rejected).
--
-- Adds the value to the shared application_status enum (the Internal Membership table
-- uses it too, but never sets it). Run this in the Supabase SQL editor.

alter type application_status add value if not exists 'waitlisted';
