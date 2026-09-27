// Vault: private, read-only search over the archive. Gated by x-vault-key.
const {
  supabaseRequest,
  sendJson,
  handleError,
  requireVaultKey,
} = require("../_supabase");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return sendJson(res, 405, { ok: false, error: "Method not allowed" });
    }

    requireVaultKey(req);

    const url = new URL(req.url, "http://localhost");
    const letter = (url.searchParams.get("letter") || "").toUpperCase();
    const search = (url.searchParams.get("search") || "").trim();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

    const filters = [
      "select=id,clean_text,letter,status,source_file,created_at,source_files(drive_url,file_name)",
      "order=letter.asc,clean_text.asc",
      `limit=${limit}`,
      `offset=${offset}`,
    ];

    if (/^[A-Z]$/.test(letter)) filters.push(`letter=eq.${letter}`);
    if (search) filters.push(`clean_text=ilike.*${encodeURIComponent(search)}*`);

    const data = await supabaseRequest(`entries?${filters.join("&")}`);
    return sendJson(res, 200, { ok: true, entries: data || [] });
  } catch (error) {
    return handleError(res, error);
  }
};
