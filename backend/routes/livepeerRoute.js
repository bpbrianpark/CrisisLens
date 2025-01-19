import { Router } from "express";
import LivepeerController from "../controllers/livepeerController.js";

const router = Router();
const livepeerController = new LivepeerController();

router.post("/create", (req, res) => {
  livepeerController
    .createStream()
    .then((streamData) => {
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
    .then(() => {
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

export default router;
