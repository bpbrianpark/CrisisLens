import { Livepeer } from "livepeer";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

export default class LivepeerController {
  constructor() {
    this.client = new Livepeer({
      apiKey: process.env.LIVEPEER_API_KEY,
    });
  }

  createStream() {
    const streamData = {
      name: uuidv4(),
    };

    return this.client.stream
      .create(streamData)
      .then((response) => {
        if (response && response.stream) {
          console.log(response.stream.id);
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
}
