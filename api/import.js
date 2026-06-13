const {
  supabaseRequest,
  sendJson,
  handleError,
  normalizeEntry,
} = require("./_supabase");

const MAX_BATCH = 1000;

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendJson(res, 405, { ok: false, error: "Method not allowed" });
    }

    const input = Array.isArray(req.body?.entries) ? req.body.entries : [];
    if (!input.length) {
      return sendJson(res, 400, { ok: false, error: "entries must be a non-empty array" });
    }

    if (input.length > MAX_BATCH) {
      return sendJson(res, 413, {
        ok: false,
        error: `Maximum ${MAX_BATCH} entries per request. Split larger imports into chunks.`,
      });
    }

    const unique = new Map();
    const rejected = [];

    input.forEach((item, index) => {
      try {
        const normalized = normalizeEntry(item);
        unique.set(normalized.clean_text, normalized);
      } catch (error) {
        rejected.push({ index, error: error.message });
      }
    });

    const entries = [...unique.values()];
    let inserted = [];

    if (entries.length) {
      inserted = await supabaseRequest("entries?on_conflict=clean_text", {
        method: "POST",
        headers: {
          Prefer: "resolution=ignore-duplicates,return=representation",
        },
        body: JSON.stringify(entries),
      });
    }

    return sendJson(res, 200, {
      ok: true,
      received: input.length,
      valid_unique: entries.length,
      inserted: inserted?.length || 0,
      duplicates_or_existing: entries.length - (inserted?.length || 0),
      rejected,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
