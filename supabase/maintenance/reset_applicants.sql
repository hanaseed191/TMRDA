-- =====================================================================
-- Delete ALL applicant accounts (role = 'user') and everything tied to them.
-- Run in Supabase → SQL Editor. THIS CANNOT BE UNDONE.
--
-- Removed (via ON DELETE CASCADE): applications (apply_training), theory exam
-- attempts, practical scores, labor histories, disability records, sessions.
-- Kept: staff accounts (admin / director / evaluator), courses, exam forms,
-- practical rounds, issued-certificate history of staff-owned data.
--
-- Uploaded document files are NOT removed by SQL (Supabase blocks direct deletes
-- on storage tables). Remove them in Dashboard → Storage → documents → user_documents.
-- =====================================================================

begin;

do $$
declare
  n_users int;
  n_apps int;
  n_attempts int;
  n_scores int;
  n_labor int;
begin
  select count(*) into n_users from users where role = 'user';
  select count(*) into n_apps from apply_training a join users u on u.id = a.user_id where u.role = 'user';
  select count(*) into n_attempts from exam_attempts e join users u on u.id = e.user_id where u.role = 'user';
  select count(*) into n_scores from practical_scores s
    join apply_training a on a.id = s.application_id join users u on u.id = a.user_id where u.role = 'user';
  select count(*) into n_labor from histories_labor h join users u on u.id = h.user_id where u.role = 'user';

  delete from users where role = 'user';

  raise notice 'Deleted % applicant accounts, % applications, % exam attempts, % practical scores, % labor histories',
    n_users, n_apps, n_attempts, n_scores, n_labor;
end $$;

-- What is left (should show 0 applicants)
select role, count(*) from users group by role order by role;

commit;
