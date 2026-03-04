const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no Vercel' });

  if (req.method === 'GET') {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const d = await r.json();
    const names = d.models?.map(m => m.name) || d;
    return res.status(200).json({ models: names });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, max_tokens = 1000 } = req.body;
    const model = 'gemini-2.0-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: max_tokens, temperature: 0.8 }
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      return res.status(200).json({ error: errMsg, raw: data });
    }
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      return res.status(200).json({ error: `Gemini bloqueou o conteúdo: ${finishReason}`, raw: data });
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return res.status(200).json({ error: 'Resposta vazia. Verifique a GEMINI_API_KEY no Vercel.', raw: data });
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
};

module.exports = handler;
