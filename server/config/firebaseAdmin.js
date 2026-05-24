const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

if (
    process.env.FIREBASE_PROJECT_ID && 
    process.env.FIREBASE_PROJECT_ID !== 'YOUR_PROJECT_ID' &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
    console.log("Firebase Admin initialized");
} else {
    console.warn("Firebase credentials missing or using placeholders. Firebase Admin not initialized.");
}

module.exports = admin;
