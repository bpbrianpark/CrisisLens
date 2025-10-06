import { Livepeer } from "livepeer";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

export default class LivepeerController {
  constructor(db) {
    this.apiKey = process.env.LIVEPEER_API_KEY;
    this.client = new Livepeer({
      apiKey: this.apiKey,
    });
    this.db = db;
  }

  createStream() {
    const streamData = {
      name: uuidv4(),
      record: true,
    };

    return this.client.stream
      .create(streamData)
      .then((response) => {
        if (response && response.stream) {
          return {
            id: response.stream.id,
            name: response.stream.name,
            streamKey: response.stream.streamKey,
            playbackId: response.stream.playbackId,
            ingestUrl: `rtmp://rtmp.livepeer.com/live/${response.stream.streamKey}`,
          };
        } else {
          throw new Error("Failed to create stream.");
        }
      })
      .catch((error) => {
        console.error("Error creating stream:", error);
        throw new Error("Internal server error.");
      });
  }

  endStream(streamId) {
    return this.client.stream
      .delete(streamId)
      .then(() => {
        return streamId;
      })
      .catch((error) => {
        console.error(`Error ending stream with ID ${streamId}:`, error);
        throw new Error("Failed to end stream.");
      });
  }

  // Webhook helper for asset.ready events
  async handleAssetReady(asset) {
    if (!asset?.id) {
      throw new Error("Asset ID is required");
    }

    let latitude = null;
    let longitude = null;
    let streamId = null;
    
    if (asset.snapshot?.source?.sessionId) {
      try {
        // Fetch session data to get parentId (which is the stream ID)
        const sessionData = await this.fetchSession(asset.snapshot.source.sessionId);
        streamId = sessionData.parentId;
        
        // Get location data from the livestream document using the stream ID
        if (streamId) {
          const livestreamDoc = await this.db.collection("livestreams").doc(streamId).get();
          if (livestreamDoc.exists) {
            const livestreamData = livestreamDoc.data();
            latitude = livestreamData.latitude;
            longitude = livestreamData.longitude;
          }
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
        // Fallback to using sessionId directly if session fetch fails
        const livestreamDoc = await this.db.collection("livestreams").doc(asset.snapshot.source.sessionId).get();
        if (livestreamDoc.exists) {
          const livestreamData = livestreamDoc.data();
          latitude = livestreamData.latitude;
          longitude = livestreamData.longitude;
          streamId = asset.snapshot.source.sessionId;
        }
      }
    }
    
    await this.db.collection("assets").doc(asset.id).set({
      assetId: asset.id,
      title: "",
      name: asset.snapshot?.name || "",
      latitude: latitude,
      longitude: longitude,
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
      await this.db.collection("livestreams").doc(streamId).delete();
      console.log(`Deleted livestream document ${streamId}`);
    }
  }

  // Helper to fetch session data from Livepeer API
  async fetchSession(sessionId) {
    const response = await fetch(`https://livepeer.studio/api/session/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch session: ${response.status} ${text}`);
    }
    
    return response.json();
  }
}

