export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log exactly what we receive
    console.log('Raw body type:', typeof req.body);
    console.log('Raw body:', JSON.stringify(req.body));
    
    // Handle both string and object body
    let transcript;
    if (typeof req.body === 'string') {
      const parsed = JSON.parse(req.body);
      transcript = parsed.transcript;
    } else {
      transcript = req.body.transcript;
    }

    console.log('Extracted transcript length:', transcript?.length);

    if (!transcript || transcript.trim().length === 0) {
      console.log('Transcript is empty or missing');
      return res.status(400).json({ error: 'Transcript is empty' });
    }

    const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key missing' });
    }

    console.log('Calling Claude API with transcript length:', transcript.length);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        messages: [{ role: 'user', content: transcript }],
      }),
    });

    const data = await claudeResponse.json();

    if (!claudeResponse.ok) {
      console.log('Claude error:', data);
      return res.status(claudeResponse.status).json(data);
    }

    console.log('Claude success, returning data');
    return res.status(200).json(data);
  } catch (error) {
    console.log('Catch error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
