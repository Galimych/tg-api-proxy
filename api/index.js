export const config = {
  api: {
    bodyParser: false, // Отключаем автопарсер Vercel, чтобы проксировать чистые байты
  },
};

export default async function handler(req, res) {
  const cleanPath = req.url.replace(/^\/api\/index/, '').replace(/^\/api/, '');
  const targetUrl = `https://api.telegram.org${cleanPath}`;

  // Собираем тело запроса из потока
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const bodyBuffer = Buffer.concat(chunks);

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!['host', 'content-length'].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  }

  const options = {
    method: req.method,
    headers: headers,
    redirect: 'follow',
  };

  if (!['GET', 'HEAD'].includes(req.method) && bodyBuffer.length > 0) {
    options.body = bodyBuffer;
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
