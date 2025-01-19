import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import StreamPlayer from "../livepeer/StreamPlayer";
import ReactDOM from 'react-dom';

const PLAYBACK_ID = "14000dstm36cexor";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWxldGhlYWsiLCJhIjoiY202MnhkcXB5MTI3ZzJrbzhyeTJ4NXdnaCJ9.eSFNm5gmF2-oVfqyZ3RZ3Q";

function Map() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const markerRef = useRef(null);
  const popupRef = useRef(null);
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

    popupRef.current = new mapboxgl.Popup({ 
      offset: 25, 
      maxWidth: '400px',
      closeOnClick: false
    });

    const updatePopupContent = () => {
      popupRef.current.setHTML(`
        <div style="min-width: 320px;">
          <h3 style="margin-bottom: 10px;">Live Emergency Stream</h3>
          <div id="stream-container"></div>
        </div>
      `);
    };

    markerRef.current.getElement().style.cursor = "pointer";
    markerRef.current.getElement().addEventListener("click", () => {
      setShowStream(true);
      updatePopupContent();
      popupRef.current.setLngLat(fixedLocation).addTo(mapRef.current);
    });

    popupRef.current.on('close', () => {
      setShowStream(false);
    });

    popupRef.current.on('open', () => {
      const container = document.getElementById('stream-container');
      if (container && showStream) {
        const playbackId = PLAYBACK_ID;
        ReactDOM.render(<StreamPlayer playbackId={playbackId} />, container);
      }
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
      if (popupRef.current) popupRef.current.remove();
      if (markerRef.current) markerRef.current.remove();
      mapRef.current?.remove();
    };
  }, [userLocation]);

  useEffect(() => {
    if (showStream && popupRef.current) {
      const container = document.getElementById('stream-container');
      if (container) {
        const playbackId = PLAYBACK_ID;
        ReactDOM.render(<StreamPlayer playbackId={playbackId} />, container);
      }
    }
  }, [showStream]);

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
