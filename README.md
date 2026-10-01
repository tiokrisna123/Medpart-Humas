# MULIH Media Hub

Initial application framework for the internal Humas workspace described in `PRD_MULIH_Media_Hub.md`.

## Stack

- React and TypeScript
- Vite
- Tailwind CSS
- React Router
- Supabase JavaScript client, ready for configuration
- Lucide React icons

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Fill in the Supabase project URL and publishable key.
4. Run `npm run dev`.

## Name-only team selection

The login screen lets a user select an active team member's full name. This is a convenience selector, not authentication: anyone who can access the application can choose another member's name and impersonate that profile.

To make shared Supabase data work without Supabase Auth, review and run `supabase/migrations/20261001130000_name_only_access_rls.sql` in the Supabase SQL Editor. It keeps RLS enabled but grants the `anon` role read and write policies for `media_partners` and `media_targets`, and read access to active `team_members`.

**Security warning:** because the app's publishable key is public in the browser, those policies mean anyone who can reach the Supabase project's API can read, insert, edit, or delete media partner and target records. The selected member name and role are not verified by Supabase. Do not use this setup for confidential data or a publicly accessible deployment. For trustworthy identity and role-based access, use Supabase Auth.

Do not put a Supabase service-role key in the browser or commit it to the project. Communication log access has not been added to this migration.

## Current routes

- `/login`
- `/dashboard`
- `/media`
- `/media/:id`
- `/follow-ups`
- `/templates`
- `/team`
- `/settings`

The login and data pages intentionally use setup or empty states rather than fictional partners, staff, activity, or progress.
