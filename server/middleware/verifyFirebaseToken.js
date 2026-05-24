const admin = require('../config/firebaseAdmin');

const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!admin.apps.length) {
            // If Firebase Admin isn't fully initialized (e.g., local dev without keys), 
            // you might want to mock the user or return an error.
            return res.status(500).json({ error: 'Server configuration error: Firebase Admin not initialized' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken; // contains uid, email, etc.
        next();
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = verifyFirebaseToken;
