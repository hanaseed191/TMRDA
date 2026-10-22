-- =====================================================================
-- TMRDA — automatically place candidates who pass theory into a practical round.
-- Run after 001_tmrda_v2.sql (Supabase → SQL Editor). Safe to re-run.
--
-- When an exam attempt becomes passed (auto-graded on submit, or after staff grade
-- the essays) and the candidate's application has no practical round yet, the
-- application is assigned to an OPEN round of the same course:
--   1. the nearest upcoming round (exam_date today or later)
--   2. otherwise a round without a date
--   3. otherwise the most recent past round
-- Nothing happens if the course has no open round, or results were already sent
-- to the director. Staff can still move candidates manually afterwards.
-- =====================================================================

create or replace function tmrda_pick_open_round(p_training_id int) returns int
language sql stable set search_path = public as $$
  select id
    from practical_rounds
   where training_id = p_training_id and status = 'open'
   order by case when exam_date >= current_date then 0 when exam_date is null then 1 else 2 end,
            case when exam_date >= current_date then exam_date end asc,
            case when exam_date < current_date then exam_date end desc,
            id
   limit 1
$$;

create or replace function tmrda_auto_assign_round() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_round int;
begin
  if new.passed is true and (tg_op = 'INSERT' or old.passed is distinct from true) and new.application_id is not null then
    v_round := tmrda_pick_open_round(new.training_id);
    if v_round is not null then
      update apply_training
         set practical_round_id = v_round
       where id = new.application_id
         and practical_round_id is null
         and status = 'อนุมัติ'
         and coalesce(approval_status, 'none') in ('none', 'rejected');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists tmrda_auto_assign_round on exam_attempts;
create trigger tmrda_auto_assign_round after insert or update of passed on exam_attempts
  for each row execute function tmrda_auto_assign_round();

-- Backfill: candidates who already passed theory but have no round yet
update apply_training a
   set practical_round_id = tmrda_pick_open_round(a.training_id)
 where a.practical_round_id is null
   and a.status = 'อนุมัติ'
   and coalesce(a.approval_status, 'none') in ('none', 'rejected')
   and tmrda_pick_open_round(a.training_id) is not null
   and exists (select 1 from exam_attempts e where e.application_id = a.id and e.passed is true);

notify pgrst, 'reload schema';
