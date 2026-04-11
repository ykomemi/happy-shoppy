export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API key exists:', !!process.env.OPENAI_API_KEY);
    console.log('Request body keys:', Object.keys(req.body || {}));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${req.body.mediaType};base64,${req.body.imageData}` } },
            { type: 'text', text: req.body.prompt }
          ]
        }]
      }),
    });

    const data = await response.json();
    console.log('OpenAI status:', response.status);
    if (!response.ok) console.error('OpenAI error:', JSON.stringify(data));
    res.status(response.status).json(data);

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
