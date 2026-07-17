export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const transcript = body.transcript;

    if (!transcript) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('API Key present:', !!apiKey);
    console.log('Transcript length:', transcript.length);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: transcript }],
      }),
    });

    console.log('Claude response status:', response.status);
    
    const responseText = await response.text();
    console.log('Claude response text:', responseText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
      return res.status(response.status).json({ 
        error: 'Claude API returned invalid response',
        raw: responseText.substring(0, 500)
      });
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.log('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
