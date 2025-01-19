import { useState } from "react";
import axios from "axios";
import StreamBroadcast from "./components/livepeer/StreamBroadcast";
import Map from "./components/Map";

export default function App() {
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(false);

  const startStream = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/livepeer/create`);
      const { data } = response.data;
      setStreamData(data);
    } catch (error) {
      console.error("Error starting stream:", error);
    } finally {
      setLoading(false);
    }
  };

  const endStream = async () => {
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
    <div className="flex flex-col items-center justify-center gap-4">
      <Map />
      <button
        onClick={startStream}
        disabled={loading || streamData !== null}
        className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
      >
        Start Stream
      </button>

      <button
        onClick={endStream}
        disabled={loading || streamData === null}
        className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
      >
        End Stream
      </button>

      {streamData && <StreamBroadcast streamKey={streamData.streamKey} />}
    </div>
  );
}
