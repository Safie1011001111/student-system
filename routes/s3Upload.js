const express = require('express');
const AWS = require('aws-sdk');
const router = express.Router();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

router.get('/presigned-url', async (req, res) => {
  const { filename, filetype } = req.query;
  if (!filename || !filetype) return res.status(400).json({ error: 'Missing filename or filetype' });

  const params = {
    Bucket: 'student-activities-bucket',
    Key: filename,
    ContentType: filetype,
    Expires: 60
  };

  try {
    const url = await s3.getSignedUrlPromise('putObject', params);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
