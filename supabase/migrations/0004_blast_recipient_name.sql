-- Storing the recipient's name at materialization time (rather than looking
-- it up again at send time) so the {{name}} merge field can render without
-- an extra query per recipient during dispatch.
alter table email_blast_recipients add column name text not null default '';
alter table email_blast_recipients alter column name drop default;
