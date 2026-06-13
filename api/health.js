const { supabaseRequest, sendJson, handleError } = require("./_supabase");

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return sendJson(res, 405, { ok: false, error: "Method not allowed" });
    }

    await supabaseRequest("entries?select=id&limit=1");

    return sendJson(res, 200, {
      ok: true,
      service: "AZ Clean Auto Chunk Sorter API",
      database: "connected",
      version: "fullstack-database-v1",
      time: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(res, error);
  }
};
