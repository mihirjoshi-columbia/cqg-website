-- Two new CTT application questions: whether the applicant needs travel &
-- housing accommodations, and (when they have a trading internship/job lined
-- up) where it is.
--
-- ctt_applications is empty in production (no cycle has been opened yet), so
-- the new required column can be added NOT NULL directly.
alter table ctt_applications
    add column travel_housing_needed boolean not null,
    add column internship_location text;
