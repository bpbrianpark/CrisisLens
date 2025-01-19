import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import FireMarker from "./FireMarker";

mapboxgl.accessToken = "pk.eyJ1IjoiYWxldGhlYWsiLCJhIjoiY202MnhkcXB5MTI3ZzJrbzhyeTJ4NXdnaCJ9.eSFNm5gmF2-oVfqyZ3RZ3Q";

function Map() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [fireClusters, setFireClusters] = useState([]);
  const [fireData, setFireData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const isFetching = useRef(false);

  const fetchFireData = async () => {
    if (isFetching.current) return;

    isFetching.current = true;
    try {
      const querySnapshot = await getDocs(collection(db, "videos"));
      const fires = querySnapshot.docs.map((doc) => ({
        longitude: doc.data().longitude,
        latitude: doc.data().latitude,
        ...doc.data(),
      }));
      setFireData(fires);
    } catch (error) {
      console.error("Error fetching fire data:", error);
    } finally {
      isFetching.current = false;
    }
  };

  const clusterFires = (locations, zoom) => {
    const zoomFactor = 0.01 / Math.pow(2, zoom - 10);
    const clusters = [];

    locations.forEach((location) => {
      let added = false;
      for (const cluster of clusters) {
        const [lng, lat] = cluster.center;
        const distance = Math.sqrt(Math.pow(lng - location.longitude, 2) + Math.pow(lat - location.latitude, 2));

        if (distance <= zoomFactor) {
          cluster.fires.push(location);
          cluster.center = [
            (lng * cluster.fires.length + location.longitude) / (cluster.fires.length + 1),
            (lat * cluster.fires.length + location.latitude) / (cluster.fires.length + 1),
          ];
          added = true;
          break;
        }
      }

      if (!added) {
        clusters.push({
          center: [location.longitude, location.latitude],
          fires: [location],
        });
      }
    });

    return clusters;
  };

  const updateClusters = () => {
    if (!mapRef.current) return;

    if (fireData.length === 0) {
      fetchFireData();
    }

    if (fireData.length === 0) return;

    const zoom = mapRef.current.getZoom();
    const clusters = clusterFires(fireData, zoom);
    setFireClusters(clusters);
  };

  useEffect(() => {
    const initializeMap = (center) => {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/navigation-night-v1",
        center,
        zoom: 11,
      });

      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
      });

      mapRef.current.addControl(geocoder, "top-left");

      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      });

      mapRef.current.addControl(geolocateControl);

      mapRef.current.on("load", () => {
        fetchFireData();
      });

      let debounceTimeout = null;
      mapRef.current.on("moveend", () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          updateClusters();
        }, 300);
      });
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
          initializeMap([longitude, latitude]);
        },
        (error) => {
          console.error("Error getting user location:", error);
          initializeMap([userLocation[0] ?? -123.1207, userLocation[1] ?? 49.2827]);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      initializeMap([userLocation[0] ?? -123.1207, userLocation[1] ?? 49.2827]);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (fireData.length > 0) {
      updateClusters();
    }
  }, [fireData]);

  const handleMarkerClick = (fires) => {
    alert(`This cluster contains ${fires.length} fires:\n${fires.map((f) => f.videoId).join(", ")}`);
  };

  return (
    <>
      <div id="map-container" ref={mapContainerRef} style={{ height: "100vh" }} />
      {fireClusters.map((cluster, index) => (
        <FireMarker
          key={index}
          map={mapRef.current}
          location={cluster.center}
          count={cluster.fires.length}
          fires={cluster.fires}
          onClick={handleMarkerClick}
        />
      ))}
    </>
  );
}

export default Map;
