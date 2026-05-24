const express = require('express');
const router = express.Router();
const db = require('../services/dynamodbService');
const { v4: uuidv4 } = require('uuid');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// GET /api/wishlist
router.get('/', verifyFirebaseToken, async (req, res) => {
    try {
        const filterExpression = 'userId = :uid';
        const expressionAttributeValues = { ':uid': req.user.uid };
        
        let wishlist = await db.scan('Wishlist', filterExpression, expressionAttributeValues);
        res.json(wishlist);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching wishlist' });
    }
});

// POST /api/wishlist
router.post('/', verifyFirebaseToken, async (req, res) => {
    try {
        const itemData = {
            wishlistId: uuidv4(),
            userId: req.user.uid,
            productId: req.body.productId,
            createdAt: new Date().toISOString()
        };
        await db.put('Wishlist', itemData);
        res.status(201).json(itemData);
    } catch (error) {
        res.status(500).json({ error: 'Server error adding to wishlist' });
    }
});

// DELETE /api/wishlist/:id
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
    try {
        await db.delete('Wishlist', { wishlistId: req.params.id });
        res.json({ message: 'Item removed from wishlist' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting from wishlist' });
    }
});

module.exports = router;
