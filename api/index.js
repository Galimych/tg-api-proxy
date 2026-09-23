export default async function handler(req, res) {
  // Формируем полный целевой адрес Telegram API
  const cleanPath = req.url.replace(/^\/api\/index/, '').replace(/^\/api/, '');
  const targetUrl = `https://api.telegram.org${cleanPath}`;

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!['host', 'content-length'].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  }

  const options = {
    method: req.method,
    headers: headers,
    redirect: 'follow'
  };

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    options.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
  }

  try {
    const response = await fetch(targetUrl, options);
    const data = await response.arrayBuffer();

    response.headers.forEach((val, key) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });

    res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    res.status(502).json({ ok: false, description: error.message });
  }
}
