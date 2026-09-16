/**
 * POST /api/join-house
 * Body: { "email": "visitor@example.com" }
 *
 * Proxies the Join the House sign-up to the existing MailerLite form endpoint
 * server-side, so the browser never makes a cross-origin request and no JSONP
 * or injected script is involved. No MailerLite API key is required — the form
 * endpoint is the same one the MailerLite embed posts to, so subscribers keep
 * flowing into the configured Join the House form group/settings.
 *
 * Responses: { ok: true } on success, { ok: false } on failure.
 */

const MAILERLITE_FORM_URL =
  'https://assets.mailerlite.com/jsonp/2639935/forms/198792572859057792/subscribe';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Log the domain only — never the full address. */
const redact = (email) => {
  const at = String(email || '').lastIndexOf('@');
  return at > -1 ? '<redacted>' + String(email).slice(at) : '<redacted>';
};

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { return {}; }
}

/* The page may be served from a different host than this function, so the
   browser needs CORS permission for the plain POST. */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  cors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  let email = '';
  try {
    const body = await readBody(req);
    email = String(body.email || '').trim();
  } catch (e) {
    return res.status(400).json({ ok: false });
  }

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false });
  }

  const payload = new URLSearchParams();
  payload.set('fields[email]', email);
  payload.set('ml-submit', '1');
  payload.set('anticsrf', 'true');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const upstream = await fetch(MAILERLITE_FORM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Accept: 'application/json',
      },
      body: payload.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await upstream.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { /* MailerLite may reply with a JSONP wrapper */ }
    if (!data) {
      const inner = text.match(/\{[\s\S]*\}/);
      if (inner) { try { data = JSON.parse(inner[0]); } catch (e) { data = null; } }
    }

    const accepted = upstream.ok && (!data || data.success !== false);
    if (!accepted) {
      console.error('[join-house] MailerLite rejected sign-up', {
        status: upstream.status,
        mailerliteSuccess: data ? data.success : 'unparsed',
        emailDomain: redact(email),
      });
      return res.status(502).json({ ok: false });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[join-house] MailerLite request failed', {
      error: err && err.name === 'AbortError' ? 'timeout' : (err && err.message) || 'unknown',
      emailDomain: redact(email),
    });
    return res.status(502).json({ ok: false });
  }
};
