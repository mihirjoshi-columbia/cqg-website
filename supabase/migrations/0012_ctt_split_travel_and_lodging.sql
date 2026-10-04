-- The single "travel & housing" question is split into two (travel, lodging),
-- and Columbia/Barnard (cqg_member) applicants are no longer asked at all.
--
-- travel_housing_needed stays as a legacy column (now nullable): external
-- applicants who answered "Yes" before the split keep that answer until they
-- re-answer the two new questions, and the admin views show it as pending.
alter table ctt_applications
    add column travel_needed boolean,
    add column lodging_needed boolean;

alter table ctt_applications alter column travel_housing_needed drop not null;

-- "No" to the combined question already means neither travel nor lodging.
update ctt_applications
    set travel_needed = false, lodging_needed = false
    where applicant_type = 'external' and travel_housing_needed = false;

-- Local students aren't asked, so drop the answers they gave before this change.
update ctt_applications
    set travel_housing_needed = null
    where applicant_type = 'cqg_member';
