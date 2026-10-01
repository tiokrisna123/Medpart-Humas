# MULIH Media Hub design direction

## Identity

- Product: internal public-relations workspace for WCM Creative Space: Mulih Art Exhibition 2026.
- Audience: approximately ten members of the exhibition's Humas team.
- Character: contemporary Balinese art influence, minimal, calm, editorial, spacious, and professional without feeling corporate.
- Cultural reference: keep it understated and contemporary. Do not use tourism imagery or decorative traditional motifs as shorthand.
- This is an internal partner-management workspace, not a public event website.

## Design read

Reading this as an internal PR operations workspace for the MULIH Humas team, with a contemporary Balinese editorial studio language, dial ENERGY 2 / RHYTHM 2 / MOTION 1.

## Visual system

- Main background: `#11110F`, chosen as a quiet gallery-like ground for long work sessions.
- Surface: `#1A1916`, chosen to distinguish working areas without bright panels.
- Primary accent: `#C9784A`, reserved for key actions and active navigation to echo warm terracotta.
- Secondary accent: `#D6B98C`, used sparingly for secondary emphasis.
- Main text: `#F4F0E8`; muted text: `#A8A298`; border: `#302E29`.
- Semantic colors: success `#78966B`, warning `#C69A52`, danger `#B8665C`; use only with readable text labels.
- Typography: system sans-serif, selected for legibility and fast loading across the team's devices.
- Icons: use task-relevant Lucide React symbols because the PRD specifies this library. Broadcast, message, time, and people symbols identify media totals, outreach, follow-up, and partners.
- Layout: responsive workspace shell, task-first lists, and compact navigation. Avoid the generic stat-card-plus-chart dashboard pattern when real data does not exist.
- Spacing: keep related controls close and give sections room to separate distinct PR tasks, supporting fast scanning.
- Summary cards: keep metric structure consistent for quick comparison, without inventing values while data is disconnected.
- Motion: keep interaction feedback calm; the loading indicator moves only when data is explicitly loading.
- Identity motif: the MULIH wordmark and terracotta active-navigation marker provide a restrained studio identity without invented cultural ornament.

## Liveliness dials

**ENERGY 2 / RHYTHM 2 / MOTION 1**

The interface should feel composed and expressive through editorial hierarchy and a few purposeful layout shifts, with hover and focus feedback only.

## Data integrity

No partner names, staff activity, statistics, or progress are seeded as if they were real. Show empty or setup states until Supabase data is available.

## Source note

This document formats the owner's supplied visual direction. The supplied em dash is intentionally not repeated in UI copy.
