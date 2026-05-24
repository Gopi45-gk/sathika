const db = require('../services/dynamodbService');

const adminOnly = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: User not found in request' });
        }

        const user = await db.get('Users', { firebaseUid: req.user.uid });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found in database' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Error in admin middleware:', error);
        res.status(500).json({ error: 'Server error checking admin privileges' });
    }
};

module.exports = adminOnly;
