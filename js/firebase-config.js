// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDx66QuLx1oBjIlodKSepXsn3aFC09wQ6g",
  authDomain: "sathika-906ea.firebaseapp.com",
  projectId: "sathika-906ea",
  storageBucket: "sathika-906ea.firebasestorage.app",
  messagingSenderId: "843228650628",
  appId: "1:843228650628:web:071923241c66aaa0f876d1"
};

// Initialize Firebase
let auth;
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
}
