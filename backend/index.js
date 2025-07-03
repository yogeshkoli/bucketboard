import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import archiver from 'archiver';
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
        storageClass: file.StorageClass,
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

// API Endpoint for bulk file deletion
app.delete('/api/files/bulk', async (req, res) => {
  const { keys } = req.body;

  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ error: 'An array of file keys is required.' });
  }

  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Delete: {
      Objects: keys.map(key => ({ Key: key })),
      Quiet: false,
    },
  };

  try {
    const command = new DeleteObjectsCommand(deleteParams);
    const data = await s3Client.send(command);

    if (data.Errors && data.Errors.length > 0) {
      console.error('Errors during bulk delete:', data.Errors);
      return res.status(500).json({ message: 'Some files could not be deleted.', errors: data.Errors });
    }
    res.status(200).json({ message: 'Files deleted successfully.' });
  } catch (err) {
    console.error('Error performing bulk delete:', err);
    res.status(500).json({ error: 'Failed to delete files', details: err.message });
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
  const { key, download } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'File key is required.' });
  }

  const fileName = key.split('/').pop();
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: download ? `attachment; filename="${fileName}"` : undefined,
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

// API Endpoint to download a folder as a zip archive
app.post('/api/download/folder', async (req, res) => {
  const { prefix } = req.body;
  if (!prefix) {
    return res.status(400).json({ error: 'Folder prefix is required.' });
  }

  const bucketName = process.env.AWS_BUCKET_NAME;
  const archive = archiver('zip', { zlib: { level: 9 } });

  const folderName = prefix.replace(/\/$/, '').split('/').pop() || 'archive';
  res.attachment(`${folderName}.zip`);
  archive.pipe(res);

  try {
    // Use a paginator for very large folders
    let continuationToken;
    do {
      const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix, ContinuationToken: continuationToken });
      const response = await s3Client.send(listCommand);

      if (response.Contents) {
        for (const item of response.Contents) {
          if (item.Size > 0) { // Don't add empty folder objects
            const getObjCmd = new GetObjectCommand({ Bucket: bucketName, Key: item.Key });
            const data = await s3Client.send(getObjCmd);
            const filePathInZip = item.Key.substring(prefix.length);
            archive.append(data.Body, { name: filePathInZip });
          }
        }
      }
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    await archive.finalize();

  } catch (err) {
    console.error('Error creating folder archive:', err);
    res.end(); // End the response abruptly on error
  }
});

// API Endpoint for Storage Analytics
app.get('/api/analytics', async (req, res) => {
  const bucketName = process.env.AWS_BUCKET_NAME;
  let continuationToken;
  let allObjects = [];

  try {
    // Paginate through all objects in the bucket
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      });
      const response = await s3Client.send(command);
      allObjects = allObjects.concat(response.Contents || []);
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // --- Calculations ---
    const totalFiles = allObjects.length;
    const totalSize = allObjects.reduce((acc, obj) => acc + obj.Size, 0);

    const topLargestFiles = allObjects
      .sort((a, b) => b.Size - a.Size)
      .slice(0, 10)
      .map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      }));

    const uploadTrend = allObjects.reduce((acc, obj) => {
      const month = obj.LastModified.toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const formattedUploadTrend = Object.entries(uploadTrend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const fileTypeDistribution = allObjects.reduce((acc, obj) => {
      const extension = obj.Key.split('.').pop()?.toLowerCase() || 'other';
      const imageExt = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
      const docExt = ['pdf', 'doc', 'docx', 'txt', 'md'];
      const videoExt = ['mp4', 'mov', 'avi', 'mkv'];
      const audioExt = ['mp3', 'wav'];
      const archiveExt = ['zip', 'rar', '7z'];
      const codeExt = ['js', 'jsx', 'ts', 'tsx', 'html', 'css'];

      let type = 'Other';
      if (imageExt.includes(extension)) type = 'Images';
      else if (docExt.includes(extension)) type = 'Documents';
      else if (videoExt.includes(extension)) type = 'Videos';
      else if (audioExt.includes(extension)) type = 'Audio';
      else if (archiveExt.includes(extension)) type = 'Archives';
      else if (codeExt.includes(extension)) type = 'Code';

      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const formattedFileTypeDistribution = Object.entries(fileTypeDistribution)
      .map(([name, value]) => ({ name, value }));

    res.json({
      totalFiles,
      totalSize,
      topLargestFiles,
      uploadTrend: formattedUploadTrend,
      fileTypeDistribution: formattedFileTypeDistribution,
    });
  } catch (err) {
    console.error('Error fetching analytics data:', err);
    res.status(500).json({ error: 'Failed to fetch analytics data', details: err.message });
  }
});

app.get('/api/files/metadata', async (req, res) => {
  const { key } = req.query;

  if (!key) {
    return res.status(400).json({ error: 'File key is required.' });
  }

  try {
    const command = new GetObjectTaggingCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });
    const response = await s3Client.send(command);
    res.json(response.TagSet);
  } catch (err) {
    if (err.name === 'NoSuchKey') {
      return res.json([]); // No tags yet, return empty array
    }
    console.error('Error fetching tags:', err);
    res.status(500).json({ error: 'Failed to fetch file metadata', details: err.message });
  }
});

// API Endpoint to update file metadata (tags)
app.post('/api/files/metadata', async (req, res) => {
  const { key, tags } = req.body;

  if (!key || !tags) {
    return res.status(400).json({ error: 'File key and tags are required.' });
  }

  try {
    const command = new PutObjectTaggingCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Tagging: {
        TagSet: tags,
      },
    });
    await s3Client.send(command);
    res.status(200).json({ message: 'Metadata updated successfully.' });
  } catch (err) {
    console.error('Error updating tags:', err);
    res.status(500).json({ error: 'Failed to update file metadata', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});