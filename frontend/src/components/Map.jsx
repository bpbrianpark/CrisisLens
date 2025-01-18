import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWxldGhlYWsiLCJhIjoiY202MnBpM3R6MHc5czJpcHlybHBzNnRnNCJ9.7rfcscc9ABryDmhQZWdOWw";

function Map() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

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

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat(fixedLocation)
      .addTo(mapRef.current);

    const popup = new mapboxgl.Popup({ offset: 25 }).setText(
      "This is a generic popup message."
    );

    marker.setPopup(popup);
    marker.getElement().style.cursor = "pointer";
    marker.getElement().addEventListener("click", () => {
      popup.addTo(mapRef.current);
    });

    mapRef.current.on("load", () => {
      // Define Vancouver disaster zone
      const vancouverDisasterZone = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-123.14, 49.29],
              [-123.14, 49.26],
              [-123.1, 49.26],
              [-123.1, 49.29],
              [-123.14, 49.29],
            ],
          ],
        },
      };

      mapRef.current.addSource("vancouver-disaster-area", {
        type: "geojson",
        data: vancouverDisasterZone,
      });

      mapRef.current.addLayer({
        id: "disaster-layer",
        type: "fill",
        source: "vancouver-disaster-area",
        paint: {
          "fill-color": "#FF0000",
          "fill-opacity": 0.4,
        },
      });

      mapRef.current.addLayer({
        id: "disaster-outline",
        type: "line",
        source: "vancouver-disaster-area",
        paint: {
          "line-color": "#FF0000",
          "line-width": 2,
        },
      });

      if (userLocation) {
        mapRef.current.flyTo({
          center: userLocation,
          zoom: 14,
        });
      }
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [userLocation]);

  return (
    <>
      <div id="map-container" ref={mapContainerRef} />
      {locationError && (
        <div className="sidebar">Location error: {locationError}</div>
      )}
    </>
  );
}

export default Map;
