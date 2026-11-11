-- anwarbarayil.com — feedback portal + newsletter. Paste into Supabase SQL Editor
-- (project qtkvtwwtkxwigibockhi, shared with azizsaif.com newsletter) and Run.
-- Safe to re-run.

create extension if not exists pgcrypto;

-- Admins: Aziz + Anwar. Edit here AND in assets/ab.js AND the send-email ADMIN_EMAILS secret.
create or replace function public.ab_is_admin() returns boolean
language sql stable as $$
  select lower(coalesce(auth.jwt()->>'email','')) in
    ('aziz@azizsaif.com','azizsaif1967@gmail.com','aziz6492370@gmail.com','anwar.barayil@gmail.com')
$$;

create table if not exists public.ab_seminars (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  college text not null,
  city text not null,
  held_on date not null,
  active boolean default true,
  created_at timestamptz default now()
);
insert into public.ab_seminars (title, college, city, held_on)
select 'Sales as a career + goal setting', 'SAFI Institute of Advanced Study', 'Calicut', '2026-11-02'
where not exists (select 1 from public.ab_seminars where held_on = '2026-11-02');

create table if not exists public.ab_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  seminar_id uuid not null references public.ab_seminars(id),
  name text not null check (length(trim(name)) between 2 and 80),
  email text not null,
  whatsapp text,
  class_div text,
  r_overall int check (r_overall between 1 and 10),
  r_goal int check (r_goal between 1 and 10),
  r_sales_career int check (r_sales_career between 1 and 10),
  r_gs_exercise int check (r_gs_exercise between 1 and 10),
  r_clarity int check (r_clarity between 1 and 10),
  r_body int check (r_body between 1 and 10),
  r_flow int check (r_flow between 1 and 10),
  r_satisfaction int check (r_satisfaction between 1 and 10),
  consider_sales text,          -- yes | no | maybe | undecided
  goal_found text[],            -- interesting | practical | useful
  exposed_before text[],        -- yes | no | school | college | other
  practice_goals text,          -- yes | no | maybe | undecided
  learn_selling boolean,
  willing_pay boolean,
  can_organize boolean,
  recommend text,               -- yes | not sure
  comment text check (length(comment) <= 2000),
  newsletter boolean default false,
  approved boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, seminar_id)  -- one review per student per seminar; they can edit it
);

create table if not exists public.ab_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  source text,                  -- feedback | footer | admin
  unsubscribed boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.ab_campaigns (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  html text not null,
  sent_at timestamptz default now(),
  sent_count int default 0,
  failed_count int default 0,
  sent_by text
);

-- Public view: real name + ratings + comment only. No email, WhatsApp or user id.
create or replace view public.ab_reviews_public as
  select r.id, r.seminar_id, r.name, r.class_div, r.r_overall, r.r_clarity, r.r_satisfaction,
         r.comment, r.created_at, s.college, s.city, s.held_on
  from public.ab_reviews r join public.ab_seminars s on s.id = r.seminar_id
  where r.approved;
grant select on public.ab_reviews_public to anon, authenticated;

alter table public.ab_seminars    enable row level security;
alter table public.ab_reviews     enable row level security;
alter table public.ab_subscribers enable row level security;
alter table public.ab_campaigns   enable row level security;

drop policy if exists ab_seminars_read  on public.ab_seminars;
drop policy if exists ab_seminars_admin on public.ab_seminars;
create policy ab_seminars_read  on public.ab_seminars for select using (active or public.ab_is_admin());
create policy ab_seminars_admin on public.ab_seminars for all using (public.ab_is_admin()) with check (public.ab_is_admin());

drop policy if exists ab_reviews_own_insert on public.ab_reviews;
drop policy if exists ab_reviews_own_select on public.ab_reviews;
drop policy if exists ab_reviews_own_update on public.ab_reviews;
drop policy if exists ab_reviews_admin      on public.ab_reviews;
create policy ab_reviews_own_insert on public.ab_reviews for insert to authenticated
  with check (user_id = auth.uid() and lower(email) = lower(auth.jwt()->>'email'));
create policy ab_reviews_own_select on public.ab_reviews for select to authenticated using (user_id = auth.uid());
create policy ab_reviews_own_update on public.ab_reviews for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and approved = true);
create policy ab_reviews_admin      on public.ab_reviews for all using (public.ab_is_admin()) with check (public.ab_is_admin());

drop policy if exists ab_subs_insert on public.ab_subscribers;
drop policy if exists ab_subs_admin  on public.ab_subscribers;
create policy ab_subs_insert on public.ab_subscribers for insert with check (true);
create policy ab_subs_admin  on public.ab_subscribers for all using (public.ab_is_admin()) with check (public.ab_is_admin());

drop policy if exists ab_campaigns_admin on public.ab_campaigns;
create policy ab_campaigns_admin on public.ab_campaigns for all using (public.ab_is_admin()) with check (public.ab_is_admin());

-- Newsletter images: public bucket, admins upload.
insert into storage.buckets (id, name, public) values ('ab-newsletter','ab-newsletter', true)
on conflict (id) do nothing;
drop policy if exists ab_nl_read   on storage.objects;
drop policy if exists ab_nl_upload on storage.objects;
create policy ab_nl_read   on storage.objects for select using (bucket_id = 'ab-newsletter');
create policy ab_nl_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'ab-newsletter' and public.ab_is_admin());


create index if not exists ab_reviews_seminar_idx on public.ab_reviews (seminar_id, created_at desc);
