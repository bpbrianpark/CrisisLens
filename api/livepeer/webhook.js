import admin from 'firebase-admin';
import { Livepeer } from 'livepeer';

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
  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));

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

  try {
    const { event, payload } = req.body;

    console.log('Event:', event);
    console.log('Payload:', payload);

    switch (event) {
      case "asset.ready":
        console.log('Processing asset.ready webhook...');
        await handleAssetReady(payload.asset);
        return res.status(200).json({ message: "Asset ready processed" });

      default:
        console.log(`Unhandled webhook event: ${event}`);
        return res.status(200).json({ message: `Event ${event} acknowledged but not processed` });
    }
  } catch (error) {
    console.error(`Error processing webhook event:`, error);
    return res.status(500).json({ message: `Error processing webhook`, error: error.message });
  }
}

async function handleAssetReady(asset) {
  console.log(`Processing asset.ready webhook for asset ID ${asset.id}...`);
  if (!asset?.id) {
    throw new Error("Asset ID is required");
  }

  let latitude = null;
  let longitude = null;
  let streamId = null;
  let crisis = "other";

  if (asset.snapshot?.source?.sessionId) {
    try {
      // Fetch session data to get parentId (which is the stream ID)
      const sessionData = await fetchSession(asset.snapshot.source.sessionId);
      streamId = sessionData.parentId;

      // Get location data from the livestream document using the stream ID
      if (streamId && db) {
        const livestreamDoc = await db.collection("livestreams").doc(streamId).get();
        if (livestreamDoc.exists) {
          const livestreamData = livestreamDoc.data();
          latitude = livestreamData.latitude;
          longitude = livestreamData.longitude;
          crisis = livestreamData.crisis || "other";
        }
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      // Fallback to using sessionId directly if session fetch fails
      if (db) {
        const livestreamDoc = await db.collection("livestreams").doc(asset.snapshot.source.sessionId).get();
        if (livestreamDoc.exists) {
          const livestreamData = livestreamDoc.data();
          latitude = livestreamData.latitude;
          longitude = livestreamData.longitude;
          streamId = asset.snapshot.source.sessionId;
          crisis = livestreamData.crisis || "other";
        }
      }
    }
  }

  if (db) {
    await db.collection("assets").doc(asset.id).set({
      assetId: asset.id,
      title: "",
      name: asset.snapshot?.name || "",
      latitude: latitude,
      longitude: longitude,
      crisis: crisis || "other",
      playbackId: asset.snapshot?.playbackId || "",
      downloadUrl: asset.snapshot?.downloadUrl || "",
      playbackUrl: asset.snapshot?.playbackUrl || "",
      duration: asset.snapshot?.videoSpec?.duration || 0,
      bitrate: asset.snapshot?.videoSpec?.bitrate || 0,
      format: asset.snapshot?.videoSpec?.format || "",
      size: asset.snapshot?.size || 0,
      status: asset.snapshot?.status?.phase || "ready",
      createdAt: asset.snapshot?.createdAt ? new Date(asset.snapshot?.createdAt) : admin.firestore.FieldValue.serverTimestamp(),
      livepeerCreatedAt: asset.snapshot?.createdAt ? new Date(asset.snapshot?.createdAt) : null,
      sessionId: asset.snapshot?.source?.sessionId || null,
      userId: asset.snapshot?.userId || null,
      projectId: asset.snapshot?.projectId || null,
    });
    console.log(`Created Firestore document for asset ${asset.id}`);

    // Delete the livestream document using the correct stream ID
    if (streamId) {
      await db.collection("livestreams").doc(streamId).delete();
      console.log(`Deleted livestream document ${streamId}`);
    }
  } else {
    console.log('No Firebase database available, skipping asset save');
  }
}

// Helper to fetch session data from Livepeer API
async function fetchSession(sessionId) {
  const response = await fetch(`https://livepeer.studio/api/session/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch session: ${response.status} ${text}`);
  }

  return response.json();
}
