import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import StreamPlayer from "../livepeer/StreamPlayer";
import ReactDOM from 'react-dom';
import { VITE_LIVEPEER_PLAYBACK_ID } from "../../env";

const PLAYBACK_ID = VITE_LIVEPEER_PLAYBACK_ID;

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWxldGhlYWsiLCJhIjoiY202MnhkcXB5MTI3ZzJrbzhyeTJ4NXdnaCJ9.eSFNm5gmF2-oVfqyZ3RZ3Q";

function Map() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const markerRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showStream, setShowStream] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      console.log("Requesting location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location received:", position.coords);
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      const message = "Geolocation is not supported by this browser.";
      console.log(message);
      setLocationError(message);
    }
  }, []);

  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      center: userLocation || [-123.1207, 49.2827],
      zoom: 11,
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: true,
      placeholder: "Search for places",
      proximity: userLocation,
    });

    mapRef.current.addControl(geocoder, "top-left");

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    mapRef.current.addControl(geolocateControl);

    const fixedLocation = [-123.249, 49.2606];

    const markerElement = document.createElement("div");
    markerElement.style.backgroundImage =
      "url(https://uxwing.com/wp-content/themes/uxwing/download/e-commerce-currency-shopping/flame-icon.png)";
    markerElement.style.backgroundSize = "contain";
    markerElement.style.width = "30px";
    markerElement.style.height = "30px";

    markerRef.current = new mapboxgl.Marker(markerElement)
      .setLngLat(fixedLocation)
      .addTo(mapRef.current);

    markerRef.current.getElement().style.cursor = "pointer";
    markerRef.current.getElement().addEventListener("click", () => {
      setShowStream(true);
    });

    return () => {
      if (markerRef.current) markerRef.current.remove();
      mapRef.current?.remove();
    };
  }, [userLocation]);

  return (
    <>
      <div id="map-container" ref={mapContainerRef} />
      {locationError && (
        <div className="sidebar">Location error: {locationError}</div>
      )}
      {showStream && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 99999
        }}>
          <button
            onClick={() => setShowStream(false)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 100000,
              fontSize: '18px'
            }}
          >
            ✕
          </button>
          <StreamPlayer playbackId={PLAYBACK_ID} />
        </div>
      )}
    </>
  );
}

export default Map;
