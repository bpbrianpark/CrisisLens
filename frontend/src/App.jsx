import Map from "./components/mapbox/Map";
import "./App.css";
import Button from "./components/button";
import { useState } from "react";

export default function App() {
  const [videoLocation, setVideoLocation] = useState(null);

  const handleLocationRecord = (location) => {
    setVideoLocation(location);
    console.log("Location recorded in App:", location);
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <Map />
      <Button onLocationRecord={handleLocationRecord} />
    </div>
  );
}
