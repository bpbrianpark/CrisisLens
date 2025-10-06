# CrisisLens Backend

This backend handles Livepeer stream management, webhook processing, and Firebase integration for the CrisisLens application.

## Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Google Cloud CLI (`gcloud`)
- Firebase project with Firestore enabled
- Livepeer Studio account with API key

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Authentication Setup

#### Option A: Application Default Credentials (Recommended)

1. Install Google Cloud CLI if not already installed:
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. Authenticate with your Google account:
   ```bash
   gcloud auth login
   ```

3. Set up application default credentials:
   ```bash
   gcloud auth application-default login
   ```

4. Set your Firebase project:
   ```bash
   gcloud config set project YOUR_FIREBASE_PROJECT_ID
   ```

#### Option B: Service Account Key (Alternative)

1. Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts
2. Click "Generate new private key" and download the JSON file
3. Set the environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
   ```

### 3. Environment Variables

Copy the `.env.example` file and rename it to `.env` in the backend directory:

### 4. Get Your Livepeer API Key

1. Go to [Livepeer Studio](https://livepeer.studio/)
2. Navigate to API Keys section
3. Create a new API key or copy existing one
4. Add it to your `.env` file

## Running the Backend

### Development Mode

```bash
npm run dev
```

This starts the server with nodemon for auto-restart on file changes.

### Production Mode

```bash
npm start
```

The server will start on port 8080 by default.

## Webhook Setup

### 1. Expose Your Local Server

For local development, you need to expose your backend to the internet so Livepeer can send webhooks.

#### Using ngrok

1. Install ngrok:
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from: https://ngrok.com/download
   ```

2. Start ngrok to expose port 8080:
   ```bash
   npm run ngrok
   ```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 2. Configure Livepeer Webhooks

1. Go to [Livepeer Studio](https://livepeer.studio/) → Developers → Webhooks
2. Click "Create Webhook"
3. Set the webhook URL to: `https://your-ngrok-url/livepeer/webhook`
4. Select events: `asset.ready`
6. Click "Create Webhook"
