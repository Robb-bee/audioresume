export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
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
    const { email, filename, fileContent } = req.body;

    if (!email || !filename || !fileContent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Upload received:', filename, email);

    res.status(200).json({
      success: true,
      message: 'Upload received successfully'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}
