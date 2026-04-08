// Vercel Serverless Function - Audio Upload
// Receives audio files and saves to Google Drive

const { google } = require('googleapis');
const stream = require('stream');

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, filename, fileContent, fileType } = req.body;

    if (!email || !filename || !fileContent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Decode base64 file
    const buffer = Buffer.from(fileContent, 'base64');

    // Initialize Google Drive (you'll need to add credentials)
    const drive = await getGoogleDriveClient();

    if (drive) {
      // Upload to Google Drive
      const fileMetadata = {
        name: `${Date.now()}_${filename}`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || '1acY9mrLPRcsQr8bnvC8AfEHbMg7JuG8J'],
      };

      const media = {
        mimeType: fileType || 'audio/m4a',
        body: stream.from(buffer),
      };

      const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name',
      });

      console.log('File uploaded:', response.data.name);

      return res.status(200).json({
        success: true,
        fileId: response.data.id,
        filename: response.data.name,
      });
    } else {
      // If no Drive credentials, just log and return success for testing
      console.log('File received (no Drive connected):', filename, email);
      return res.status(200).json({
        success: true,
        message: 'File received. Upload to Drive pending setup.',
        filename,
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}

async function getGoogleDriveClient() {
  const credentials = process.env.GOOGLE_CREDENTIALS;

  if (!credentials) {
    console.log('No Google credentials configured');
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth(
      {
        credentials: JSON.parse(credentials),
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      }
    );

    const drive = google.drive({ version: 'v3', auth });
    return drive;
  } catch (error) {
    console.error('Google Drive auth error:', error.message);
    return null;
  }
}