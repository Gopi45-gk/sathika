const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');
const adminOnly = require('../middleware/adminOnly');
const path = require('path');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /api/upload
router.post('/', verifyFirebaseToken, adminOnly, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const bucketName = process.env.AWS_BUCKET_NAME;
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `products/${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;

        const params = {
            Bucket: bucketName,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
            // Note: ACL 'public-read' is often disabled by default in modern S3 buckets.
            // Ensure your bucket policy allows public read access if you don't use ACLs.
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        const region = process.env.AWS_REGION || 'ap-southeast-2';
        const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error('Error uploading to S3:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

module.exports = router;
