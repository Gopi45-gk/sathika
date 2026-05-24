const express = require('express');
const router = express.Router();
const db = require('../services/dynamodbService');
const { v4: uuidv4 } = require('uuid');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

// GET /api/orders (User gets their own orders)
router.get('/', verifyFirebaseToken, async (req, res) => {
    try {
        // Need secondary index on userId to query efficiently, 
        // but for now we can scan and filter, or assume global secondary index exists.
        // Doing a scan with filter for simplicity.
        const filterExpression = 'userId = :uid';
        const expressionAttributeValues = { ':uid': req.user.uid };
        
        let orders = await db.scan('Orders', filterExpression, expressionAttributeValues);
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching orders' });
    }
});

// GET /api/orders/:id
router.get('/:id', verifyFirebaseToken, async (req, res) => {
    try {
        const order = await db.get('Orders', { orderId: req.params.id });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        // Only allow user to see their own order, unless admin
        if (order.userId !== req.user.uid) {
            const user = await db.get('Users', { firebaseUid: req.user.uid });
            if (!user || user.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching order' });
    }
});

// POST /api/orders
router.post('/', verifyFirebaseToken, async (req, res) => {
    try {
        const orderData = {
            ...req.body,
            orderId: uuidv4(),
            userId: req.user.uid,
            orderStatus: 'pending',
            createdAt: new Date().toISOString()
        };
        await db.put('Orders', orderData);
        res.status(201).json(orderData);
    } catch (error) {
        res.status(500).json({ error: 'Server error creating order' });
    }
});

module.exports = router;
