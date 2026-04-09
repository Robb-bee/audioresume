// Upload audio file to Google Drive using service account
// Uses formidable for multipart parsing (works better with Vercel)

import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

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
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

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

    // Parse multipart form data with formidable
    const parseForm = promisify(formidable({ 
      multiples: true,
      maxFileSize: 10 * 1024 * 1024,
    }).parse);

    const { fields, files } = await parseForm(req);
    
    const file = files.file;
    const email = fields.email ? fields.email[0] : '';
    
    if (!file || !file[0]) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFile = file[0];
    const filePath = uploadedFile.filepath;
    const fileMimeType = uploadedFile.mimetype || 'audio/mpeg';

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Generate filename: email_timestamp.ext
    const timestamp = Date.now();
    const ext = path.extname(uploadedFile.originalFilename || 'audio').slice(1) || 'audio';
    const filename = email ? `${email}_${timestamp}.${ext}` : `audio_${timestamp}.${ext}`;

    // Read file and upload to Drive
    const fileContent = fs.createReadStream(filePath);

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType: fileMimeType,
        body: fileContent,
      },
      fields: 'id, name',
    });

    console.log('File uploaded:', response.data.id, response.data.name);

    // Clean up temp file
    fs.unlinkSync(filePath);

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