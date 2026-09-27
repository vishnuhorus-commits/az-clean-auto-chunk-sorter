# AZ Clean Auto Chunk Sorter — Production Pipeline Map

This repository is the production bridge for the A–Z alliteration archive.

## Mission

Turn scattered raw text files into a clean, deduplicated, searchable A–Z master archive without destroying originals.

## Core Rule

Original files are never edited. Every run creates exports, review files, duplicate files, reports, and a manifest.

## Folder Flow

```text
00_DROP_ALLITERATION_HERE
  Raw .txt / .md / .csv / .html text files placed by the user.

01_ORIGINALS_SAVED
  Untouched backup copies. No edits. No deletion.

02_CLEANED_SEPARATED_AZ
  A.txt through Z.txt clean letter buckets.

03_MERGED_MASTER
  MERGED_ALL_LINES.txt before final dedupe sorting.

04_DEDUPED_MASTER
  DEDUPED_ALL_LINES.txt after exact duplicate removal.

05_INDEXES
  MASTER_AZ_INDEX.txt with optional A–Z headers.

06_LOGS
  RUN_REPORT.txt and CHECKSUM_MANIFEST.csv.

99_QUARANTINE
  REVIEW_NOT_DELETED.txt and DUPLICATES_REVIEW.txt.
```

## Browser App Current Capabilities

The live `index.html` currently supports:

- Multiple file loading
- Paste raw text
- Uppercase normalization
- Keep letters and spaces only
- Minimum word filtering
- Exact duplicate removal
- Optional strict alliteration check
- A–Z bucket sorting
- Master A–Z export
- Selected letter export
- Review export
- Duplicate export
- Merged all lines export
- Deduped all lines export
- Run report export
- Checksum manifest export
- Safe mode: originals are never modified

## Production Pipeline Decision

This repo is the primary production pipeline for alliteration cleanup and A–Z sorting.

Related repos may support rhyme writing, master indexing, or experiments, but this repo is the main cleaning bridge.

## Next Build Targets

1. Add a one-click ZIP export containing all outputs.
2. Add `A.txt` through `Z.txt` batch export instead of only selected-letter export.
3. Add saved run name/date prefix for organized downloads.
4. Add near-duplicate review later, without deleting anything automatically.
5. Add a visible "Pipeline Sealed" checklist in the app.

## Safety Rules

- Never overwrite user originals.
- Never auto-delete uncertain lines.
- Review files are preserved.
- Duplicates are logged separately.
- Master archive updates should happen only after a clean export is reviewed.

## Builder Note

This file seals the current direction: one pipeline, one bridge, one source of truth.

## Automated Loop (added 2026-09-26)

This repo's REST API (`api/entries.js`, `api/import.js`) was live but silently broken:
Vercel had no `SUPABASE_URL` / key configured at all, and the upsert used
`on_conflict=clean_text`, a column with no unique constraint (only
`content_hash` does) - so every insert would have errored. Both are fixed.

The actual scheduled loop lives in Supabase, not Vercel, to avoid a new set of
external credentials (no Google Cloud service account needed):

- A Supabase Edge Function, `machine-4-worker`, drains one row at a time from
  the existing `machine_4_queue` table (built for exactly this) - splits its
  `payload_text` into lines, dedupes by `content_hash`, inserts into `entries`,
  and always logs a row to `run_log`, whether it found work or not.
- A `pg_cron` job (`machine_4_worker_loop`) calls that function every 30
  minutes. Slow on purpose, per Horus's own "just do something positive"
  instruction - the point is a real, honest, provable loop, not speed.
- Whatever already feeds Google Drive files into `machine_4_queue` (or a
  human, or a future Claude session) is the only other piece needed to make
  this fully automatic end-to-end from Drive. Today the queue is fed by hand
  as items are found; nothing here touches or removes originals in Drive.
- `GET /api/status` on the Vercel app shows the last 10 runs and current
  queue counts, so "is it actually running" is a page load, not a guess.

## The Vault (added 2026-09-27)

`vault.html` is the one private front door to the whole system - browse and
search the real archive, see whether the bridge is alive, jump straight to
an entry's original file in Drive. Gated by a single shared passphrase
(`VAULT_PASSPHRASE`, Vercel env var only, never committed) sent as an
`x-vault-key` header; `api/vault/stats.js` and `api/vault/search.js` reject
anything else with 401. No login system, no new service, no new database -
same anon-key REST calls the rest of this app already makes, just fenced
behind one shared key. Drive links come from the real
`entries.source_file_id -> source_files.drive_url` foreign key the worker
already fills in; entries from before that link existed simply show no
link, nothing is faked.
