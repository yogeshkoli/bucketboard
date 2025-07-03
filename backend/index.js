import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

// API Endpoint to list files from the S3 bucket
app.get('/api/files', async (req, res) => {
  const prefix = req.query.prefix || '';

  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: prefix,
    Delimiter: '/', // This is the key to separating files and folders
  });

  try {
    const data = await s3Client.send(command);

    // Folders are returned in CommonPrefixes
    const folders = (data.CommonPrefixes || []).map(p => ({
      name: p.Prefix.replace(prefix, '').replace(/\/$/, ''),
      prefix: p.Prefix,
    }));

    // Files are returned in Contents
    const files = (data.Contents || [])
      .filter(file => file.Key !== prefix) // Exclude the folder itself
      .map(file => ({
        key: file.Key,
        name: file.Key.replace(prefix, ''),
        lastModified: file.LastModified,
        size: file.Size,
      }));

    res.json({ folders, files });
  } catch (err) {
    console.error('Error listing S3 objects:', err);
    res.status(500).json({ error: 'Failed to list S3 objects', details: err.message });
  }
});

// API Endpoint to generate a pre-signed URL for uploading a file
app.post('/api/upload/presigned-url', async (req, res) => {
  const { fileName, fileType, prefix } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'fileName and fileType are required in the request body.' });
  }

  // Create the full S3 key, including the folder path (prefix)
  const key = prefix ? `${prefix}${fileName}` : fileName;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // URL is valid for 5 minutes
    res.json({ url: signedUrl, key: key });
  } catch (err) {
    console.error('Error creating pre-signed URL:', err);
    res.status(500).json({ error: 'Failed to create pre-signed URL', details: err.message });
  }
});

// API Endpoint to create a new folder (empty object with a trailing slash)
app.post('/api/folders', async (req, res) => {
  const { folderName, prefix } = req.body;

  if (!folderName) {
    return res.status(400).json({ error: 'folderName is required.' });
  }
  if (folderName.includes('/')) {
      return res.status(400).json({ error: 'Folder name cannot contain slashes.' });
  }

  const key = prefix ? `${prefix}${folderName}/` : `${folderName}/`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: '', // Folders are just empty objects with a trailing slash
  });

  try {
    await s3Client.send(command);
    res.status(201).json({ message: 'Folder created successfully.', key });
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ error: 'Failed to create folder', details: err.message });
  }
});

// API Endpoint to delete a file
app.delete('/api/files', async (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'File key is required.' });
  }

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  try {
    await s3Client.send(command);
    res.status(200).json({ message: 'File deleted successfully.' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Failed to delete file', details: err.message });
  }
});

// API Endpoint to rename a file or folder
app.post('/api/rename', async (req, res) => {
    const { oldKey, newKey, isFolder } = req.body;

    if (!oldKey || !newKey) {
        return res.status(400).json({ error: 'oldKey and newKey are required.' });
    }

    const bucketName = process.env.AWS_BUCKET_NAME;

    try {
        if (!isFolder) {
            // Rename a single file
            const copyCommand = new CopyObjectCommand({
                Bucket: bucketName,
                CopySource: `${bucketName}/${encodeURIComponent(oldKey)}`,
                Key: newKey,
            });
            await s3Client.send(copyCommand);

            const deleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: oldKey,
            });
            await s3Client.send(deleteCommand);

            res.status(200).json({ message: 'File renamed successfully.' });
        } else {
            // Rename a folder (move all objects under the prefix)
            const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: oldKey });
            const listedObjects = await s3Client.send(listCommand);

            if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
                return res.status(404).json({ error: 'Folder not found or is empty.' });
            }

            const copyPromises = listedObjects.Contents.map(item => {
                const destinationKey = item.Key.replace(oldKey, newKey);
                const copyCommand = new CopyObjectCommand({
                    Bucket: bucketName,
                    CopySource: `${bucketName}/${encodeURIComponent(item.Key)}`,
                    Key: destinationKey,
                });
                return s3Client.send(copyCommand);
            });

            await Promise.all(copyPromises);

            const deleteParams = {
                Bucket: bucketName,
                Delete: {
                    Objects: listedObjects.Contents.map(item => ({ Key: item.Key })),
                },
            };
            const deleteCommand = new DeleteObjectsCommand(deleteParams);
            await s3Client.send(deleteCommand);

            res.status(200).json({ message: 'Folder renamed successfully.' });
        }
    } catch (err) {
        console.error('Error renaming item:', err);
        res.status(500).json({ error: 'Failed to rename item', details: err.message });
    }
});

// API Endpoint to generate a pre-signed URL for viewing/downloading a file
app.post('/api/files/presigned-url', async (req, res) => {
    const { key } = req.body;

    if (!key) {
        return res.status(400).json({ error: 'File key is required.' });
    }

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });

    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // URL is valid for 5 minutes
        res.json({ url: signedUrl });
    } catch (err) {
        console.error('Error creating pre-signed GET URL:', err);
        res.status(500).json({ error: 'Failed to create pre-signed URL', details: err.message });
    }
});

// API Endpoint to generate a pre-signed URL for sharing
app.post('/api/share/presigned-url', async (req, res) => {
    const { key, expiresIn } = req.body; // expiresIn in seconds

    if (!key || !expiresIn) {
        return res.status(400).json({ error: 'File key and expiresIn are required.' });
    }

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });

    try {
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: parseInt(expiresIn, 10) });
        res.json({ url: signedUrl });
    } catch (err) {
        console.error('Error creating pre-signed SHARE URL:', err);
        res.status(500).json({ error: 'Failed to create pre-signed URL', details: err.message });
    }
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});