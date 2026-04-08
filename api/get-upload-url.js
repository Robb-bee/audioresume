// Generate pre-signed URL for R2 upload
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return res.status(500).json({ error: 'R2 not configured' });
    }
    
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    
    const fileKey = `uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.m4a`;
    
    const signedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        ContentType: 'audio/m4a',
      }),
      { expiresIn: 300 }
    );
    
    const publicUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`;
    
    res.json({
      uploadUrl: signedUrl,
      fileKey: fileKey,
      publicUrl: publicUrl
    });
    
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}
