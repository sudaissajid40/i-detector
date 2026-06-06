import https from 'https';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userToken = req.headers['x-hf-token'];
  const hfToken = userToken || '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';

  try {
    // 1. Manually resolve Hugging Face's IP address using Cloudflare DNS to bypass Vercel's DNS bug!
    const dnsResp = await fetch('https://cloudflare-dns.com/dns-query?name=api-inference.huggingface.co&type=A', {
      headers: { accept: 'application/dns-json' }
    });
    const dnsData = await dnsResp.json();
    
    if (!dnsData.Answer || dnsData.Answer.length === 0) {
      throw new Error("Cloudflare could not resolve HuggingFace IP");
    }
    
    const huggingFaceIp = dnsData.Answer[0].data;

    // 2. Connect directly to the IP address!
    const options = {
      hostname: huggingFaceIp,
      servername: 'api-inference.huggingface.co', // Required for SSL
      port: 443,
      path: '/models/umm-maybe/AI-image-detector',
      method: 'POST',
      headers: {
        'Host': 'api-inference.huggingface.co',
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/octet-stream',
      }
    };

    if (req.headers['content-length']) {
        options.headers['Content-Length'] = req.headers['content-length'];
    }

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
      res.status(500).json({ error: `HTTPS connection error: ${error.message}` });
    });

    // Send the image data
    req.pipe(proxyReq);

  } catch (error) {
    res.status(500).json({ error: `DNS/Setup error: ${error.message}` });
  }
}
