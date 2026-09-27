// Read-only status view of the automated Drive -> Supabase bridge.
// Shows whether the scheduled worker (Supabase edge function "machine-4-worker",
// run by pg_cron every 30 minutes) is actually running, not just installed.
const { supabaseRequest, sendJson, handleError } = require("./_supabase");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return sendJson(res, 405, { ok: false, error: "Method not allowed" });
    }

    // machine_4_queue itself holds raw unpublished text and is locked down;
    // machine_4_queue_status_counts is a status-only aggregate view made
    // public on purpose (see migration expose_read_only_bridge_status).
    const [runLog, queueCounts] = await Promise.all([
      supabaseRequest("run_log?select=id,machine,started_at,ended_at,items_processed,status&order=started_at.desc&limit=10"),
      supabaseRequest("machine_4_queue_status_counts?select=status,count"),
    ]);

    const queueByStatus = {};
    (queueCounts || []).forEach((row) => {
      queueByStatus[row.status] = row.count;
    });

    return sendJson(res, 200, {
      ok: true,
      recent_runs: runLog || [],
      queue_by_status: queueByStatus,
      time: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(res, error);
  }
};
