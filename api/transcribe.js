// Vercel Serverless - Stream audio directly to ElevenLabs

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      console.log('Missing API key - env vars:', Object.keys(process.env).filter(k => k.includes('ELEVEN')));
      return res.status(500).json({ error: 'Server configuration error - missing API key' });
    }

    // Read the file from FormData - handle both stream and buffer
    let fileBuffer;
    
    if (req.body && typeof req.body.on === 'function') {
      // It's a stream - collect all chunks
      const chunks = [];
      for await (const chunk of req.body) {
        chunks.push(chunk);
      }
      fileBuffer = Buffer.concat(chunks);
    } else if (req.body) {
      // Already parsed buffer
      fileBuffer = Buffer.from(req.body);
    } else {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File size:', fileBuffer.length);
    
    if (fileBuffer.length === 0) {
      return res.status(400).json({ error: 'Empty file' });
    }

    // Create FormData for ElevenLabs
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'audio/m4a' });
    formData.append('file', blob, 'audio.m4a');
    formData.append('model', 'scribe_multilingual');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('ElevenLabs error:', response.status, responseText);
      return res.status(500).json({ error: 'Transcription service unavailable' });
    }

    const result = JSON.parse(responseText);
    
    res.status(200).json({
      success: true,
      transcript: result.text || result.content || 'Transcription complete'
    });

  } catch (error) {
    console.error('Transcription error:', error.message);
    res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
}
