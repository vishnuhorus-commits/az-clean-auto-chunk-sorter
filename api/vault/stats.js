// Vault dashboard strip: archive totals per letter + whether the automated
// bridge (machine-4-worker, run by pg_cron) is actually alive. One call,
// gated by x-vault-key, so the whole front door loads in a single round trip.
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

    const [letterCounts, runLog, queueCounts] = await Promise.all([
      supabaseRequest("entries_letter_counts?select=letter,n"),
      supabaseRequest("run_log?select=started_at,ended_at,items_processed,status&order=started_at.desc&limit=1"),
      supabaseRequest("machine_4_queue_status_counts?select=status,count"),
    ]);

    const byLetter = {};
    let total = 0;
    (letterCounts || []).forEach((row) => {
      byLetter[row.letter] = (byLetter[row.letter] || 0) + Number(row.n || 0);
      total += Number(row.n || 0);
    });

    const queueByStatus = {};
    (queueCounts || []).forEach((row) => {
      queueByStatus[row.status] = row.count;
    });

    return sendJson(res, 200, {
      ok: true,
      total_entries: total,
      by_letter: byLetter,
      last_run: runLog?.[0] || null,
      queue_by_status: queueByStatus,
      time: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(res, error);
  }
};
