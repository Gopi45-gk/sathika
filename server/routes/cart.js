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

// PUT /api/cart/:id (Update quantity)
router.put('/:id', verifyFirebaseToken, async (req, res) => {
    try {
        const cartId = req.params.id;
        // Fetch existing
        const existing = await db.scan('Cart', 'cartId = :cid AND userId = :uid', { ':cid': cartId, ':uid': req.user.uid });
        if (!existing || existing.length === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }
        
        const itemData = existing[0];
        itemData.quantity = req.body.quantity;
        await db.put('Cart', itemData);
        res.json(itemData);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating cart' });
    }
});

module.exports = router;
