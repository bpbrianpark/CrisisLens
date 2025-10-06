# CrisisLens Backend

This backend handles Livepeer stream management, webhook processing, and Firebase integration for the CrisisLens application.

## Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- Google Cloud CLI (`gcloud`)
- Firebase project with Firestore enabled
- Livepeer Studio account with API key
- ngrok (for webhook development)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Ngrok (for consistent webhook URLs)

To ensure all team members can use the same webhook URL without needing individual Livepeer accounts:

**For Team Lead:**
1. Get ngrok account at https://dashboard.ngrok.com/ (free)
2. Get your authtoken from the dashboard
3. Create `.env` file with:
   ```bash
   NGROK_AUTHTOKEN=your_authtoken_here
   NGROK_DOMAIN=crisislens.ngrok-free.app
   ```
4. Share `.env` with team members

**For Team Members:**
```bash
# Start ngrok with consistent URL
npm run ngrok
```

This will give you a consistent URL: `https://crisislens.ngrok-free.app`

### 3. Firebase Authentication Setup

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

### 4. Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Livepeer Configuration
LIVEPEER_API_KEY=your_livepeer_api_key_here

# Ngrok Configuration (for consistent webhook URLs)
NGROK_AUTHTOKEN=your_ngrok_authtoken_here
NGROK_DOMAIN=crisislens.ngrok-free.app

# Firebase Configuration (if using service account key)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
```

### 5. Get Your Livepeer API Key

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
3. Set the webhook URL to: `https://crisislens.ngrok-free.app/livepeer/webhook`
4. Select events: `asset.ready`
5. Click "Create Webhook"

**Note:** This URL will be consistent for all team members once ngrok is set up.
