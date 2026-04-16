export const config = { runtime: 'nodejs' };
// POST /api/transcribe - Transcribe audio using OpenAI Whisper
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get the audio file from form data
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert to base64 for OpenAI API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'whisper-1',
        response_format: 'json'
      })
    });

    // Build multipart manually since we're in edge runtime
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const body = `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n` +
      `Content-Type: ${file.type || 'audio/mpeg'}\r\n\r\n` +
      buffer.toString('binary') +
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n` +
      `--${boundary}--\r\n`;

    const openAIResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: buffer
    });

    if (!openAIResponse.ok) {
      const err = await openAIResponse.text();
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
