# iPad Share Sheet Fallback — Apple Shortcuts

The web app manifest includes Share Target and File Handler entries, but iPad Safari may not show browser web apps in the Share Sheet.

Reliable fallback: create an Apple Shortcut named **Send to AZ Clean**.

## Goal

Make a Share Sheet action so the user can tap:

```text
Files / Notes / USB file
→ Share
→ Send to AZ Clean
→ AZ Clean opens
```

## Important Limitation

A browser web app cannot always receive private file contents directly from iPadOS Share Sheet.

The Shortcut can still save time by opening the AZ Clean app/page immediately so the user does not have to hunt for it manually.

## Shortcut Version 1 — Open AZ Clean

Create this on iPad:

1. Open **Shortcuts** app.
2. Tap **+**.
3. Name it: **Send to AZ Clean**.
4. Tap the small info/settings button.
5. Turn on **Show in Share Sheet**.
6. Set accepted input to **Files** and **Text** if available.
7. Add action: **Open URLs**.
8. URL:

```text
https://vishnuhorus-commits.github.io/az-clean-auto-chunk-sorter/
```

9. Save.

Now it should appear in the iPad Share Sheet as **Send to AZ Clean**.

## Shortcut Version 2 — Copy Text Then Open AZ Clean

For text selections, use:

```text
Receive Text from Share Sheet
Copy Shortcut Input to Clipboard
Open URL: https://vishnuhorus-commits.github.io/az-clean-auto-chunk-sorter/
```

Then paste into the AZ Clean text box and press **Build Clean A–Z Index**.

## Best Daily Workflow

For many files:

```text
Open AZ Clean from Home Screen or Shortcut
Choose File
Select USB / iCloud / Downloads files
Build Clean A–Z Index
Download FULL OUTPUT SET
```

For one text selection:

```text
Select text
Share
Send to AZ Clean
Paste text
Build Clean A–Z Index
```

## Future Improvement

Create a native iOS/iPadOS wrapper app or deeper Shortcut automation if direct Share Sheet file ingestion is required.
