-- =====================================================================
-- TMRDA v2 — schema upgrade
-- Run once in Supabase → SQL Editor (safe to re-run; every step is idempotent).
--
-- Adds: roles (user / admin / director / evaluator), hashed passwords + session
-- tokens, theory exam attempts, practical rounds with up to 3 evaluators,
-- per-evaluator practical scores, director approval and certificate numbers.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 0. Fix SERIAL sequences that were never advanced past seeded ids
-- ---------------------------------------------------------------------
select setval(pg_get_serial_sequence('users', 'id'), coalesce((select max(id) from users), 1));
select setval(pg_get_serial_sequence('training', 'id'), coalesce((select max(id) from training), 1));
select setval(pg_get_serial_sequence('apply_training', 'id'), coalesce((select max(id) from apply_training), 1));
select setval(pg_get_serial_sequence('test_form', 'id'), coalesce((select max(id) from test_form), 1));
select setval(pg_get_serial_sequence('histories_labor', 'id'), coalesce((select max(id) from histories_labor), 1));

-- ---------------------------------------------------------------------
-- 1. users — roles, address names, education, staff position
-- ---------------------------------------------------------------------
alter table users add column if not exists role varchar(20) not null default 'user';
alter table users add column if not exists position_title varchar(255) default '';
alter table users add column if not exists province_name varchar(255) default '';
alter table users add column if not exists district_name varchar(255) default '';
alter table users add column if not exists subdistrict_name varchar(255) default '';
alter table users add column if not exists zip_code varchar(10) default '';
alter table users add column if not exists education_level varchar(255) default '';
alter table users add column if not exists disability_types text default '';

update users set role = 'admin' where coalesce(is_admin, 0) = 1 and role = 'user';

do $$ begin
  alter table users add constraint users_role_check check (role in ('user', 'admin', 'director', 'evaluator'));
exception when duplicate_object then null; end $$;

-- Hash any password still stored in plain text (bcrypt hashes start with $2).
update users
   set password_hash = extensions.crypt(coalesce(nullif(password_hash, ''), 'password123'), extensions.gen_salt('bf'))
 where password_hash is null or password_hash not like '$2%';

-- ---------------------------------------------------------------------
-- 2. training — extra course metadata
-- ---------------------------------------------------------------------
alter table training add column if not exists description text default '';
alter table training add column if not exists location varchar(255) default '';
alter table training add column if not exists is_published boolean default true;

-- ---------------------------------------------------------------------
-- 3. test_form — theory vs practical, exam window, attempts
-- ---------------------------------------------------------------------
alter table test_form add column if not exists exam_type varchar(20) not null default 'theory';
alter table test_form add column if not exists exam_start_date timestamptz;
alter table test_form add column if not exists exam_end_date timestamptz;
alter table test_form add column if not exists max_attempts int not null default 1;
alter table test_form add column if not exists show_answers boolean not null default true;

-- Half-point scores must be storable (columns were INT in schema.sql)
alter table test_form alter column total_score type numeric using total_score::numeric;
alter table test_form alter column score_knowledge_max type numeric using score_knowledge_max::numeric;
alter table test_form alter column score_practice_max type numeric using score_practice_max::numeric;
alter table test_form alter column passing_percentage type numeric using passing_percentage::numeric;

update test_form
   set exam_type = 'practical'
 where exam_type = 'theory'
   and jsonb_array_length(coalesce(practical_items, '[]'::jsonb)) > 0
   and jsonb_array_length(coalesce(questions, '[]'::jsonb)) = 0;

-- ---------------------------------------------------------------------
-- 4. apply_training — enrollment review, official result snapshot, approval
-- ---------------------------------------------------------------------
alter table apply_training add column if not exists reviewed_at timestamptz;
alter table apply_training add column if not exists practical_round_id int;
alter table apply_training add column if not exists theory_score numeric;
alter table apply_training add column if not exists theory_max numeric;
alter table apply_training add column if not exists theory_passed boolean;
alter table apply_training add column if not exists practical_score numeric;
alter table apply_training add column if not exists practical_max numeric;
alter table apply_training add column if not exists practical_passed boolean;
alter table apply_training add column if not exists result_status varchar(20) not null default 'pending';
alter table apply_training add column if not exists approval_status varchar(20) not null default 'none';
alter table apply_training add column if not exists submitted_at timestamptz;
alter table apply_training add column if not exists approved_by int;
alter table apply_training add column if not exists approved_by_name varchar(255);
alter table apply_training add column if not exists approved_by_title varchar(255);
alter table apply_training add column if not exists approved_at timestamptz;
alter table apply_training add column if not exists approval_note text;
alter table apply_training add column if not exists certificate_no varchar(50);

