const { supabaseRequest, sendJson, handleError } = require("./_supabase");

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const data = await supabaseRequest(
        "checkpoints?select=id,name,description,entry_count,letter_counts,status_counts,app_version,git_commit,created_at&order=created_at.desc&limit=100"
      );
      return sendJson(res, 200, { ok: true, checkpoints: data || [] });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const name = String(body.name || "").trim();
      if (!name) return sendJson(res, 400, { ok: false, error: "name is required" });

      const allEntries = await supabaseRequest("entries?select=letter,status,clean_text&order=letter.asc,clean_text.asc");
      const letterCounts = {};
      const statusCounts = {};

      for (const entry of allEntries || []) {
        letterCounts[entry.letter] = (letterCounts[entry.letter] || 0) + 1;
        statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
      }

      const checkpoint = {
        name,
        description: body.description ? String(body.description) : null,
        entry_count: allEntries?.length || 0,
        letter_counts: letterCounts,
        status_counts: statusCounts,
        snapshot: allEntries || [],
        app_version: body.app_version ? String(body.app_version) : "fullstack-database-v1",
        git_commit: body.git_commit ? String(body.git_commit) : null,
      };

      const data = await supabaseRequest("checkpoints", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(checkpoint),
      });

      return sendJson(res, 201, { ok: true, checkpoint: data?.[0] || null });
    }

    res.setHeader("Allow", "GET, POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    return handleError(res, error);
  }
};
