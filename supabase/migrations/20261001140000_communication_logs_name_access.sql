begin;

grant select, insert on public.communication_logs to anon;

drop policy if exists communication_logs_select_name_login
  on public.communication_logs;
drop policy if exists communication_logs_insert_name_login
  on public.communication_logs;

create policy communication_logs_select_name_login
on public.communication_logs
for select
to anon
using (true);

create policy communication_logs_insert_name_login
on public.communication_logs
for insert
to anon
with check (true);

commit;
