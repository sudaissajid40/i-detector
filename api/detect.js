export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const API_URL = "https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector";
    const userToken = req.headers.get('x-hf-token');
    const hfToken = userToken || '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';

    // FIX: Read the image into a buffer first instead of streaming it directly
    // This gives Hugging Face the exact file size and prevents the "internal error"
    const buffer = await req.arrayBuffer();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: buffer 
    });

    if (!response.ok) {
        let errText = await response.text();
        try {
            const json = JSON.parse(errText);
            errText = json.error || errText;
        } catch(e) {}
        
        return new Response(JSON.stringify({ error: errText }), { 
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Server Error' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
