const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');
const db = require('../services/dynamodbService');

// GET /api/auth/me
// Returns the user's DynamoDB profile. Creates it if it doesn't exist.
router.get('/me', verifyFirebaseToken, async (req, res) => {
    try {
        let user = await db.get('Users', { firebaseUid: req.user.uid });
        
        if (!user) {
            user = {
                firebaseUid: req.user.uid,
                email: req.user.email,
                displayName: req.user.name || '',
                phone: '',
                role: req.user.email === '7904223010@sadhika.com' ? 'admin' : 'customer',
                createdAt: new Date().toISOString()
            };
            await db.put('Users', user);
        } else {
            if (req.user.email === '7904223010@sadhika.com' && user.role !== 'admin') {
                user.role = 'admin';
                await db.put('Users', user);
            }
        }
        
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching user profile' });
    }
});

module.exports = router;
