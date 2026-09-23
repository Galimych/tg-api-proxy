import https from 'https';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  const cleanPath = req.url.replace(/^\/api\/index/, '').replace(/^\/api/, '');

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: cleanPath,
    method: req.method,
    headers: headers,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.status(502).json({ ok: false, description: err.message });
  });

  // Перенаправляем весь входящий поток байтов (включая фото и документы)
  req.pipe(proxyReq);
}
