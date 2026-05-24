const express = require('express');
const router = express.Router();
const db = require('../services/dynamodbService');
const { v4: uuidv4 } = require('uuid');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
    try {
        const filterExpression = 'productId = :pid';
        const expressionAttributeValues = { ':pid': req.params.productId };
        
        let reviews = await db.scan('Reviews', filterExpression, expressionAttributeValues);
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching reviews' });
    }
});

// POST /api/reviews
router.post('/', verifyFirebaseToken, async (req, res) => {
    try {
        const reviewData = {
            ...req.body,
            reviewId: uuidv4(),
            userId: req.user.uid,
            createdAt: new Date().toISOString()
        };
        await db.put('Reviews', reviewData);
        res.status(201).json(reviewData);
    } catch (error) {
        res.status(500).json({ error: 'Server error creating review' });
    }
});

module.exports = router;
