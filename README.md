# Todo Checklist App

A secure, password-protected todo application built with React, TypeScript, and Firebase Firestore.

## Features

- ✅ Password-protected authentication
- ✅ Real-time todo synchronization with Firebase Firestore
- ✅ Add, edit, delete, and toggle todos
- ✅ Due date support for todos
- ✅ Persistent authentication (24-hour sessions)
- ✅ Responsive design
- ✅ Firebase Hosting deployment

## Setup Instructions

### 1. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Firebase configuration and desired password:
   ```bash
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

   # App Authentication
   VITE_APP_PASSWORD=your-secret-password-here
   ```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Cloud Firestore database
4. Go to Project Settings > General > Your apps
5. Add a web app and copy the configuration values to your `.env` file

### 3. Install Dependencies

```bash
npm install
```

### 4. Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

### 6. Deploy to Firebase Hosting (Optional)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```

4. Deploy:
   ```bash
   firebase deploy
   ```

## Authentication

The app uses a simple password-based authentication system:

- Enter your password on the login page to access the app
- Sessions last for 24 hours
- Use the "Logout" button to end your session
- The password is configured in your `.env` file as `VITE_APP_PASSWORD`

## Security

- Passwords are stored as environment variables
- Authentication sessions are stored locally with expiration
- Firebase Firestore security rules control data access
- Environment variables are not committed to version control

## Project Structure

```
src/
├── components/          # React components
│   ├── EditSection.tsx     # Due date editing
│   ├── ErrorMessage.tsx    # Error display
│   ├── Header.tsx          # App header with logout
│   ├── LoadingState.tsx    # Loading indicator
│   ├── LoginPage.tsx       # Authentication page
│   ├── TodoInput.tsx       # Todo creation form
│   ├── TodoItem.tsx        # Individual todo item
│   └── TodoList.tsx        # Todo list container
├── hooks/               # Custom React hooks
│   ├── useAuth.ts          # Authentication logic
│   ├── useSelectedTodo.ts  # Todo selection state
│   └── useTodos.ts         # Todo CRUD operations
├── services/            # External services
│   └── authService.ts      # Authentication service
├── types/               # TypeScript type definitions
│   └── Todo.ts             # Todo interface
├── utils/               # Utility functions
│   └── dateHelpers.ts      # Date formatting
├── firebase-config.ts   # Firebase configuration
├── firebase-service.ts  # Firestore operations
└── App.tsx             # Main application component
```

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Authentication**: Simple password-based system
- **Styling**: CSS with inline styles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.