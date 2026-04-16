// POST /api/transcribe - Simple test endpoint
export const config = { runtime: 'nodejs@18' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Simple test response
    res.json({ 
      text: 'Test transcription successful - API is working!',
      success: true
    });

  } catch (error) {
    console.error('Transcribe error:', error.message);
    res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
}
