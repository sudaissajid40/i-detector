export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the raw body stream into a buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const API_URL = "https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector";
    
    // Get token from headers, fallback to default
    const userToken = req.headers['x-hf-token'];
    const hfToken = userToken || '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';

    // Proxy the request to Hugging Face
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: buffer
    });

    if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
