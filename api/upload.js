// Vercel Serverless Function - Audio Upload

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, filename, fileContent, fileType } = req.body;

    if (!email || !filename || !fileContent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Received upload:', filename, email);

    // For now, log the upload - Drive connection requires env vars
    // To enable Drive, add GOOGLE_CREDENTIALS and GOOGLE_DRIVE_FOLDER_ID in Vercel
    
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
