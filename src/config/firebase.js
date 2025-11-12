let _db = null;

export function init() {
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDOGYdoAzMk94ZtCAK4H5xvw-AvFsiUxLE",
    authDomain: "chat-first-commerce.firebaseapp.com",
    projectId: "chat-first-commerce",
    storageBucket: "chat-first-commerce.appspot.com",
    messagingSenderId: "768300051855",
    appId: "1:768300051855:web:093daa38702a8fd44b2ffa"
  };

  try {
    const app = firebase.initializeApp(firebaseConfig);
    _db = firebase.firestore();
  } catch (e) {
    console.error("Error initializing Firebase:", e);
    const root = document.body;
    if (root) root.innerHTML = '<div class="p-6 text-red-700">Error initializing Firebase. Check console.</div>';
  }
}

export function getDb() {
  return _db;
}

export function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

export function arrayUnion(val) {
  return firebase.firestore.FieldValue.arrayUnion(val);
}
