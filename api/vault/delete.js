// Vault: the one place the read-only wall comes down. Lets Horus remove a
// single garbage/corrupted row straight from the archive index (entries).
// Never touches the original file in Drive - this only ever deletes a row
// in the derived, searchable `entries` table, not a source document.
const { supabaseRequest, sendJson, handleError, requireVaultKey } = require("../_supabase");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "DELETE") {
      res.setHeader("Allow", "DELETE");
      return sendJson(res, 405, { ok: false, error: "Method not allowed" });
    }

    requireVaultKey(req);

    const url = new URL(req.url, "http://localhost");
    const id = url.searchParams.get("id");
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });

    await supabaseRequest(`entries?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });

    return sendJson(res, 200, { ok: true, deleted_id: id });
  } catch (error) {
    return handleError(res, error);
  }
};
