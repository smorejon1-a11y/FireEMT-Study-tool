export default async function handler(req, res) {
  console.log('=== API CALLED ===');
  console.log('Method:', req.method);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Body:', JSON.stringify(req.body));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const transcript = body.transcript;

  console.log('Transcript exists:', !!transcript);
  console.log('Transcript length:', transcript?.length || 0);

  if (!transcript) {
    return res.status(400).json({ error: 'No transcript in request body', received: body });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: transcript }],
      }),
    });

    const data = await response.json();
    console.log('Claude status:', response.status);

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.log('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
