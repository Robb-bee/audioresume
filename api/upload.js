// Vercel Serverless Function - Audio Upload

export default async function handler(req, res) {
  // Add CORS headers
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
    const { email, filename, fileContent, fileType } = req.body;

    if (!email || !filename || !fileContent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Received upload:', filename, email);

    res.status(200).json({
      success: true,
      message: 'Upload received',
      filename: filename
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}
