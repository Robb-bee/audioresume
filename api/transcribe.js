// POST /api/transcribe - Simple test endpoint
export const config = { runtime: 'nodejs18.x' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    // Read body manually
    const chunks = [];
    for await (const chunk of req.body) {
      chunks.push(chunk);
    }
    const bodyStr = Buffer.concat(chunks).toString('utf-8');
    
    let audio = null;
    let filename = 'audio.m4a';
    
    try {
      const parsed = JSON.parse(bodyStr);
      audio = parsed.audio;
      filename = parsed.filename || filename;
    } catch (e) {
      // Not JSON, might be form data
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(audio, 'base64');
    console.log('Audio buffer size:', buffer.length);
    
    // Return success for testing
    res.json({ 
      text: 'Transcription would happen here - audio received: ' + buffer.length + ' bytes',
      success: true
    });

  } catch (error) {
    console.error('Transcribe error:', error.message);
    res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
}
