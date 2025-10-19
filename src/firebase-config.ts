// Firebase configuration for Firestore
// For security, these should be environment variables in production
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key-here",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Instructions for setup:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing project
// 3. Enable Cloud Firestore (not Realtime Database)
// 4. Go to Project Settings > General > Your apps
// 5. Click "Add app" and select Web (</>)
// 6. Register your app and copy the config values
// 7. Replace the placeholder values above with your actual config
// 8. For production, use environment variables (.env file)
// Note: databaseURL is not needed for Firestore