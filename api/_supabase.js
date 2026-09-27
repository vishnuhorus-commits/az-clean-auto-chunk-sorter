const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
// This app only ever needs the anon key: RLS on `entries` already allows
// anon insert/select/update (see Living Memory, which uses the same key).
// SUPABASE_SERVICE_ROLE_KEY is kept as a fallback name so an older env-var
// setup still works, but nothing here needs the real service-role secret.
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertConfigured() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const error = new Error(
      "Backend is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to the deployment environment."
    );
    error.statusCode = 503;
    throw error;
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function supabaseRequest(path, options = {}) {
  assertConfigured();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.hint || data?.details || `Supabase request failed (${response.status})`
    );
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

// The Vault is the one private front door: gated by a single shared
// passphrase (VAULT_PASSPHRASE, set only in Vercel, never committed).
// Checked as a header so the page never puts the key in a URL/log line.
function requireVaultKey(req) {
  const expected = process.env.VAULT_PASSPHRASE;
  if (!expected) {
    const error = new Error("Vault is not configured (VAULT_PASSPHRASE missing).");
    error.statusCode = 503;
    throw error;
  }
  const provided = req.headers["x-vault-key"];
  if (provided !== expected) {
    const error = new Error("Wrong key.");
    error.statusCode = 401;
    throw error;
  }
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function handleError(res, error) {
  console.error(error);
  sendJson(res, error.statusCode || 500, {
    ok: false,
    error: error.message || "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.details : undefined,
  });
}

function normalizeEntry(input = {}) {
  const cleanText = String(input.clean_text ?? input.cleaned_text ?? input.text ?? "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

  const originalText = String(input.original_text ?? input.original ?? cleanText).trim();
  const letter = String(input.letter || cleanText.charAt(0) || "").toUpperCase();
  const status = String(input.status || "APPROVED").toUpperCase();

  if (!cleanText) {
    const error = new Error("clean_text is required");
    error.statusCode = 400;
    throw error;
  }

  if (!/^[A-Z]$/.test(letter)) {
    const error = new Error("letter must be A through Z");
    error.statusCode = 400;
    throw error;
  }

  const allowedStatuses = new Set([
    "APPROVED",
    "REVIEW",
    "DUPLICATE_REVIEW",
    "REJECTED",
  ]);

  if (!allowedStatuses.has(status)) {
    const error = new Error("Invalid status");
    error.statusCode = 400;
    throw error;
  }

  return {
    original_text: originalText,
    clean_text: cleanText,
    letter,
    status,
    source_file: input.source_file ? String(input.source_file) : null,
    source_batch: input.source_batch ? String(input.source_batch) : null,
    notes: input.notes ? String(input.notes) : null,
    // entries.content_hash is the column with the real unique index (see
    // entries_content_hash_uidx) - clean_text has NO unique constraint, so
    // an on_conflict=clean_text upsert was silently failing before this fix.
    content_hash: sha256(cleanText),
    word_count: cleanText.split(" ").filter(Boolean).length,
  };
}

module.exports = {
  supabaseRequest,
  sendJson,
  handleError,
  normalizeEntry,
  sha256,
  requireVaultKey,
};
