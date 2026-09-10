-- CUTC application now collects college/major/grad-year/country/gender/
-- trading-experience per application (not per profile) -- works the same
-- way for external CUTC accounts and Columbia/Barnard members applying
-- in-account, neither of which has these fields elsewhere.
--
-- cutc_applications is empty in production as of this migration (no cycle
-- has ever been opened), so the new columns can be added NOT NULL directly.
alter table cutc_applications
    add column college text not null,
    add column major text not null,
    add column grad_year text not null,
    add column country text not null default 'United States',
    add column gender text not null,
    add column prior_internship boolean not null,
    add column internship_lined_up boolean not null;

-- Superseded by the per-application college/grad_year fields above -- these
-- were free-text at signup and are no longer collected or shown anywhere.
alter table cutc_profiles drop column school;
alter table cutc_profiles drop column year;
