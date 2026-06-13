(() => {
  const API = {
    health: "/api/health",
    entries: "/api/entries",
    import: "/api/import",
    checkpoints: "/api/checkpoints",
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function button(label, className, id) {
    const el = document.createElement("button");
    el.textContent = label;
    el.className = className;
    el.id = id;
    return el;
  }

  function setDbStatus(text, ok = false) {
    const status = document.getElementById("databaseStatus");
    if (!status) return;
    status.textContent = text;
    status.style.borderColor = ok ? "#16a34a" : "#b45309";
    status.style.color = ok ? "#bbf7d0" : "#fde68a";
  }

  function setBusy(isBusy) {
    ["saveDatabaseBtn", "loadDatabaseBtn", "checkpointBtn", "checkDatabaseBtn"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = isBusy;
    });
  }

  async function readJson(response) {
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; }
    catch { data = { error: text || `Request failed (${response.status})` }; }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  async function checkDatabase() {
    setDbStatus("Checking database…");
    try {
      const data = await readJson(await fetch(API.health, { cache: "no-store" }));
      setDbStatus(data.database === "connected" ? "DATABASE CONNECTED" : "DATABASE ONLINE", true);
      return true;
    } catch (error) {
      setDbStatus(`DATABASE ERROR: ${error.message}`);
      return false;
    }
  }

  async function saveToDatabase() {
    if (typeof dedupedLines === "undefined" || !Array.isArray(dedupedLines) || !dedupedLines.length) {
      alert("Build the Clean A–Z Index first. Then press Save A–Z to Database.");
      return;
    }

    setBusy(true);
    const batchName = `AZ_RUN_${new Date().toISOString()}`;
    const sourceName = (typeof filesLoaded !== "undefined" && filesLoaded.length)
      ? filesLoaded.map(file => file.name).join(", ")
      : "PASTED_TEXT";

    const entries = dedupedLines.map(text => ({
      original_text: text,
      clean_text: text,
      letter: text.charAt(0),
      status: "APPROVED",
      source_file: sourceName,
      source_batch: batchName,
    }));

    let inserted = 0;
    let existing = 0;
    let rejected = 0;

    try {
      setDbStatus(`Saving 0 of ${entries.length.toLocaleString()}…`);

      for (let offset = 0; offset < entries.length; offset += 500) {
        const chunk = entries.slice(offset, offset + 500);
        const data = await readJson(await fetch(API.import, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: chunk }),
        }));

        inserted += data.inserted || 0;
        existing += data.duplicates_or_existing || 0;
        rejected += Array.isArray(data.rejected) ? data.rejected.length : 0;
        setDbStatus(`Saving ${Math.min(offset + chunk.length, entries.length).toLocaleString()} of ${entries.length.toLocaleString()}…`);
        await sleep(40);
      }

      setDbStatus(`SAVED: ${inserted.toLocaleString()} NEW · ${existing.toLocaleString()} ALREADY STORED`, true);
      if (document.getElementById("log")) {
        document.getElementById("log").textContent =
          `DATABASE SAVE COMPLETE\nBATCH: ${batchName}\nNEW ENTRIES: ${inserted}\nALREADY STORED: ${existing}\nREJECTED: ${rejected}\n\nYour A–Z archive is safely stored in Supabase.`;
      }
    } catch (error) {
      setDbStatus(`SAVE FAILED: ${error.message}`);
      alert(`Database save failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function loadFromDatabase() {
    setBusy(true);
    setDbStatus("Loading database…");

    try {
      const loaded = [];
      const pageSize = 5000;

      for (let offset = 0; ; offset += pageSize) {
        const data = await readJson(await fetch(`${API.entries}?limit=${pageSize}&offset=${offset}`, { cache: "no-store" }));
        const page = Array.isArray(data.entries) ? data.entries : [];
        loaded.push(...page);
        setDbStatus(`Loaded ${loaded.length.toLocaleString()} entries…`);
        if (page.length < pageSize) break;
      }

      if (typeof resetData === "function") resetData();
      const seen = new Set();

      for (const entry of loaded) {
        const text = String(entry.clean_text || "").trim();
        const letter = String(entry.letter || text.charAt(0) || "").toUpperCase();
        if (!text || !/^[A-Z]$/.test(letter) || seen.has(text)) continue;
        seen.add(text);
        dedupedLines.push(text);
        mergedLines.push(text);
        if (buckets[letter]) buckets[letter].push(text);
      }

      ABC.forEach(letter => buckets[letter].sort((a, b) => a.localeCompare(b)));
      dedupedLines = ABC.flatMap(letter => buckets[letter]);

      if (typeof setStats === "function") setStats(loaded.length);
      if (typeof renderLetters === "function") renderLetters();
      if (typeof renderPreview === "function") renderPreview();

      setDbStatus(`LOADED ${dedupedLines.length.toLocaleString()} DATABASE ENTRIES`, true);
      if (document.getElementById("log")) {
        document.getElementById("log").textContent =
          `DATABASE LOAD COMPLETE\nTOTAL RECORDS RECEIVED: ${loaded.length}\nUNIQUE A–Z LINES LOADED: ${dedupedLines.length}\n\nThe saved archive is now active in the A–Z buckets.`;
      }
    } catch (error) {
      setDbStatus(`LOAD FAILED: ${error.message}`);
      alert(`Database load failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function createCheckpoint() {
    setBusy(true);
    const defaultName = `CHECKPOINT_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;
    const name = prompt("Checkpoint name:", defaultName);

    if (!name) {
      setBusy(false);
      return;
    }

    try {
      setDbStatus("Creating checkpoint…");
      const data = await readJson(await fetch(API.checkpoints, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: "Created from the AZ Clean Auto Chunk Sorter frontend",
          app_version: "database-ui-v1",
        }),
      }));

      const count = data.checkpoint?.entry_count ?? 0;
      setDbStatus(`CHECKPOINT SAVED · ${count.toLocaleString()} ENTRIES`, true);
      if (document.getElementById("log")) {
        document.getElementById("log").textContent =
          `CHECKPOINT CREATED\nNAME: ${name}\nENTRY COUNT: ${count}\n\nThis database snapshot is recorded safely.`;
      }
    } catch (error) {
      setDbStatus(`CHECKPOINT FAILED: ${error.message}`);
      alert(`Checkpoint failed: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  function installDatabaseControls() {
    if (document.getElementById("databaseControls")) return;

    const section = document.createElement("section");
    section.id = "databaseControls";
    section.className = "card stack";
    section.style.marginTop = "14px";

    const title = document.createElement("label");
    title.textContent = "3. Database archive";

    const status = document.createElement("span");
    status.id = "databaseStatus";
    status.className = "pill";
    status.textContent = "Checking database…";
    status.style.justifyContent = "center";
    status.style.fontWeight = "900";

    const help = document.createElement("div");
    help.className = "small";
    help.textContent = "Build your clean A–Z index, then save it permanently. Load restores the stored archive on any device. Exact duplicates are ignored safely.";

    const actions = document.createElement("div");
    actions.className = "row";

    const save = button("SAVE A–Z TO DATABASE", "good", "saveDatabaseBtn");
    const load = button("LOAD A–Z FROM DATABASE", "primary", "loadDatabaseBtn");
    const checkpoint = button("CREATE CHECKPOINT", "warn", "checkpointBtn");
    const check = button("CHECK CONNECTION", "ghost", "checkDatabaseBtn");

    save.addEventListener("click", saveToDatabase);
    load.addEventListener("click", loadFromDatabase);
    checkpoint.addEventListener("click", createCheckpoint);
    check.addEventListener("click", checkDatabase);

    actions.append(save, load, checkpoint, check);
    section.append(title, status, help, actions);

    const logSection = document.getElementById("log")?.closest("section");
    if (logSection) {
      logSection.parentNode.insertBefore(section, logSection);
      const logLabel = logSection.querySelector("label");
      if (logLabel) logLabel.textContent = "4. Run log";
    } else {
      document.querySelector("main")?.appendChild(section);
    }

    checkDatabase();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installDatabaseControls);
  } else {
    installDatabaseControls();
  }
})();
