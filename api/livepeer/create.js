import { Livepeer } from 'livepeer';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let db = null;
if (!admin.apps.length) {
  try {
    let serviceAccount = null;
    
    // Try to parse the service account JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Found FIREBASE_SERVICE_ACCOUNT env var');
      try {
        serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' 
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : process.env.FIREBASE_SERVICE_ACCOUNT;
        
        if (serviceAccount && serviceAccount.private_key) {
          console.log('Initializing Firebase with service account...');
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
          });
          console.log('Firebase initialized successfully with service account');
        } else {
          throw new Error('Service account missing private_key');
        }
      } catch (parseError) {
        console.error('Failed to parse service account:', parseError.message);
        throw parseError;
      }
    } else if (process.env.FIREBASE_PROJECT_ID) {
      console.log('No service account, initializing with project ID only');
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log('Firebase initialized with project ID only (will fail on Firestore operations)');
    } else {
      console.log('No Firebase credentials provided - skipping Firebase init');
    }
    
    if (admin.apps.length > 0) {
      db = admin.firestore();
      console.log('Firestore database initialized');
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    console.log('Continuing without Firebase...');
    // Continue without Firebase
  }
}

// Initialize Livepeer client
let livepeerClient = null;
try {
  if (!process.env.LIVEPEER_API_KEY) {
    console.log('Warning: LIVEPEER_API_KEY not found');
  } else {
    livepeerClient = new Livepeer({ apiKey: process.env.LIVEPEER_API_KEY });
    console.log('Livepeer client initialized');
  }
} catch (error) {
  console.error('Failed to initialize Livepeer:', error);
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('Received POST request to /api/livepeer/create');

  console.log('Request body:', req.body);
  const { latitude, longitude, crisis } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  try {
    if (!livepeerClient) {
      throw new Error('Livepeer client not initialized. Check LIVEPEER_API_KEY environment variable.');
    }
    
    console.log('Creating stream with Livepeer...');
    // Create stream with Livepeer
    const streamData = {
      name: uuidv4(),
      record: true,
    };

    const response = await livepeerClient.stream.create(streamData);
    
    if (!response?.stream) {
      throw new Error('Failed to create stream');
    }

    const stream = response.stream;

    console.log('Saving to Firebase (optional)...');
    // Save to Firebase (only if db is initialized)
    // This is OPTIONAL - streaming works without it
    if (db) {
      try {
        await db.collection('livestreams').doc(stream.id).set({
          streamId: stream.id,
          name: stream.name,
          streamKey: stream.streamKey,
          playbackId: stream.playbackId,
          ingestUrl: `rtmp://rtmp.livepeer.com/live/${stream.streamKey}`,
          status: 'active',
          latitude: latitude,
          longitude: longitude,
          crisis: crisis || 'general',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('✓ Saved to Firebase');
      } catch (firebaseError) {
        console.log('⚠ Firebase save failed (this is OK):', firebaseError.message);
        // Continue even if Firebase fails - streaming still works!
      }
    } else {
      console.log('⚠ Skipping Firebase (optional)');
    }

    res.status(201).json({
      message: 'Stream created successfully',
      data: {
        id: stream.id,
        name: stream.name,
        streamKey: stream.streamKey,
        playbackId: stream.playbackId,
        ingestUrl: `rtmp://rtmp.livepeer.com/live/${stream.streamKey}`,
      },
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error creating stream',
      error: error.message,
      stack: error.stack,
    });
  }
}
