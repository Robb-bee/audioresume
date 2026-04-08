// Vercel Serverless - Stream audio directly to ElevenLabs

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Set CORS
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
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Collect the body manually (streaming)
    const chunks = [];
    for await (const chunk of req.body) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);
    
    console.log('Received audio file, size:', bodyBuffer.length, 'bytes');

    // Send to ElevenLabs API
    const formData = new FormData();
    formData.append('file', new Blob([bodyBuffer]), 'audio.m4a');
    formData.append('model', 'scribe_multilingual');
    formData.append('language', 'en');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs error:', response.status, errorText);
      return res.status(500).json({ error: 'Transcription failed' });
    }

    const result = await response.json();
    console.log('Transcription successful');

    res.status(200).json({
      success: true,
      transcript: result.text || result.content || 'Transcription complete'
    });

  } catch (error) {
    console.error('Transcription error:', error.message);
    res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
}
