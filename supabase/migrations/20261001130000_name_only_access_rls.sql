begin;

grant select on public.team_members to anon;
grant select, insert, update, delete
  on public.media_partners, public.media_targets
  to anon;

alter table public.team_members enable row level security;
alter table public.media_partners enable row level security;
alter table public.media_targets enable row level security;

drop policy if exists team_members_select_active_name_login
  on public.team_members;
drop policy if exists media_partners_select_name_login
  on public.media_partners;
drop policy if exists media_partners_insert_name_login
  on public.media_partners;
drop policy if exists media_partners_update_name_login
  on public.media_partners;
drop policy if exists media_partners_delete_name_login
  on public.media_partners;
drop policy if exists media_targets_select_name_login
  on public.media_targets;
drop policy if exists media_targets_insert_name_login
  on public.media_targets;
drop policy if exists media_targets_update_name_login
  on public.media_targets;
drop policy if exists media_targets_delete_name_login
  on public.media_targets;

create policy team_members_select_active_name_login
on public.team_members
for select
to anon
using (is_active = true);

create policy media_partners_select_name_login
on public.media_partners
for select
to anon
using (true);

create policy media_partners_insert_name_login
on public.media_partners
for insert
to anon
with check (true);

create policy media_partners_update_name_login
on public.media_partners
for update
to anon
using (true)
with check (true);

create policy media_partners_delete_name_login
on public.media_partners
for delete
to anon
using (true);

create policy media_targets_select_name_login
on public.media_targets
for select
to anon
using (true);

create policy media_targets_insert_name_login
on public.media_targets
for insert
to anon
with check (true);

create policy media_targets_update_name_login
on public.media_targets
for update
to anon
using (true)
with check (true);

create policy media_targets_delete_name_login
on public.media_targets
for delete
to anon
using (true);

commit;
