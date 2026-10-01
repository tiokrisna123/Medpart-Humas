create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel public.communication_type not null,
  subject text null,
  content text not null,
  description text null,
  created_by uuid null references public.team_members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index message_templates_created_by_idx
  on public.message_templates (created_by);

create index message_templates_channel_idx
  on public.message_templates (channel);

alter table public.message_templates enable row level security;

grant select, insert, update, delete
  on public.message_templates
  to anon;

create policy message_templates_select_name_login
on public.message_templates
for select
to anon
using (true);

create policy message_templates_insert_name_login
on public.message_templates
for insert
to anon
with check (true);

create policy message_templates_update_name_login
on public.message_templates
for update
to anon
using (true)
with check (true);

create policy message_templates_delete_name_login
on public.message_templates
for delete
to anon
using (true);
