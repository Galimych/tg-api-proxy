export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const cleanPath = req.url.replace(/^\/api\/index/, '').replace(/^\/api/, '');
  const targetUrl = `https://api.telegram.org${cleanPath}`;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const bodyBuffer = Buffer.concat(chunks);

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    // Исключаем заголовки хоста и сжатия, которые ломают проксирование
    if (!['host', 'content-length', 'connection'].includes(lower)) {
      headers[key] = value;
    }
  }

  const options = {
    method: req.method,
    headers: headers,
    duplex: 'half',
  };

  if (!['GET', 'HEAD'].includes(req.method) && bodyBuffer.length > 0) {
    options.body = bodyBuffer;
    headers['content-length'] = String(bodyBuffer.length);
  }

  try {
    const response = await fetch(targetUrl, options);
    const data = await response.arrayBuffer();

    response.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(lower)) {
        res.setHeader(key, val);
      }
    });

    res.status(response.status).send(Buffer.from(data));
  } catch (error) {
    res.status(502).json({ ok: false, description: error.message });
  }
}
