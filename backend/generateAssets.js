import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CERT_URL,
  universe_domain: "googleapis.com"
};

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = getFirestore(app)

function generateAssetId() {
  return '24e1de94-d0a2-4a56-af93-3883d735474d';
}

function generatePlaybackId() {
  return '24e10lrbqszbb1qw';
}

function generateSessionId() {
  return uuidv4();
}

function generateUserId() {
  return uuidv4();
}

function generateProjectId() {
  return uuidv4();
}

function generateName() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + 'T' + 
                   now.toISOString().split('T')[1].split('.')[0] + 'Z';
  return `live-${timestamp}`;
}

function generateUrls(playbackId) {
  const baseUrl = 'https://vod-cdn.lp-playback.studio/raw/jxf4iblf6wlsyor6526t4tcmtmqa/catalyst-vod-com/hls';
  return {
    downloadUrl: `${baseUrl}/${playbackId}/480p0.mp4`,
    playbackUrl: `${baseUrl}/${playbackId}/index.m3u8`
  };
}


async function createAssetDocument(latitude, longitude, crisis = 'wildfire') {
  const assetId = generateAssetId();
  const playbackId = generatePlaybackId();
  const sessionId = generateSessionId();
  const userId = generateUserId();
  const projectId = generateProjectId();
  const name = generateName();
  const urls = generateUrls(playbackId);
  
  const now = new Date();
  
  const assetData = {
    assetId: assetId,
    bitrate: 4000000,
    createdAt: now,
    crisis: crisis,
    downloadUrl: urls.downloadUrl,
    duration: 12.971,
    format: "hls",
    latitude: latitude,
    livepeerCreatedAt: now,
    longitude: longitude,
    name: name,
    playbackId: playbackId,
    playbackUrl: urls.playbackUrl,
    projectId: projectId,
    sessionId: sessionId,
    size: 369,
    status: "ready",
    title: "",
    userId: userId
  };

  try {
    const docRef = await db.collection('assets').add(assetData);
    console.log(`Created asset document with ID: ${docRef.id}`);
    console.log(`Coordinates: ${latitude}, ${longitude}`);
    console.log(`Crisis type: ${crisis}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating asset document:', error);
    throw error;
  }
}

function loadCoordinatesFromFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (Array.isArray(data)) {
      return data;
    } else if (data.coordinates && Array.isArray(data.coordinates)) {
      return data.coordinates;
    } else if (data.assets && Array.isArray(data.assets)) {
      return data.assets.map(asset => [asset.latitude, asset.longitude]);
    } else {
      throw new Error('Invalid JSON structure. Expected array of coordinates or object with coordinates/assets property.');
    }
  } catch (error) {
    console.error(`Error reading coordinates file: ${error.message}`);
    throw error;
  }
}

function loadCrisisFromFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (data.crisis) {
      return data.crisis;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function generateAssetsFromCoordinates(coordinates, crisis = 'wildfire') {
  const results = [];
  
  for (let i = 0; i < coordinates.length; i++) {
    const [latitude, longitude] = coordinates[i];
    
    try {
      const docId = await createAssetDocument(latitude, longitude, crisis);
      results.push({ success: true, docId, latitude, longitude });
    } catch (error) {
      console.error(`Failed to create document for [${latitude}, ${longitude}]:`, error.message);
      results.push({ success: false, error: error.message, latitude, longitude });
    }
    
    // Small delay to avoid overwhelming Firebase
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  return results;
}

async function main() {

  try {
    let coordinates;
    let crisis = 'wildfire';

    if (process.argv[2]) {
      const jsonFilePath = process.argv[2];
      
      coordinates = loadCoordinatesFromFile(jsonFilePath);
      const fileCrisis = loadCrisisFromFile(jsonFilePath);
      if (fileCrisis) {
        crisis = fileCrisis;
      }
    } else {
      const defaultJsonPath = path.join(process.cwd(), 'coordinates.json');
      
      if (fs.existsSync(defaultJsonPath)) {
        coordinates = loadCoordinatesFromFile(defaultJsonPath);
        const fileCrisis = loadCrisisFromFile(defaultJsonPath);
        if (fileCrisis) {
          crisis = fileCrisis;
        }
      } else {
        createExampleCoordinatesFile();
        return;
      }
    }

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
      throw new Error('No valid coordinates found in the JSON file');
    }

    await generateAssetsFromCoordinates(coordinates, crisis);
    console.log('\nAsset generation completed!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function createExampleCoordinatesFile() {
  const exampleData = {
    crisis: "wildfire",
    coordinates: [
    ]
  };

  const filePath = path.join(process.cwd(), 'coordinates.json');
  fs.writeFileSync(filePath, JSON.stringify(exampleData, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}