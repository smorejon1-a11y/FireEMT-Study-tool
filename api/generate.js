export default async function handler(req, res) {
  console.log('API called with method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log('Request body:', body);
    
    const transcript = body.transcript;
    
    if (!transcript) {
      console.log('No transcript in body');
      return res.status(400).json({ error: 'No transcript provided' });
    }

    const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    console.log('API Key exists:', !!apiKey);
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Calling Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: transcript,
          },
        ],
      }),
    });

    console.log('Claude response status:', response.status);
    
    const data = await response.json();
    console.log('Claude response:', data);

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Claude API error' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
