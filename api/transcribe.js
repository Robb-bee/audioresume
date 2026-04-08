// Fetch audio from R2, send to ElevenLabs
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
    // Parse JSON body
    const { fileUrl, email } = req.body || {};
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    console.log('Received request:', { fileUrl, email });
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (!fileUrl) {
      return res.status(400).json({ error: 'Missing file URL' });
    }

    console.log('Fetching file from:', fileUrl);
    
    // Fetch the file from R2
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    console.log('File downloaded, size:', fileBuffer.length, 'bytes');
    
    // Send to ElevenLabs
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'audio/m4a' });
    formData.append('file', blob, 'audio.m4a');
    formData.append('model', 'scribe_multilingual');

    console.log('Sending to ElevenLabs...');
    
    const elevenResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: formData,
    });

    if (!elevenResponse.ok) {
      const errorText = await elevenResponse.text();
      console.error('ElevenLabs error:', errorText);
      return res.status(500).json({ error: 'Transcription failed' });
    }

    const result = await elevenResponse.json();
    
    console.log('Transcription complete');
    
    res.status(200).json({
      success: true,
      transcript: result.text || 'Transcription complete'
    });

  } catch (error) {
    console.error('Transcription error:', error.message);
    res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
}
