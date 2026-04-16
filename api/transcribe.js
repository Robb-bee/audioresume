// POST /api/transcribe - Simple test endpoint
export const config = { runtime: "nodejs@18.0.0" };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Just return success - don't parse any body
  res.json({ 
    text: 'API is working, runtime is Node.js 18!',
    success: true
  });
}
