import Map from "./components/mapbox/Map";
import "./App.css";
import GoLiveButton from "./components/GoLiveButton";

export default function App() {
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <Map />
      <GoLiveButton />
    </div>
  );
}
