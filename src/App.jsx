import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

import "mapbox-gl/dist/mapbox-gl.css";

import "./App.css";

// Add your Mapbox access token here
mapboxgl.accessToken =
  "pk.eyJ1IjoiYWxldGhlYWsiLCJhIjoiY202MnBpM3R6MHc5czJpcHlybHBzNnRnNCJ9.7rfcscc9ABryDmhQZWdOWw";

function App() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    // Get user's location
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
    // Initialize the map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      center: userLocation || [-74.5, 40], // Use user location if available, otherwise use default
      zoom: 9,
    });

    // Add search control
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: true,
      placeholder: "Search for places",
      proximity: userLocation, // Bias results toward user location
    });

    mapRef.current.addControl(geocoder, "top-left");

    // Add geolocate control
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    mapRef.current.addControl(geolocateControl);

    // If we have user location, fly to it once the map loads
    if (userLocation) {
      mapRef.current.on("load", () => {
        mapRef.current.flyTo({
          center: userLocation,
          zoom: 14,
        });
      });
    }

    return () => {
      mapRef.current?.remove();
    };
  }, [userLocation]); // Now depends on userLocation

  return (
    <>
      <div id="map-container" ref={mapContainerRef} />
      {locationError && (
        <div className="sidebar">Location error: {locationError}</div>
      )}
    </>
  );
}

export default App;