do $$ begin
  alter table apply_training add constraint apply_training_user_training_key unique (user_id, training_id);
exception
  when duplicate_object or duplicate_table then null;
  when unique_violation then raise notice 'apply_training has duplicate (user_id, training_id) rows — unique key skipped';
end $$;

-- ---------------------------------------------------------------------
-- 5. New tables
-- ---------------------------------------------------------------------
create table if not exists sessions (
  token uuid primary key default gen_random_uuid(),
  user_id int not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create table if not exists exam_attempts (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  training_id int not null references training(id) on delete cascade,
  test_form_id int references test_form(id) on delete set null,
  application_id int references apply_training(id) on delete cascade,
  question_snapshot jsonb not null default '[]'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  manual_scores jsonb not null default '{}'::jsonb,
  auto_score numeric not null default 0,
  score numeric not null default 0,
  max_score numeric not null default 0,
  percent numeric not null default 0,
  passing_percentage numeric not null default 0,
  passed boolean,
  needs_review boolean not null default false,
  status varchar(20) not null default 'in_progress',
  started_at timestamptz not null default now(),
  deadline_at timestamptz,
  submitted_at timestamptz,
  graded_by int,
  graded_at timestamptz
);
create index if not exists exam_attempts_user_idx on exam_attempts(user_id, training_id);

-- Server-side exam rules for requests coming from the browser (anon / authenticated).
-- SQL Editor / seed scripts run as postgres and are not affected.
create or replace function tmrda_attempt_guard() returns trigger
language plpgsql set search_path = public as $$
declare
  f test_form;
  app apply_training;
  used int;
  dl timestamptz;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select * into f from test_form where id = new.test_form_id;
    if not found or f.exam_type <> 'theory' then raise exception 'NOT_FOUND'; end if;
    select * into app from apply_training where id = new.application_id;
    if not found or app.user_id <> new.user_id or app.training_id <> f.training_id or app.status <> 'อนุมัติ' then
      raise exception 'NOT_ELIGIBLE';
    end if;
    if not f.is_active
       or (f.exam_start_date is not null and now() < f.exam_start_date)
       or (f.exam_end_date is not null and now() > f.exam_end_date) then
      raise exception 'EXAM_CLOSED';
    end if;
    if exists (select 1 from exam_attempts where user_id = new.user_id and training_id = f.training_id and status = 'in_progress') then
      raise exception 'ATTEMPT_IN_PROGRESS';
    end if;
    select count(*) into used from exam_attempts where user_id = new.user_id and test_form_id = f.id;
    if used >= coalesce(f.max_attempts, 1) then raise exception 'NO_ATTEMPTS_LEFT'; end if;

    dl := now() + make_interval(mins => greatest(1, f.time_limit_minutes));
    if f.exam_end_date is not null and f.exam_end_date < dl then dl := f.exam_end_date; end if;
    new.training_id := f.training_id;
    new.passing_percentage := f.passing_percentage;
    new.status := 'in_progress';
    new.started_at := now();
    new.deadline_at := dl;
    new.submitted_at := null;
    new.manual_scores := '{}'::jsonb;
    return new;
  end if;

  -- UPDATE: identity, questions and deadline are immutable once started
  new.user_id := old.user_id;
  new.training_id := old.training_id;
  new.test_form_id := old.test_form_id;
  new.application_id := old.application_id;
  new.question_snapshot := old.question_snapshot;
  new.started_at := old.started_at;
  new.deadline_at := old.deadline_at;
  new.passing_percentage := old.passing_percentage;

  if new.answers is distinct from old.answers then
    if old.status <> 'in_progress' then raise exception 'ATTEMPT_CLOSED'; end if;
    -- 2 minute grace for network latency on the final autosave / auto-submit
    if old.deadline_at is not null and now() > old.deadline_at + interval '2 minutes' then
      raise exception 'ATTEMPT_EXPIRED';
    end if;
  end if;
  if old.status <> 'in_progress' and new.status = 'in_progress' then raise exception 'ATTEMPT_CLOSED'; end if;
  return new;
end $$;

drop trigger if exists tmrda_attempt_guard on exam_attempts;
create trigger tmrda_attempt_guard before insert or update on exam_attempts
  for each row execute function tmrda_attempt_guard();

create table if not exists practical_rounds (
  id serial primary key,
  training_id int not null references training(id) on delete cascade,
  test_form_id int not null references test_form(id) on delete cascade,
  name varchar(255) not null,
  exam_date date,
  start_time varchar(10) default '09:00',
  location varchar(255) default '',
  evaluator_ids int[] not null default '{}',
  status varchar(20) not null default 'open',
  created_at timestamptz not null default now(),
  constraint practical_rounds_max_3_evaluators check (coalesce(array_length(evaluator_ids, 1), 0) <= 3)
);

create table if not exists practical_scores (
  id serial primary key,
  round_id int not null references practical_rounds(id) on delete cascade,
  application_id int not null references apply_training(id) on delete cascade,
  evaluator_id int not null references users(id) on delete cascade,
  item_scores jsonb not null default '{}'::jsonb,
  total numeric not null default 0,
  max_total numeric not null default 0,
  comment text default '',
  status varchar(20) not null default 'draft',
  updated_at timestamptz not null default now(),
  unique (round_id, application_id, evaluator_id)
);

-- ---------------------------------------------------------------------
-- 6. Row level security + privileges
--    Sensitive columns (password hash, role, approval, certificate) are
--    only writable through the SECURITY DEFINER functions below.
-- ---------------------------------------------------------------------
alter table users enable row level security;
alter table training enable row level security;
alter table apply_training enable row level security;
alter table histories_labor enable row level security;
alter table test_form enable row level security;
alter table sessions enable row level security;
alter table exam_attempts enable row level security;
alter table practical_rounds enable row level security;
alter table practical_scores enable row level security;

do $$
declare
  t text;
  p record;
begin
  -- recreate a simple permissive policy set for the app tables
  foreach t in array array['users','training','apply_training','histories_labor','test_form','exam_attempts','practical_rounds','practical_scores'] loop
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy if exists %I on %I', p.policyname, t);
    end loop;
    execute format('create policy "tmrda_select" on %I for select using (true)', t);
    execute format('create policy "tmrda_insert" on %I for insert with check (true)', t);
    execute format('create policy "tmrda_update" on %I for update using (true) with check (true)', t);
  end loop;

  foreach t in array array['training','test_form','histories_labor','practical_rounds','practical_scores'] loop
    execute format('create policy "tmrda_delete" on %I for delete using (true)', t);
  end loop;
end $$;

-- An application can only be withdrawn before results go to the director.
create policy "tmrda_delete" on apply_training for delete
  using (coalesce(approval_status, 'none') in ('none', 'rejected') and certificate_no is null);
-- Attempts can be discarded by staff only while still in progress.
create policy "tmrda_delete" on exam_attempts for delete using (status = 'in_progress');

-- users: hide password_hash, block self-promotion
revoke all on users from anon, authenticated;
grant select (
  id, th_human_number, first_name_th, last_name_th, first_name_en, last_name_en, title_th, title_en,
  gender_id, sex_name, nationality_name, birth_day, phone_number, email, house_number, house_group,
  road_name, alley_name, subdistrict_id, district_id, province_id, heq_id, branch_name, physical_id,
  id_photo_file_pathname, identification_file_pathname, eq_file_pathname, is_allowed, is_admin, status_id,
  redirect_tag, created_at, role, position_title, province_name, district_name, subdistrict_name, zip_code,
  education_level, disability_types
) on users to anon, authenticated;
grant update (
  first_name_th, last_name_th, first_name_en, last_name_en, title_th, title_en, gender_id, sex_name,
  nationality_name, birth_day, phone_number, email, house_number, house_group, road_name, alley_name,
  branch_name, physical_id, id_photo_file_pathname, identification_file_pathname, eq_file_pathname,
  province_name, district_name, subdistrict_name, zip_code, education_level, disability_types
) on users to anon, authenticated;

-- apply_training: results / approval / certificate are server-controlled
revoke all on apply_training from anon, authenticated;
grant select, delete on apply_training to anon, authenticated;
grant insert (user_id, training_id, training_type, applicant_type, is_skill_testing, status, history_id)
  on apply_training to anon, authenticated;
grant update (status, is_accept, reviewed_at, practical_round_id, applicant_type, is_skill_testing, training_type)
  on apply_training to anon, authenticated;
grant usage, select on sequence apply_training_id_seq to anon, authenticated;

revoke all on sessions from anon, authenticated;

grant select, insert, update, delete on exam_attempts, practical_rounds, practical_scores to anon, authenticated;
grant usage, select on sequence exam_attempts_id_seq, practical_rounds_id_seq, practical_scores_id_seq to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. Auth helpers (SECURITY DEFINER)
-- ---------------------------------------------------------------------
create or replace function tmrda_public_user(u users) returns jsonb
language sql immutable as $$ select to_jsonb(u) - 'password_hash' $$;

create or replace function tmrda_actor(p_token uuid) returns users
language plpgsql security definer set search_path = public as $$
declare u users;
begin
  select users.* into u
    from sessions s join users on users.id = s.user_id
   where s.token = p_token and s.expires_at > now();
  if not found then raise exception 'SESSION_EXPIRED'; end if;
  if coalesce(u.is_allowed, 1) = 0 then raise exception 'ACCOUNT_DISABLED'; end if;
  return u;
end $$;

create or replace function tmrda_new_session(p_user_id int) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  delete from sessions where expires_at < now();
  insert into sessions(user_id) values (p_user_id) returning token into t;
  return t;
end $$;

create or replace function tmrda_login(p_identifier text, p_password text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare u users;
begin
  select * into u from users
   where th_human_number = trim(p_identifier) or lower(email) = lower(trim(p_identifier))
   order by id limit 1;
  if not found or u.password_hash is null or u.password_hash <> crypt(p_password, u.password_hash) then
    raise exception 'INVALID_CREDENTIALS';
  end if;
  if coalesce(u.is_allowed, 1) = 0 then raise exception 'ACCOUNT_DISABLED'; end if;
  return jsonb_build_object('token', tmrda_new_session(u.id), 'user', tmrda_public_user(u));
end $$;

create or replace function tmrda_session(p_token uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return tmrda_public_user(tmrda_actor(p_token));
end $$;

create or replace function tmrda_logout(p_token uuid) returns void
language sql security definer set search_path = public as $$
  delete from sessions where token = p_token
$$;

create or replace function tmrda_register(p_data jsonb, p_password text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r users;
begin
  if length(coalesce(p_password, '')) < 8 then raise exception 'WEAK_PASSWORD'; end if;
  r := jsonb_populate_record(null::users, p_data);
  if r.th_human_number !~ '^[0-9]{13}$' then raise exception 'INVALID_ID'; end if;
  if exists (select 1 from users where th_human_number = r.th_human_number) then raise exception 'DUPLICATE_ID'; end if;
  if exists (select 1 from users where lower(email) = lower(r.email)) then raise exception 'DUPLICATE_EMAIL'; end if;

  r.id := nextval(pg_get_serial_sequence('users', 'id'));
  r.password_hash := crypt(p_password, gen_salt('bf'));
  r.role := 'user';
  r.is_admin := 0;
  r.is_allowed := 1;
  r.status_id := 1;
  r.redirect_tag := 'user';
  r.created_at := now();
  r.title_th := coalesce(r.title_th, 'นาย');
  r.title_en := coalesce(r.title_en, 'Mr.');
  r.nationality_name := coalesce(r.nationality_name, 'ไทย');
  r.birth_day := coalesce(r.birth_day, '2000-01-01');
  r.house_number := coalesce(r.house_number, '-');
  r.gender_id := coalesce(r.gender_id, 1);
  r.heq_id := coalesce(r.heq_id, 1);
  r.physical_id := coalesce(r.physical_id, 1);
  insert into users select r.*;

  return jsonb_build_object('token', tmrda_new_session(r.id), 'user', tmrda_public_user(r));
end $$;

create or replace function tmrda_change_password(p_token uuid, p_old text, p_new text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare u users;
begin
  u := tmrda_actor(p_token);
  if u.password_hash <> crypt(p_old, u.password_hash) then raise exception 'INVALID_CREDENTIALS'; end if;
  if length(coalesce(p_new, '')) < 8 then raise exception 'WEAK_PASSWORD'; end if;
  update users set password_hash = crypt(p_new, gen_salt('bf')) where id = u.id;
  delete from sessions where user_id = u.id and token <> p_token;
end $$;

-- Admin: create staff / change role, access or password of any account.
create or replace function tmrda_admin_save_user(p_token uuid, p_user_id int, p_data jsonb, p_password text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  actor users;
  r users;
  v_role text := coalesce(p_data->>'role', 'user');
begin
  actor := tmrda_actor(p_token);
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  if v_role not in ('user', 'admin', 'director', 'evaluator') then raise exception 'INVALID_ROLE'; end if;

  if p_user_id is null then
    if length(coalesce(p_password, '')) < 8 then raise exception 'WEAK_PASSWORD'; end if;
    r := jsonb_populate_record(null::users, p_data);
    if r.th_human_number !~ '^[0-9]{13}$' then raise exception 'INVALID_ID'; end if;
    if exists (select 1 from users where th_human_number = r.th_human_number) then raise exception 'DUPLICATE_ID'; end if;
    if exists (select 1 from users where lower(email) = lower(r.email)) then raise exception 'DUPLICATE_EMAIL'; end if;
    r.id := nextval(pg_get_serial_sequence('users', 'id'));
    r.password_hash := crypt(p_password, gen_salt('bf'));
    r.created_at := now();
    r.is_allowed := coalesce(r.is_allowed, 1);
    r.status_id := 1;
    r.title_th := coalesce(r.title_th, 'นาย');
    r.birth_day := coalesce(r.birth_day, '1980-01-01');
    r.house_number := coalesce(r.house_number, '-');
    r.phone_number := coalesce(r.phone_number, '-');
    r.gender_id := coalesce(r.gender_id, 1);
    r.heq_id := coalesce(r.heq_id, 1);
    r.physical_id := coalesce(r.physical_id, 1);
  else
    select * into r from users where id = p_user_id;
    if not found then raise exception 'NOT_FOUND'; end if;
    if r.id = actor.id and v_role <> 'admin' then raise exception 'CANNOT_DEMOTE_SELF'; end if;
    r.first_name_th := coalesce(p_data->>'first_name_th', r.first_name_th);
    r.last_name_th := coalesce(p_data->>'last_name_th', r.last_name_th);
    r.title_th := coalesce(p_data->>'title_th', r.title_th);
    r.email := coalesce(p_data->>'email', r.email);
    r.phone_number := coalesce(p_data->>'phone_number', r.phone_number);
    r.position_title := coalesce(p_data->>'position_title', r.position_title);
    r.is_allowed := coalesce((p_data->>'is_allowed')::int, r.is_allowed);
    if length(coalesce(p_password, '')) > 0 then
      if length(p_password) < 8 then raise exception 'WEAK_PASSWORD'; end if;
      r.password_hash := crypt(p_password, gen_salt('bf'));
      delete from sessions where user_id = r.id;
    end if;
  end if;

  r.role := v_role;
  r.is_admin := case when v_role = 'admin' then 1 else 0 end;
  r.redirect_tag := v_role;

  if p_user_id is null then
    insert into users select r.*;
  else
    update users set
      first_name_th = r.first_name_th, last_name_th = r.last_name_th, title_th = r.title_th,
      email = r.email, phone_number = r.phone_number, position_title = r.position_title,
      is_allowed = r.is_allowed, password_hash = r.password_hash,
      role = r.role, is_admin = r.is_admin, redirect_tag = r.redirect_tag
    where id = r.id;
    if r.is_allowed = 0 then delete from sessions where user_id = r.id; end if;
  end if;

  return tmrda_public_user(r);
end $$;

-- ---------------------------------------------------------------------
-- 8. Results workflow
-- ---------------------------------------------------------------------
-- Admin: freeze the official result of each candidate and send to the director.
-- p_rows: [{application_id, theory_score, theory_max, theory_passed,
--           practical_score, practical_max, practical_passed, result_status}]
create or replace function tmrda_submit_results(p_token uuid, p_rows jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare
  actor users;
  row jsonb;
  n int := 0;
begin
  actor := tmrda_actor(p_token);
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;

  for row in select * from jsonb_array_elements(p_rows) loop
    update apply_training set
      theory_score = (row->>'theory_score')::numeric,
      theory_max = (row->>'theory_max')::numeric,
      theory_passed = (row->>'theory_passed')::boolean,
      practical_score = (row->>'practical_score')::numeric,
      practical_max = (row->>'practical_max')::numeric,
      practical_passed = (row->>'practical_passed')::boolean,
      result_status = coalesce(row->>'result_status', 'pending'),
      approval_status = 'submitted',
      submitted_at = now(),
      approval_note = null
    where id = (row->>'application_id')::int
      and coalesce(approval_status, 'none') in ('none', 'rejected');
    if found then n := n + 1; end if;
  end loop;
  return n;
end $$;

-- Admin: pull a submitted (not yet decided) result back for correction.
create or replace function tmrda_recall_results(p_token uuid, p_application_ids int[]) returns int
language plpgsql security definer set search_path = public as $$
declare actor users; n int;
begin
  actor := tmrda_actor(p_token);
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  update apply_training set approval_status = 'none', submitted_at = null
   where id = any(p_application_ids) and approval_status = 'submitted';
  get diagnostics n = row_count;
  return n;
end $$;

-- Director: approve or reject. Approval issues the certificate number.
create or replace function tmrda_decide_results(p_token uuid, p_application_ids int[], p_decision text, p_note text)
returns int
language plpgsql security definer set search_path = public as $$
declare
  actor users;
  n int;
begin
  actor := tmrda_actor(p_token);
  if actor.role <> 'director' then raise exception 'FORBIDDEN'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'INVALID_DECISION'; end if;

  update apply_training a set
    approval_status = p_decision,
    approval_note = nullif(trim(coalesce(p_note, '')), ''),
    approved_by = actor.id,
    approved_by_name = concat_ws(' ', actor.title_th || actor.first_name_th, actor.last_name_th),
    approved_by_title = coalesce(nullif(actor.position_title, ''), 'ผู้อำนวยการ'),
    approved_at = now(),
    certificate_no = case
      when p_decision = 'approved' and a.result_status = 'passed'
        then coalesce(a.certificate_no,
             'TMRDA-' || (extract(year from now())::int + 543) || '-' || lpad(a.id::text, 6, '0'))
      else null end
  where a.id = any(p_application_ids) and a.approval_status = 'submitted';
  get diagnostics n = row_count;
  return n;
end $$;

grant execute on function
  tmrda_login(text, text), tmrda_session(uuid), tmrda_logout(uuid), tmrda_register(jsonb, text),
  tmrda_change_password(uuid, text, text), tmrda_admin_save_user(uuid, int, jsonb, text),
  tmrda_submit_results(uuid, jsonb), tmrda_recall_results(uuid, int[]),
  tmrda_decide_results(uuid, int[], text, text)
to anon, authenticated;

revoke execute on function tmrda_actor(uuid), tmrda_new_session(int) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 9. Storage bucket for applicant documents (ID card, certificate, photo)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do update set public = true;

drop policy if exists "tmrda_documents_read" on storage.objects;
drop policy if exists "tmrda_documents_insert" on storage.objects;
drop policy if exists "tmrda_documents_update" on storage.objects;
create policy "tmrda_documents_read" on storage.objects for select using (bucket_id = 'documents');
create policy "tmrda_documents_insert" on storage.objects for insert with check (bucket_id = 'documents');
create policy "tmrda_documents_update" on storage.objects for update using (bucket_id = 'documents');

-- ---------------------------------------------------------------------
-- 10. Demo staff accounts (change these passwords after first login!)
-- ---------------------------------------------------------------------
insert into users (th_human_number, first_name_th, last_name_th, title_th, phone_number, email, house_number,
                   password_hash, role, position_title, is_admin, redirect_tag)
values
  ('3333333333333', 'วิชัย', 'บริหารดี', 'นาย', '0800000001', 'director@tmrda.com', '-',
   extensions.crypt('director123', extensions.gen_salt('bf')), 'director', 'ผู้อำนวยการสถาบัน', 0, 'director'),
  ('4444444444441', 'สมศรี', 'ประเมินเก่ง', 'นาง', '0800000011', 'evaluator1@tmrda.com', '-',
   extensions.crypt('evaluator123', extensions.gen_salt('bf')), 'evaluator', 'ผู้ประเมินภาคปฏิบัติ', 0, 'evaluator'),
  ('4444444444442', 'ประยุทธ', 'ตรวจละเอียด', 'นาย', '0800000012', 'evaluator2@tmrda.com', '-',
   extensions.crypt('evaluator123', extensions.gen_salt('bf')), 'evaluator', 'ผู้ประเมินภาคปฏิบัติ', 0, 'evaluator'),
  ('4444444444443', 'มาลี', 'ยุติธรรม', 'นางสาว', '0800000013', 'evaluator3@tmrda.com', '-',
   extensions.crypt('evaluator123', extensions.gen_salt('bf')), 'evaluator', 'ผู้ประเมินภาคปฏิบัติ', 0, 'evaluator')
on conflict (th_human_number) do nothing;

notify pgrst, 'reload schema';
