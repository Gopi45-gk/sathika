// ============================================================
// Authentication Functions for VastraHeritage
// Requires firebase-config.js to be loaded first
// ============================================================

const API_BASE_URL_AUTH = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : 'https://sathika.onrender.com/api';

async function syncUserWithBackend(user) {
    try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL_AUTH}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error syncing user with backend:', error);
        return null;
    }
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<firebase.auth.UserCredential>}
 */
async function signInWithEmail(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const userData = await syncUserWithBackend(userCredential.user);
        return { userCredential, userData };
    } catch (error) {
        throw mapAuthError(error);
    }
}

/**
 * Sign in with Google popup
 * @returns {Promise<firebase.auth.UserCredential>}
 */
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        const userCredential = await auth.signInWithPopup(provider);

        // Backend will create/update user document upon GET /auth/me
        const userData = await syncUserWithBackend(userCredential.user);

        return { userCredential, userData };
    } catch (error) {
        throw mapAuthError(error);
    }
}

/**
 * Sign up with email, password, and display name
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<firebase.auth.UserCredential>}
 */
async function signUpWithEmail(email, password, displayName) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);

        // Update display name
        await userCredential.user.updateProfile({ displayName: displayName });

        // Sync with backend
        const userData = await syncUserWithBackend(userCredential.user);

        return { userCredential, userData };
    } catch (error) {
        throw mapAuthError(error);
    }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
async function signOut() {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        throw mapAuthError(error);
    }
}

/**
 * Map Firebase error codes to user-friendly messages
 * @param {Error} error
 * @returns {Error}
 */
function mapAuthError(error) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password must be at least 6 characters long.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
        'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled.',
        'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
        'auth/user-disabled': 'This account has been disabled. Contact support.'
    };

    const friendlyMessage = errorMessages[error.code] || error.message || 'An unexpected error occurred.';
    const mappedError = new Error(friendlyMessage);
    mappedError.code = error.code;
    return mappedError;
}
