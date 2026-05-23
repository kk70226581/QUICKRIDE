# Google OAuth Setup Guide

This guide explains how to set up Google OAuth 2.0 authentication for QuickRide. The implementation is complete on both frontend and backend - you just need to configure your Google credentials.

## Prerequisites

- A Google Cloud Project
- A Google OAuth 2.0 credentials (Client ID and Client Secret)
- Node.js packages installed on the backend

## Step 1: Install Backend Dependencies

```bash
cd Backend
npm install google-auth-library
```

## Step 2: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "Credentials" in the left sidebar
4. Click "Create Credentials" → "OAuth Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`
7. Copy your **Client ID** and **Client Secret**

## Step 3: Configure Frontend Environment

Create or update `Frontend/.env`:

```env
VITE_SERVER_URL = http://localhost:3000
VITE_ENVIRONMENT = development
VITE_RIDE_TIMEOUT = 90000
VITE_GOOGLE_CLIENT_ID = <your-google-client-id>
```

Replace `<your-google-client-id>` with the Client ID from Step 2.

## Step 4: Configure Backend Environment

Update `Backend/.env`:

```env
PORT=3000
RELOAD_INTERVAL=10
SERVER_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173
ENVIRONMENT=development
MONGODB_DEV_URL=mongodb://127.0.0.1:27017/quickRide
JWT_SECRET=quickride-dev-secret
GOOGLE_MAPS_API=AIzaSyCTxloa24QZfBmcd0YXmkoXFHnVgFZxIGc
GOOGLE_CLIENT_ID = <your-google-client-id>
GOOGLE_CLIENT_SECRET = <your-google-client-secret>
MAIL_USER=<your-gmail-id>
MAIL_PASS=<your-app-specific-gmail-password>
RAZORPAY_KEY_ID=rzp_test_S0GoGwzZ36Sb4H
RAZORPAY_KEY_SECRET=ulnIymD8hg53w3bMD7nDm6YO
```

Replace the Google credentials with values from Step 2.

## Step 5: Backend Routes Overview

The following Google OAuth endpoints are now available:

### For Users
- **POST** `/user/google-signin`
  - Request: `{ token: <google-jwt-token> }`
  - Response: `{ token: <app-jwt>, user: {...} }`

### For Captains
- **POST** `/captain/google-signin`
  - Request: `{ token: <google-jwt-token> }`
  - Response: `{ token: <app-jwt>, captain: {...} }`

## Step 6: Frontend Components

Google OAuth is integrated into the following screens:

- **User Login**: `/Frontend/src/screens/UserLogin.jsx`
- **User Signup**: `/Frontend/src/screens/UserSignup.jsx`
- **Captain Login**: `/Frontend/src/screens/CaptainLogin.jsx`
- **Captain Signup**: `/Frontend/src/screens/CaptainSignup.jsx`

All screens use the `GoogleSignIn` component: `/Frontend/src/components/GoogleSignIn.jsx`

## How It Works

1. **Frontend Flow**:
   - User clicks "Sign in with Google"
   - Google Identity Services script handles authentication
   - Returns JWT credential token
   - Frontend POSTs token to backend endpoint (`/user/google-signin` or `/captain/google-signin`)
   - Backend verifies and creates/updates user/captain in MongoDB
   - Returns app JWT token
   - Frontend stores token and navigates to dashboard

2. **Backend Flow**:
   - Receives Google JWT token from frontend
   - Verifies token using Google Auth Library
   - Extracts user email and name from token payload
   - Finds or creates user/captain in MongoDB
   - Generates app JWT token
   - Returns token and user data

## Environment Variables Summary

### Frontend (Frontend/.env)
- `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth 2.0 Client ID
- `VITE_SERVER_URL` - Backend API URL
- `VITE_ENVIRONMENT` - Environment (development/production)
- `VITE_RIDE_TIMEOUT` - Ride timeout duration

### Backend (Backend/.env)
- `GOOGLE_CLIENT_ID` - Same as frontend
- `GOOGLE_CLIENT_SECRET` - Your Google Client Secret
- `JWT_SECRET` - Secret for app JWT tokens
- `MONGODB_DEV_URL` - MongoDB connection string
- Other existing environment variables

## Testing

1. Start the backend: `cd Backend && npm run dev`
2. Start the frontend: `cd Frontend && npm run dev`
3. Navigate to login/signup pages
4. Click "Sign in with Google" button
5. Complete Google authentication
6. Should be redirected to dashboard

## Troubleshooting

### "Invalid Google token or authentication failed"
- Verify `VITE_GOOGLE_CLIENT_ID` in frontend .env matches Google Cloud Console
- Verify `GOOGLE_CLIENT_ID` in backend .env matches Google Cloud Console
- Check authorized redirect URIs in Google Cloud Console

### CORS issues
- Ensure CORS is enabled in `Backend/server.js`
- Check that `CLIENT_URL` in `Backend/.env` matches frontend URL

### Token not being sent to backend
- Check browser console for errors
- Verify Google Identity Services script loaded successfully
- Check that GoogleSignIn component mounted correctly

## Additional Features

The GoogleSignIn component supports:
- User and Captain role differentiation via `userType` prop
- Automatic user/captain creation on first login
- Email verification flagged as true for OAuth users
- Profile image storage from Google account
- Fallback to manual password reset if needed

## Next Steps

After setup is complete:
1. Test Google sign-in on all authentication screens
2. Verify user/captain profiles are created correctly in MongoDB
3. Test role switching between user and captain
4. Implement email notifications for OAuth signups (optional)
5. Add profile completion flow for OAuth users without vehicle info (captains)
