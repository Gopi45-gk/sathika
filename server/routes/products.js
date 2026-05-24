const express = require('express');
const router = express.Router();
const db = require('../services/dynamodbService');
const { v4: uuidv4 } = require('uuid');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');
const adminOnly = require('../middleware/adminOnly');

// GET /api/products
router.get('/', async (req, res) => {
    try {
        let filterExpression = null;
        let expressionAttributeValues = null;
        let expressionAttributeNames = null;

        if (req.query.category) {
            filterExpression = '#cat = :category';
            expressionAttributeNames = { '#cat': 'category' };
            expressionAttributeValues = { ':category': req.query.category };
        }

        let products = await db.scan('Products', filterExpression, expressionAttributeValues, expressionAttributeNames);
        // Sort by createdAt descending since DynamoDB scan doesn't guarantee order
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching products' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await db.get('Products', { productId: req.params.id });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching product' });
    }
});

// POST /api/products (Admin Only)
router.post('/', verifyFirebaseToken, adminOnly, async (req, res) => {
    try {
        const newProduct = {
            ...req.body,
            productId: uuidv4(),
            createdAt: new Date().toISOString()
        };
        await db.put('Products', newProduct);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Server error creating product' });
    }
});

// PUT /api/products/:id (Admin Only)
router.put('/:id', verifyFirebaseToken, adminOnly, async (req, res) => {
    try {
        const existing = await db.get('Products', { productId: req.params.id });
        if (!existing) return res.status(404).json({ error: 'Product not found' });
        
        const updatedProduct = {
            ...existing,
            ...req.body,
            productId: req.params.id // Prevent overwriting ID
        };
        await db.put('Products', updatedProduct);
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating product' });
    }
});

// DELETE /api/products/:id (Admin Only)
router.delete('/:id', verifyFirebaseToken, adminOnly, async (req, res) => {
    try {
        await db.delete('Products', { productId: req.params.id });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting product' });
    }
});

module.exports = router;
