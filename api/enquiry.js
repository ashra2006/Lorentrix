module.exports = async function enquiry(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end(); }
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') return res.status(415).end();
  const endpoint = process.env.FIREBASE_ENQUIRY_URL;
  if (!endpoint) return res.status(503).json({ sent: false });
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body), redirect: 'error', signal: AbortSignal.timeout(25000) });
    if (!response.ok) return res.status(response.status).json({ sent: false });
    const result = await response.json();
    return res.status(result.sent === true ? 200 : 502).json({ sent: result.sent === true });
  } catch { return res.status(502).json({ sent: false }); }
};
