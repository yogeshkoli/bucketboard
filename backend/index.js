import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// --- Environment Variable Setup ---
// Because the .env file is in the root folder, one level above /backend,
// we need to specify the path.
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// --- AWS S3 Client Configuration ---
// Check if required AWS environment variables are set.
// This provides a clearer error message if the .env file is not found.
const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_BUCKET_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL ERROR: Missing required environment variable: ${envVar}. Please check your .env file.`);
    process.exit(1); // Exit if configuration is missing
  }
}

// --- AWS S3 Client ---
// Ensure your .env file at the root has AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// --- Express App Setup ---
const app = express();
const port = process.env.PORT || 5002;
 
// --- Middleware ---
app.use(cors({ origin: 'http://localhost:3002' })); // Allow frontend to connect
app.use(express.json());

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('Hello from BucketBoard Backend!');
});

app.get('/api/files', async (req, res) => {
  const prefix = req.query.prefix || ''; // Allow browsing into "folders"

  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: prefix,
    Delimiter: '/', // This is key to treating the bucket like a filesystem
  });

  try {
    const { Contents, CommonPrefixes } = await s3Client.send(command);
    
    // Folders are in CommonPrefixes
    const folders = CommonPrefixes?.map(p => ({
        name: p.Prefix.replace(prefix, '').replace('/', ''),
        type: 'folder',
        prefix: p.Prefix,
    })) || [];

    // Files are in Contents
    const files = Contents?.filter(obj => obj.Key !== prefix) // Don't show the folder itself as a file
      .map(obj => ({
        name: obj.Key.replace(prefix, ''),
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        type: 'file',
      })) || [];

    res.json({ folders, files });
  } catch (err) {
    console.error('Error listing S3 objects:', err);
    if (err.name === 'NoSuchBucket') {
        return res.status(404).json({ message: `Bucket not found: ${process.env.AWS_BUCKET_NAME}` });
    }
    res.status(500).json({ message: 'Failed to list bucket contents. Check backend logs and AWS credentials.' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
