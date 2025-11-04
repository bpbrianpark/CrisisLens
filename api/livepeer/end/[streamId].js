import { Livepeer } from 'livepeer';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let db = null;
if (!admin.apps.length) {
  try {
    let serviceAccount = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string' 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (serviceAccount && serviceAccount.private_key) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
        });
      }
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
    
    if (admin.apps.length > 0) {
      db = admin.firestore();
    }
  } catch (error) {
    console.error('Firebase init error:', error);
  }
}

// Initialize Livepeer client
let livepeerClient = null;
try {
  if (process.env.LIVEPEER_API_KEY) {
    livepeerClient = new Livepeer({ apiKey: process.env.LIVEPEER_API_KEY });
  }
} catch (error) {
  console.error('Livepeer init error:', error);
}

export default async function handler(req, res) {
  console.log('=== END STREAM FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', req.query);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    console.log('Method not DELETE, returning 405');
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  console.log('Method is DELETE, proceeding...');

  // Extract streamId from the URL path
  const urlParts = req.url.split('/');
  let streamId = urlParts[urlParts.length - 1];
  
  // Remove any query parameters that might be attached
  if (streamId.includes('?')) {
    streamId = streamId.split('?')[0];
  }

  console.log('Extracted streamId:', streamId);

  if (!streamId || streamId === '') {
    return res.status(400).json({ message: 'Stream ID is required' });
  }

  try {
    if (!livepeerClient) {
      throw new Error('Livepeer client not initialized');
    }
    
    console.log('Deleting stream from Livepeer...');
    // Delete stream from Livepeer
    await livepeerClient.stream.delete(streamId);
    console.log('✓ Stream deleted from Livepeer');

    // Update Firebase
    if (db) {
      try {
        await db.collection('livestreams').doc(streamId).update({
          status: 'finished',
          endedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('✓ Updated Firebase');
      } catch (firebaseError) {
        console.log('⚠ Firebase update failed (this is OK)');
      }
    }

    res.status(200).json({
      message: `Stream with ID ${streamId} has been ended.`,
    });
  } catch (error) {
    console.error('Error ending stream:', error);
    res.status(500).json({
      message: 'Error ending stream',
      error: error.message,
    });
  }
}
