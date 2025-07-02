const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

app.get('/api/files', async (req, res) => {
  try {
    const data = await s3.listObjectsV2({ Bucket: process.env.AWS_BUCKET_NAME }).promise();
    res.json(data.Contents);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.listen(5002, () => {
  console.log('Backend API running on http://localhost:5002');
});
