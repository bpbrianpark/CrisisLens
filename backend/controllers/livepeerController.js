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
    console.log("Creating new stream with Livepeer API...");
    const streamData = {
      name: uuidv4(),
      record: true,
      lowLatency: true,
      profiles: [
        {
          name: "480p_high_quality",
          width: 854,
          height: 480,
          bitrate: 1000000,  // 2.5 Mbps 
          fps: 20,  
          audioBitrate: 0,
          audioChannels: 0,
          gopSize: 48,  
          preset: "medium", 
          profile: "H264Main",  
          crf: 23,  // Constant Rate Factor (lower = better quality)
          maxrate: 3000000,  
          bufsize: 6000000   // Buffer size for smooth streaming
        }
      ]
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
    console.log(`Ending stream with ID ${streamId}...`);
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
        const sessionData = await this.fetchSession(asset.snapshot.source.sessionId);
        streamId = sessionData.parentId;

        // Get location data from the livestream document using the stream ID
        if (streamId) {
          const livestreamDoc = await this.db.collection("livestreams").doc(streamId).get();
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
        const livestreamDoc = await this.db.collection("livestreams").doc(asset.snapshot.source.sessionId).get();
        if (livestreamDoc.exists) {
          const livestreamData = livestreamDoc.data();
          latitude = livestreamData.latitude;
          longitude = livestreamData.longitude;
          streamId = asset.snapshot.source.sessionId;
          crisis = livestreamData.crisis || "other";
        }
      }
    }

    await this.db.collection("assets").doc(asset.id).set({
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

