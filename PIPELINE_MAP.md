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
