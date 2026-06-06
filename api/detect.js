import https from 'https';

export const config = {
  api: {
    bodyParser: false, // We stream it manually for maximum safety
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userToken = req.headers['x-hf-token'];
  const hfToken = userToken || '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';

  const options = {
    hostname: 'api-inference.huggingface.co',
    port: 443,
    path: '/models/umm-maybe/AI-image-detector',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfToken}`,
      'Content-Type': 'application/octet-stream',
    }
  };

  // Keep the same file size so Hugging Face knows when it finishes
  if (req.headers['content-length']) {
      options.headers['Content-Length'] = req.headers['content-length'];
  }

  // Create a raw HTTPS connection (bypassing the buggy fetch)
  const proxyReq = https.request(options, (proxyRes) => {
    let responseBody = '';
    
    proxyRes.on('data', (chunk) => {
      responseBody += chunk;
    });

    proxyRes.on('end', () => {
      if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
        try {
          res.status(200).json(JSON.parse(responseBody));
        } catch (e) {
          res.status(200).send(responseBody);
        }
      } else {
        try {
          const json = JSON.parse(responseBody);
          res.status(proxyRes.statusCode).json({ error: json.error || responseBody });
        } catch (e) {
          res.status(proxyRes.statusCode).json({ error: responseBody });
        }
      }
    });
  });

  proxyReq.on('error', (error) => {
    // If it STILL fails, it will tell us EXACTLY why (e.g. timeout, DNS block, etc.)
    res.status(500).json({ error: `HTTPS error: ${error.message}` });
  });

  // Pipe the compressed image stream directly to Hugging Face
  req.pipe(proxyReq);
}
