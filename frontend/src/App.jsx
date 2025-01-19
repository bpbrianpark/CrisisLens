import { useState } from "react";
import axios from "axios";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import Map from "./components/mapbox/Map";
import "./App.css";
import GoLiveButton from "./components/GoLiveButton";
import StreamBroadcast from "./components/livepeer/StreamBroadcast";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [streamData, setStreamData] = useState(null);

  const handleStartStream = async ({ latitude, longitude }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/livepeer/create`);
      const { data } = response.data;
      setStreamData(data);
      await addDoc(collection(db, "videos"), {
        userId: null,
        longitude,
        latitude,
        videoId: data.id,
        videoName: data.name,
        startTime: serverTimestamp(),
        streamKey: data.streamKey,
        playbackId: data.playbackId,
        category: null,
        isLiveStream: true,
        isOnGoing: true,
      });
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

      // Find the document in Firestore where videoId matches
      const videosRef = collection(db, "videos");
      const q = query(videosRef, where("videoId", "==", streamData.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const videoDoc = querySnapshot.docs[0]; // Assuming videoId is unique
        await updateDoc(videoDoc.ref, { isOnGoing: false });
      } else {
        console.error("No document found with the matching videoId.");
      }

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
