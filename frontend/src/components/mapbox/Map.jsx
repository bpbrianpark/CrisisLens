import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = "pk.eyJ1IjoiYWxldGhlYWsiLCJhIjoiY202MnhkcXB5MTI3ZzJrbzhyeTJ4NXdnaCJ9.eSFNm5gmF2-oVfqyZ3RZ3Q";

function Map() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Fetch video data and add markers to the map
  const addFlameMarkers = async (map) => {
    try {
      const querySnapshot = await getDocs(collection(db, "videos"));
      querySnapshot.forEach((doc) => {
        const { latitude, longitude } = doc.data();

        // Create a flame marker for each document
        const markerElement = document.createElement("div");
        markerElement.style.backgroundImage =
          "url(https://uxwing.com/wp-content/themes/uxwing/download/e-commerce-currency-shopping/flame-icon.png)";
        markerElement.style.backgroundSize = "contain";
        markerElement.style.width = "30px";
        markerElement.style.height = "30px";

        new mapboxgl.Marker(markerElement)
          .setLngLat([longitude, latitude])
          .addTo(map);
      });
    } catch (error) {
      console.error("Error fetching video data:", error);
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      center: userLocation || [-123.1207, 49.2827],
      zoom: 14,
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

    mapRef.current.on("load", () => {
      if (userLocation) {
        mapRef.current.flyTo({
          center: userLocation,
          zoom: 11,
        });
      }

      addFlameMarkers(mapRef.current);
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [userLocation]);

  return (
    <>
      <div id="map-container" ref={mapContainerRef} style={{ height: "100vh" }} />
      {locationError && <div className="sidebar">Location error: {locationError}</div>}
    </>
  );
}

export default Map;
