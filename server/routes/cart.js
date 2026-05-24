const express = require('express');
const router = express.Router();
const db = require('../services/dynamodbService');
const { v4: uuidv4 } = require('uuid');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// GET /api/cart
router.get('/', verifyFirebaseToken, async (req, res) => {
    try {
        const filterExpression = 'userId = :uid';
        const expressionAttributeValues = { ':uid': req.user.uid };
        
        let cart = await db.scan('Cart', filterExpression, expressionAttributeValues);
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching cart' });
    }
});

// POST /api/cart
router.post('/', verifyFirebaseToken, async (req, res) => {
    try {
        const itemData = {
            cartId: uuidv4(),
            userId: req.user.uid,
            productId: req.body.productId,
            quantity: req.body.quantity || 1,
            createdAt: new Date().toISOString()
        };
        await db.put('Cart', itemData);
        res.status(201).json(itemData);
    } catch (error) {
        res.status(500).json({ error: 'Server error adding to cart' });
    }
});

// DELETE /api/cart/:id
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
    try {
        await db.delete('Cart', { cartId: req.params.id });
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting from cart' });
    }
});

module.exports = router;
