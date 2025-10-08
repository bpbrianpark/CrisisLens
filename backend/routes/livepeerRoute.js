import { Router } from "express";
import admin from "firebase-admin";
import LivepeerController from "../controllers/livepeerController.js";

const router = Router();
let livepeerController;

// Function to initialize the controller with db instance
export function initializeController(db) {
  livepeerController = new LivepeerController(db);
}

router.post("/create", (req, res) => {
  const { latitude, longitude, crisis } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "Latitude and longitude are required" });
  }

  livepeerController
    .createStream()
    .then(async (streamData) => {
      await livepeerController.db.collection("livestreams").doc(streamData.id).set({
        streamId: streamData.id,
        name: streamData.name,
        streamKey: streamData.streamKey,
        playbackId: streamData.playbackId,
        ingestUrl: streamData.ingestUrl,
        status: "active",
        latitude: latitude,
        longitude: longitude,
        crisis: crisis || "general",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(201).json({
        message: "Stream created successfully",
        data: streamData,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error creating stream",
        error: error.message,
      });
    });
});

router.delete("/end/:streamId", (req, res) => {
  const { streamId } = req.params;

  livepeerController
    .endStream(streamId)
    .then(async () => {
      await livepeerController.db.collection("livestreams").doc(streamId).update({
        status: "finished",
        endedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({
        message: `Stream with ID ${streamId} has been ended.`,
      });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error ending stream",
        error: error.message,
      });
    });
});

router.post("/webhook", async (req, res) => {
  const event = req.body.event;
  const payload = req.body.payload;

  try {
    switch (event) {
      case "asset.ready":
        await livepeerController.handleAssetReady(payload.asset);
        return res.status(200).json({ message: "Asset ready processed" });

      default:
        console.log(`Unhandled webhook event: ${event}`);
        return res.status(200).json({ message: `Event ${event} acknowledged but not processed` });
    }
  } catch (error) {
    console.error(`Error processing webhook event ${event}:`, error);
    return res.status(500).json({ message: `Error processing ${event}` });
  }
});

export default router;