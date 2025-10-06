# CrisisLens Frontend

The frontend application for CrisisLens, built with React, Vite, and Mapbox for real-time crisis mapping and livestreaming.

## Prerequisites

- **Node.js v20 or higher** (required)
- npm or yarn
- Mapbox access token
- News API key (TheNewsAPI)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy the `.env.example` file and rename it to `.env` in the frontend directory:

### 3. Get Your API Keys

#### Mapbox Access Token

1. Go to [Mapbox](https://www.mapbox.com/)
2. Sign up or log in to your account
3. Go to [Account → Access Tokens](https://account.mapbox.com/access-tokens/)
4. Create a new token or copy your default public token
5. Add it to your `.env.local` file

#### News API Key (TheNewsAPI)

1. Go to [TheNewsAPI](https://www.thenewsapi.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env.local` file

## Running the Frontend

### Development Mode

```bash
npm run dev
```

This starts the Vite development server with hot reload. The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

This serves the production build locally for testing.
