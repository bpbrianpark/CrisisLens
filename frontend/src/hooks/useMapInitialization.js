import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export const useMapInitialization = () => {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [userLocation, setUserLocation] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const initializeMap = (center) => {
    const savedTheme = localStorage.getItem("crisisLensMapTheme") || "day";
    const styleUrl = savedTheme === "night"
      ? "mapbox://styles/mapbox/navigation-night-v1"
      : "mapbox://styles/mapbox/navigation-day-v1";

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center,
      zoom: 11,
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
    });

    // Create a custom container for the logo and geocoder
    const topLeftContainer = document.createElement("div");
    topLeftContainer.className = "custom-geocoder-container";
    topLeftContainer.style.display = "flex";
    topLeftContainer.style.alignItems = "center";
    topLeftContainer.style.gap = "12px";
    topLeftContainer.style.paddingLeft = "16px";
    topLeftContainer.style.paddingTop = "16px";

    // Add the logo to the container
    const logo = document.createElement("img");
    logo.src = "https://i.imgur.com/soVndGN.png";
    logo.alt = "CrisisLens Logo";
    logo.style.width = "44px";
    logo.style.height = "44px";
    logo.style.borderRadius = "12px";
    logo.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";

    // Append the logo and geocoder to the container
    topLeftContainer.appendChild(logo);
    const geocoderEl = geocoder.onAdd(mapRef.current);
    topLeftContainer.appendChild(geocoderEl);

    // Add the container to the top-left of the map
    const topLeftControlGroup = mapRef.current.getContainer().querySelector(".mapboxgl-ctrl-top-left");
    if (topLeftControlGroup) {
      // Remove any existing custom-geocoder-container to avoid duplicates
      const existingContainer = topLeftControlGroup.querySelector(".custom-geocoder-container");
      if (existingContainer) {
        existingContainer.remove();
      }
      topLeftControlGroup.appendChild(topLeftContainer);
    }

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });

    // Make the geolocate button top-most and functional
    mapRef.current.addControl(geolocateControl, "top-right");

    const geolocateButton = document.querySelector(".mapboxgl-ctrl-geolocate");
    if (geolocateButton) {
      geolocateButton.style.zIndex = "1000";
    }

    geolocateControl.on("geolocate", (e) => {
      try {
        let longitude, latitude;
        
        if (e.target.options && e.target.options.geolocation) {
          const geolocation = e.target.options.geolocation;
          if (geolocation.coords) {
            longitude = geolocation.coords.longitude;
            latitude = geolocation.coords.latitude;
          }
        }
        
        if (!longitude || !latitude) {
          const { longitude: lng, latitude: lat } = e.target._lastKnownPosition.coords;
          longitude = lng;
          latitude = lat;
        }
        
        setUserLocation([longitude, latitude]);
        mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
      } catch (error) {
        console.error("Error handling geolocate event:", error);
      }
    });

    mapRef.current.on("load", () => {
      setMapLoaded(true);
    });

    return mapRef.current;
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
          initializeMap([longitude, latitude]);
        },
        (error) => {
          console.error("Error getting user location:", error);
          initializeMap([userLocation[0] || -123.1207, userLocation[1] || 49.2827]);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      initializeMap([userLocation[0] || -123.1207, userLocation[1] || 49.2827]);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  return {
    mapRef,
    mapContainerRef,
    userLocation,
    mapLoaded,
    setMapLoaded,
  };
};
