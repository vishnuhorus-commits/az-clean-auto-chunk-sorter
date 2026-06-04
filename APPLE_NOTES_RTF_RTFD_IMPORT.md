# Apple Notes RTF / RTFD Import Plan

Apple Notes exports may appear as plain text, RTF, RTFD, PDF, HTML, or copied text depending on the export path.

This project should support the safest practical path first:

```text
Apple Notes / Apple Files
→ export or copy as text when possible
→ load .txt / .md / .html / .rtf into AZ Clean Auto Chunk Sorter
→ clean, dedupe, A-Z sort, review, export full set
```

## File Types

### TXT

Best format. Use whenever possible.

### RTF

Rich Text Format. This is usually a single file. It can be bulk converted or lightly stripped inside the browser.

Planned support:

- Accept `.rtf` files in the file picker.
- Strip common RTF control codes.
- Extract readable text.
- Send extracted text into the normal cleaning pipeline.

### RTFD

Rich Text Format Directory. On Apple systems, this is often a package/folder containing:

```text
TXT.rtf
attachments
images
metadata
```

Browser limitation:

- iPad Safari usually cannot treat `.rtfd` as a normal simple text file.
- If it appears as a folder/package, the user may need to open it and load the internal `.rtf` file.
- If the system allows selecting the internal `.rtf`, the app can process that.

### PDF / Images

Not ideal for this tool. These require OCR first, then text cleanup.

## Bulk Conversion Options

### Best iPad Path

1. Open the Apple Notes content.
2. Share / export / copy to Files as text when possible.
3. Load `.txt` or `.rtf` files into the browser app.
4. Run the full output set.

### Best Mac Path Later

Use a folder-watcher converter:

```text
00_APPLE_NOTES_RTF_RTFD_INBOX
→ convert .rtf/.rtfd to .txt
→ send .txt into 00_DROP_ALLITERATION_HERE
→ run cleaner
```

### Future Converter Script

Planned file:

```text
convert_apple_notes_to_txt.py
```

Planned behavior:

- Walk a folder in bulk.
- Find `.rtf` files.
- Find `.rtfd` packages and internal `.rtf` files.
- Convert text to `.txt`.
- Preserve originals.
- Log each conversion.
- Send converted text to the pipeline inbox.

## Safety Rule

Do not modify Apple Notes originals. Convert copies only.
