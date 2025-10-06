import { useState } from "react";
import axios from "axios";
import Map from "./components/mapbox/Map";
import GoLiveButton from "./components/GoLiveButton/GoLiveButton";
import StreamBroadcast from "./components/livepeer/StreamBroadcast";

import "./App.css";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [streamData, setStreamData] = useState(null);

  const handleStartStream = async ({ latitude, longitude }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/livepeer/create`, {
        latitude,
        longitude,
      });
      const { data } = response.data;
      setStreamData(data);
    } catch (error) {
      console.error("Error starting stream:", error);
      throw error;
    }
  };

  const handleEndStream = async () => {
    if (!streamData) return;
    setLoading(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/livepeer/end/${streamData.id}`);
      setStreamData(null);
    } catch (error) {
      console.error("Error ending stream:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      {streamData && !loading && (
        <div className="stream-overlay">
          <StreamBroadcast streamKey={streamData.streamKey} onClose={handleEndStream} />
        </div>
      )}
      <Map />
      <GoLiveButton handleStartStream={handleStartStream} />
    </div>
  );
}
