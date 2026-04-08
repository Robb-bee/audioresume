// Upload audio file to Google Drive using service account

import { google } from 'googleapis';

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
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const { email } = req.body || {};

    if (!serviceAccountJson) {
      return res.status(500).json({ error: 'Server configuration error - missing service account' });
    }

    if (!folderId) {
      return res.status(500).json({ error: 'Server configuration error - missing folder ID' });
    }

    // Parse service account credentials
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid service account JSON' });
    }

    // Get the file from form
    const file = req.body.file;
    
    if (!file || !file.data) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Generate filename: email_timestamp.ext
    const timestamp = Date.now();
    const ext = file.mimetype.includes('m4a') ? 'm4a' : 
                file.mimetype.includes('mp3') ? 'mp3' : 
                file.mimetype.includes('webm') ? 'webm' : 'audio';
    const filename = email ? `${email}_${timestamp}.${ext}` : `audio_${timestamp}.${ext}`;

    // Upload to Drive
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: Buffer.from(file.data, 'base64'),
      },
      fields: 'id, name',
    });

    console.log('File uploaded:', response.data.id, response.data.name);

    res.status(200).json({
      success: true,
      fileId: response.data.id,
      filename: response.data.name,
    });

  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
}
