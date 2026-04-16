// POST /api/transcribe - Transcribe audio using OpenAI Whisper
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

    // Get JSON body
    let body = '';
    for await (const chunk of req.body) {
      body += chunk;
    }
    const parsed = JSON.parse(body);
    const { audio, filename } = parsed;
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(audio, 'base64');
    
    // Create multipart form data manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    const fileName = filename || 'audio.m4a';
    const contentType = fileName.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';
    
    const formBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`),
      Buffer.from(`Content-Type: ${contentType}\r\n\r\n`),
      buffer,
      Buffer.from(`\r\n--${boundary}\r\n`),
      Buffer.from('Content-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n'),
      Buffer.from(`--${boundary}--\r\n`)
    ]);

    const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: formBody
    });

    if (!openAIResponse.ok) {
      const err = await openAIResponse.text();
      console.error('OpenAI error:', err);
      throw new Error('Transcription failed: ' + err);
    }

    const result = await openAIResponse.json();
    
    res.json({ 
      text: result.text,
      success: true
    });

  } catch (error) {
    console.error('Transcribe error:', error.message);
    res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
}