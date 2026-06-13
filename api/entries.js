const {
  supabaseRequest,
  sendJson,
  handleError,
  normalizeEntry,
} = require("./_supabase");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const url = new URL(req.url, "http://localhost");
      const letter = (url.searchParams.get("letter") || "").toUpperCase();
      const status = (url.searchParams.get("status") || "").toUpperCase();
      const search = (url.searchParams.get("search") || "").trim();
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 500, 1), 5000);
      const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

      const filters = [
        "select=id,original_text,clean_text,letter,status,source_file,source_batch,notes,created_at,updated_at",
        `order=letter.asc,clean_text.asc`,
        `limit=${limit}`,
        `offset=${offset}`,
      ];

      if (/^[A-Z]$/.test(letter)) filters.push(`letter=eq.${letter}`);
      if (status) filters.push(`status=eq.${encodeURIComponent(status)}`);
      if (search) filters.push(`clean_text=ilike.*${encodeURIComponent(search)}*`);

      const data = await supabaseRequest(`entries?${filters.join("&")}`);
      return sendJson(res, 200, { ok: true, entries: data || [] });
    }

    if (req.method === "POST") {
      const entry = normalizeEntry(req.body || {});
      const data = await supabaseRequest("entries?on_conflict=clean_text", {
        method: "POST",
        headers: {
          Prefer: "resolution=ignore-duplicates,return=representation",
        },
        body: JSON.stringify(entry),
      });

      return sendJson(res, data?.length ? 201 : 200, {
        ok: true,
        inserted: data?.length || 0,
        duplicate_ignored: !data?.length,
        entry: data?.[0] || null,
      });
    }

    if (req.method === "PATCH") {
      const id = String(req.body?.id || "").trim();
      if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });

      const updates = {};
      if (req.body.status) updates.status = String(req.body.status).toUpperCase();
      if (req.body.notes !== undefined) updates.notes = req.body.notes ? String(req.body.notes) : null;
      if (req.body.source_file !== undefined) updates.source_file = req.body.source_file ? String(req.body.source_file) : null;
      if (req.body.source_batch !== undefined) updates.source_batch = req.body.source_batch ? String(req.body.source_batch) : null;
      updates.updated_at = new Date().toISOString();

      const data = await supabaseRequest(`entries?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(updates),
      });

      return sendJson(res, 200, { ok: true, entry: data?.[0] || null });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url, "http://localhost");
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });

      await supabaseRequest(`entries?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      });

      return sendJson(res, 200, { ok: true, deleted_id: id });
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    return handleError(res, error);
  }
};
