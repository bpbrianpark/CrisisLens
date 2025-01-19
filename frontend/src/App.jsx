import Map from "./components/mapbox/Map";
import BroadcastApp from "./components/mapbox/BroadcastApp";
import "./App.css";
import GoLiveButton from "./components/GoLiveButton";

export default function App() {
    // TODO: return Map and GoLiveButton
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <BroadcastApp />
       
      
    </div>
  );
}
