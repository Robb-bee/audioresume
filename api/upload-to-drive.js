export const config = { runtime: 'nodejs' };
// Simple upload to Drive
import { google } from 'googleapis';
import Busboy from 'busboy';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!serviceAccountJson || !folderId) {
    return res.status(500).json({ error: 'Missing config' });
  }

  const credentials = JSON.parse(serviceAccountJson);
  const busboy = Busboy({ headers: req.headers });

  const chunks = [];
  let filename = 'audio.m4a';
  let mimeType = 'audio/mpeg';
  let email = '';

  busboy.on('file', (field, file, name, enc, type) => {
    file.on('data', (chunk) => chunks.push(chunk));
    file.on('end', () => {
      filename = name;
      mimeType = type.mimeType || type;
    });
  });

  busboy.on('field', (field, val) => { if (field === 'email') email = val; });
  busboy.on('finish', async () => {
    try {
      const fileBuffer = Buffer.concat(chunks);
      const timestamp = Date.now();
      const ext = filename.split('.').pop();
      const finalName = email ? `${email}_${timestamp}.${ext}` : `audio_${timestamp}.${ext}`;

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.create({
        requestBody: { name: finalName, parents: [folderId] },
        media: { mimeType, body: fileBuffer },
        fields: 'id,name',
      });

      res.status(200).json({ success: true, fileId: response.data.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  req.pipe(busboy);
}