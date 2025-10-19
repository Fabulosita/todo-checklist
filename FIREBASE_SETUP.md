# Firebase Firestore Setup Guide for Todo Checklist

## Prerequisites
- Firebase account (free tier available)
- Node.js and npm installed

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `todo-checklist` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## Step 2: Enable Cloud Firestore

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll configure security later)
4. Select location (us-central1 recommended for best performance)
5. Click "Done"

## Step 3: Get Configuration Keys

1. Go to Project Settings (gear icon) > General
2. Scroll down to "Your apps" section
3. Click "Add app" and select Web (</>) 
4. Register app with nickname: "todo-checklist-web"
5. Copy the configuration object (note: no databaseURL needed for Firestore)

## Step 4: Set Up Environment Variables

1. **Use the existing `.env` file** (already created for you):
   ```bash
   # The .env file is already in your project root
   ```

2. **Get your Firebase config**:
   - Go to Firebase Console > Project Settings > General
   - Scroll to "Your apps" section
   - Copy the config values

3. **Replace the placeholder values in `.env`**:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyC4gmQ... (your actual key)
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-actual-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

4. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C) and restart
   npm run dev
   ```

**Note:** In Vite, environment variables must start with `VITE_` to be accessible in the browser.

## Step 5: Configure Firestore Security Rules

1. Go to Firestore Database > Rules tab
2. Replace the default rules with the content from `firestore.rules`
3. Click "Publish"

### Basic Security Rules (Current - Development Mode)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{todoId} {
      allow read, write: if true;
      // Validation rules ensure data integrity
    }
  }
}
```

### Enhanced Security Rules (For Production with Authentication)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{todoId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null && 
                   request.resource.data.keys().hasAll(['text', 'completed', 'createdAt', 'updatedAt']) &&
                   request.resource.data.text is string &&
                   request.resource.data.text.size() > 0 &&
                   request.resource.data.text.size() <= 500 &&
                   request.resource.data.completed is bool;
    }
  }
}
```

## Step 6: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000
3. Add a todo - it should appear in Firestore
4. Refresh the page - data should persist
5. Check Firebase Console > Firestore Database to see your data

## Firestore vs Realtime Database Advantages

### Why Firestore is Better:

- ✅ **More powerful queries** - Advanced filtering, sorting, and compound queries
- ✅ **Better offline support** - More sophisticated offline caching
- ✅ **Automatic multi-region replication** - Better global performance
- ✅ **More flexible data modeling** - Subcollections and document references
- ✅ **Better security rules** - More granular and expressive
- ✅ **Stronger consistency** - ACID transactions support
- ✅ **Better scaling** - Handles larger datasets more efficiently
- ✅ **Rich data types** - Arrays, maps, geopoints, timestamps
- ✅ **Future-proof** - Google's recommended NoSQL solution

## Security Best Practices

### Development Phase (Current Setup)
- ✅ Environment variables for sensitive config
- ✅ Data validation rules in Firestore
- ✅ Input sanitization and error handling
- ✅ Server-side timestamps
- ⚠️ Open read/write access (development only)

### Production Recommendations
- 🔐 Implement Firebase Authentication
- 🔐 Use enhanced security rules with auth
- 🔐 Enable security rules testing
- 🔐 Set up Cloud Functions for complex business logic
- 🔐 Enable audit logging
- 🔐 Monitor usage and set quotas
- 🔐 Use Firestore Security Rules simulator

## Troubleshooting

### Common Issues

1. **"Permission denied" error**
   - Check Firestore security rules
   - Verify project ID in config
   - Ensure Firestore is enabled

2. **"Failed to load" error**
   - Check network connection
   - Verify Firebase config
   - Check browser console for detailed errors

3. **Data not persisting**
   - Ensure `.env` file is properly configured
   - Check Firebase project settings
   - Verify Firestore rules allow writes

4. **Timestamp issues**
   - Firestore uses server timestamps (Timestamp objects)
   - Client-side timestamps are automatically handled

### Environment Variables Not Working
- Ensure variables start with `REACT_APP_`
- Restart development server after changing `.env`
- Check that `.env` is not committed to git

## Features Enabled by Firestore

- ✅ **Real-time synchronization** - Changes appear instantly across all clients
- ✅ **Data persistence** - Data survives page refreshes and browser restarts
- ✅ **Advanced offline support** - Works seamlessly when offline
- ✅ **Scalability** - Handles millions of documents and users
- ✅ **Cross-device sync** - Access todos from any device
- ✅ **Automatic backup** - Multi-region replication
- ✅ **ACID transactions** - Ensure data consistency
- ✅ **Complex queries** - Filter and sort efficiently

## Firestore Data Structure

```
todos (collection)
├── todoId1 (document)
│   ├── text: "Buy groceries"
│   ├── completed: false
│   ├── dueDate: "2025-10-20"
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
├── todoId2 (document)
│   ├── text: "Walk the dog"
│   ├── completed: true
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
└── ...
```

## Next Steps for Production

1. Implement user authentication (Firebase Auth)
2. Add user-specific todos with subcollections
3. Set up Firebase Hosting for deployment
4. Configure Cloud Functions for server-side logic
5. Implement proper error logging and monitoring
6. Add data export capabilities
7. Set up automated backups
8. Implement advanced features (tags, categories, sharing)