-- cqg_membership_applications is empty in production as of this migration
-- (no cycle had ever been open until the Fall 2026 one), so this is safe to
-- do directly. short_answer was an unused placeholder from the original
-- design ("extra questions TBD") -- superseded by accomplishments, which is
-- the actual Internal Membership application question.
alter table cqg_membership_applications drop column short_answer;
alter table cqg_membership_applications add column accomplishments text[] not null default '{}';
alter table cqg_membership_applications alter column accomplishments drop default;
