-- Note/PYQ download logging — mirrors the tool_usage_logs (CGPA) pattern.
--
-- Every tracked download already funnels through increment_download_count(). We
-- extend that SECURITY DEFINER RPC to also write a row capturing WHAT was
-- downloaded (title, subject, branch, level, exam, week/year) and WHO did it
-- (user_id, email, phone) — for notes, pyqs and iitm_branch_notes alike. The
-- log INSERT is wrapped so a logging failure can never break a download.

begin;

create table if not exists public.note_download_logs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  source       text not null,            -- 'notes' | 'pyqs' | 'iitm_branch_notes'
  content_id   uuid,
  title        text,
  subject      text,
  exam_type    text,
  branch       text,
  level        text,
  class_level  text,
  year         integer,
  week_number  integer,
  file_link    text,
  user_id      uuid,
  email        text,
  phone        text
);

create index if not exists note_download_logs_created_idx on public.note_download_logs (created_at desc);
create index if not exists note_download_logs_source_idx  on public.note_download_logs (source);
create index if not exists note_download_logs_email_idx   on public.note_download_logs (email);

alter table public.note_download_logs enable row level security;

drop policy if exists "Admins read download logs" on public.note_download_logs;
create policy "Admins read download logs"
  on public.note_download_logs for select
  using ((select public.is_current_user_admin()));

-- Extend the download RPC: increment the count (unchanged behaviour) AND log.
create or replace function public.increment_download_count(
  table_name text,
  content_id uuid,
  user_email text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := nullif(user_email, '');
  v_phone text;
  v_title text; v_subject text; v_exam_type text;
  v_branch text; v_level text; v_class_level text;
  v_year int; v_week int; v_file text;
begin
  if v_email is null then v_email := auth.email(); end if;
  if v_uid is not null then
    select phone into v_phone from public.profiles where id = v_uid;
  end if;

  if table_name = 'notes' then
    update public.notes set download_count = coalesce(download_count, 0) + 1
      where id = content_id and is_active = true
      returning title, subject, exam_type, class_level, file_link
      into v_title, v_subject, v_exam_type, v_class_level, v_file;
  elsif table_name = 'pyqs' then
    update public.pyqs set download_count = coalesce(download_count, 0) + 1
      where id = content_id and is_active = true
      returning title, subject, exam_type, branch, level, class_level, year, file_link
      into v_title, v_subject, v_exam_type, v_branch, v_level, v_class_level, v_year, v_file;
  elsif table_name = 'iitm_branch_notes' then
    update public.iitm_branch_notes set download_count = coalesce(download_count, 0) + 1
      where id = content_id and is_active = true
      returning title, subject, branch, level, week_number, file_link
      into v_title, v_subject, v_branch, v_level, v_week, v_file;
  else
    return;
  end if;

  -- Only log if the increment actually hit an active row.
  if found then
    begin
      insert into public.note_download_logs (
        source, content_id, title, subject, exam_type, branch, level,
        class_level, year, week_number, file_link, user_id, email, phone
      ) values (
        table_name, content_id, v_title, v_subject, v_exam_type, v_branch, v_level,
        v_class_level, v_year, v_week, v_file, v_uid, v_email, v_phone
      );
    exception when others then
      null; -- never let logging break a download
    end;
  end if;
end;
$$;

grant execute on function public.increment_download_count(text, uuid, text) to anon, authenticated;

commit;
