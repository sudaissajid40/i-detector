export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Protects the API
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const API_URL = "https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector";
    const userToken = req.headers['x-hf-token'];
    const hfToken = userToken || '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';

    // Send the perfectly compressed image straight to Hugging Face
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: req.body
    });

    if (!response.ok) {
        let errText = await response.text();
        try {
            const json = JSON.parse(errText);
            errText = json.error || errText;
        } catch(e) {}
        
        return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server Error' });
  }
}
