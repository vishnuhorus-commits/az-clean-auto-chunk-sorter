# Hybrid Automation Plan — iPad Tool + Folder Watcher

This project uses a two-layer automation strategy:

1. iPad-safe browser automation for immediate daily use.
2. True folder-watcher automation for future desktop/cloud execution.

This is the chosen production direction.

---

## Layer 1 — iPad-Safe Browser Automation

Purpose: Work now on iPad, Safari, Bing, iCloud, Dropbox, and Google Drive file picker flows.

### User Flow

```text
Open AZ Clean Auto Chunk Sorter
Choose one or more raw text files
Press Build Clean A–Z Index
Press Download FULL OUTPUT SET
Save outputs into dated folder
Review REVIEW_NOT_DELETED and DUPLICATES_REVIEW
Promote clean master files only after review
```

### Strengths

- Works on iPad without terminal.
- No Python required by the user.
- No app install required.
- Safe mode: originals are never modified.
- Handles large text batches in the browser.
- Produces master, deduped, review, duplicate, report, manifest, and A–Z bucket outputs.

### Limitations

- iPad browser cannot automatically watch private folders.
- User must choose files manually.
- Browser cannot silently write into iCloud/Dropbox/Google Drive folders without user approval.
- Multiple downloads may require Safari permission.

---

## Layer 3 — True Folder-Watcher Automation

Purpose: Future full automation where a folder is watched and processed automatically.

### Target Flow

```text
User drops raw .txt files into 00_DROP_ALLITERATION_HERE
Watcher detects new files
Script copies originals to 01_ORIGINALS_SAVED
Script cleans and dedupes lines
Script creates A.txt through Z.txt
Script creates MASTER_AZ_INDEX.txt
Script creates REVIEW_NOT_DELETED.txt
Script creates DUPLICATES_REVIEW.txt
Script creates RUN_REPORT.txt
Script creates CHECKSUM_MANIFEST.csv
Script moves completed batch into dated output folder
Script logs batch as processed so it is not run twice
```

### Best Runtime Options

1. Mac folder watcher using Python or Apple Shortcuts.
2. GitHub Actions triggered by uploaded raw files.
3. Cloud automation triggered by a synced Dropbox/Drive folder.
4. Later desktop app wrapper if needed.

### Safety Rules

- Never modify originals.
- Never delete uncertain lines automatically.
- Every run must create a report.
- Every run must create a manifest.
- Every processed batch must receive a unique timestamp.
- Every raw file must be marked done after processing to avoid repeat runs.

---

## Recommended Build Order

### Phase A — Browser Production Tool

Status: Active.

Tasks:

- Keep app iPad-safe.
- Keep file picker flow simple.
- Keep safe-mode language visible.
- Use full output set download.
- Add optional ZIP export later if browser support is stable.
- Add run checklist and sealed output instructions.

### Phase B — Repository Structure

Create these folders in the repo when ready:

```text
00_DROP_ALLITERATION_HERE/
01_ORIGINALS_SAVED/
02_CLEANED_SEPARATED_AZ/
03_MERGED_MASTER/
04_DEDUPED_MASTER/
05_INDEXES/
06_LOGS/
99_QUARANTINE/
```

### Phase C — Folder Watcher Script

Create a future script that can run on Mac or cloud:

```text
watcher.py
cleaner.py
manifest.py
archive_batch.py
```

The user should not need to edit code. The scripts should use simple folders and readable text files.

### Phase D — Auto-Processed Batch Log

Create a batch log:

```text
PROCESSED_BATCHES_LOG.csv
```

Columns:

```text
batch_id,run_time,input_file_count,raw_lines,kept_lines,duplicates,review_lines,status,notes
```

---

## Final Decision

The system will use:

- **Layer 1** for immediate iPad production.
- **Layer 3** for future real folder watching.

This avoids waiting for perfect automation while still building toward the final automated archive engine.
