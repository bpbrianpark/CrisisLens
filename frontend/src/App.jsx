import Map from "./components/mapbox/Map";
import GoLiveButton from "./components/GoLiveButton";

export default function App() {
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <GoLiveButton />
      <Map />
    </div>
  );
}
