const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY não configurada no Vercel' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, max_tokens = 1000 } = req.body;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens,
        temperature: 0.8
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      return res.status(200).json({ error: errMsg });
    }
    const text = data.choices?.[0]?.message?.content || '';
    if (!text) return res.status(200).json({ error: 'Resposta vazia do Groq.' });
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
};

module.exports = handler;
