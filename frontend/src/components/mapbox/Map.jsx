import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import StreamPlayer from "../livepeer/StreamPlayer";
import ReactDOM from "react-dom";
import FireMarker from "./FireMarker";
import NewsMarker from "./NewsMarker";
import { newsData } from "./newsData";
import NewsModal from "../NewsModal";
import * as turf from '@turf/turf';
import VODPlayer from "../livepeer/VODPlayer";

mapboxgl.accessToken = "pk.eyJ1IjoiYWxldGhlYWsiLCJhIjoiY202MnhkcXB5MTI3ZzJrbzhyeTJ4NXdnaCJ9.eSFNm5gmF2-oVfqyZ3RZ3Q";

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

function Map() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [userLocation, setUserLocation] = useState(null);
  const [showStream, setShowStream] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [fireClusters, setFireClusters] = useState([]);
  const [fireData, setFireData] = useState([]);
  const [fireLocations, setFireLocations] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [locationKeywords, setLocationKeywords] = useState(new Set());
  const [newsLocations, setNewsLocations] = useState({});
  const [newsArticlesForLocation, setNewsArticlesForLocation] = useState({});
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hullPolygon, setHullPolygon] = useState(null);

  const openModal = (news) => {
    setSelectedNews(news);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNews(null);
    setIsModalOpen(false);
  };

  const fetchFireData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "videos"));
      const fires = querySnapshot.docs.map((doc) => ({
        longitude: doc.data().longitude,
        latitude: doc.data().latitude,
        ...doc.data(),
      }));
      setFireData(fires);
      setFireLocations(fires.map((fire) => [fire.longitude, fire.latitude]));
    } catch (error) {
      console.error("Error fetching fire data:", error);
    }
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

      // Make the geolocate button top-most and functional
      mapRef.current.addControl(geolocateControl, "top-right");

      const geolocateButton = document.querySelector(".mapboxgl-ctrl-geolocate");
      if (geolocateButton) {
        geolocateButton.style.zIndex = "1000";
      }

      geolocateControl.on("geolocate", (e) => {
        const { longitude, latitude } = e.coords;
        setUserLocation([longitude, latitude]);
        mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
      });

      mapRef.current.on("load", () => {
        fetchFireData();
        setMapLoaded(true);
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

  useEffect(() => {
    if (!mapLoaded) return;

    // Initial fetch
    fetchFireData();

    // Set up polling every 5 seconds
    const intervalId = setInterval(() => {
      fetchFireData();
    }, 5000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [mapLoaded]);

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

  const updateLocationKeywords = async () => {
    if (!fireLocations.length) return;

    const newKeywords = new Set();

    for (const [longitude, latitude] of fireLocations) {
      const locationNames = await getLocationName(longitude, latitude);
      locationNames.forEach((name) => newKeywords.add(name));
    }

    setLocationKeywords(newKeywords);
  };

  const getLocationName = async (longitude, latitude) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=neighborhood,locality,place&access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      return data.features.map((feature) => feature.text) || [];
    } catch (error) {
      console.error("Error fetching location name:", error);
      return [];
    }
  };

  useEffect(() => {
    if (fireLocations.length > 0) {
      updateLocationKeywords();
    }
  }, [fireLocations]);

  const updateNewsLocations = async () => {
    if (!locationKeywords.size) return;

    const locationsMap = {};

    for (const locationName of locationKeywords) {
      const coordinates = await getCoordinatesForLocation(locationName);
      if (coordinates) {
        locationsMap[locationName] = coordinates;
      }
    }

    setNewsLocations(locationsMap);
  };

  const getCoordinatesForLocation = async (locationName) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${
          mapboxgl.accessToken
        }&types=place,locality,neighborhood`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features[0].center;
      }
      return null;
    } catch (error) {
      console.error(`Error getting coordinates for ${locationName}:`, error);
      return null;
    }
  };

  const updateNewsArticles = async () => {
    if (!locationKeywords.size) return;

    const articlesMap = {};

    for (const location of locationKeywords) {
      const articles = await fetchNewsForLocation(location);
      if (articles) {
        articlesMap[location] = articles;
      }
    }

    setNewsArticlesForLocation(articlesMap);
    setNewsLoaded(true);
  };

  const fetchNewsForLocation = async (location) => {
    try {
      if (location === "Vancouver") {
        return newsData.Vancouver.data;
      } else {
        return newsData.UBC.data;
      }
    } catch (error) {
      console.error(`Error fetching news for ${location}:`, error);
      return [];
    }
  };

  useEffect(() => {
    if (locationKeywords.size > 0) {
      updateNewsLocations();
    }
  }, [locationKeywords]);

  useEffect(() => {
    if (newsLocations && Object.keys(newsLocations).length > 0) {
      updateNewsArticles();
    }
  }, [newsLocations]);

  useEffect(() => {
    if (fireData.length > 0) {
      updateClusters();
    }
  }, [fireData]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || fireData.length < 1) return;

    // Remove existing box layer and source if they exist
    if (mapRef.current.getLayer('bbox-layer')) {
      mapRef.current.removeLayer('bbox-layer');
    }
    if (mapRef.current.getSource('bbox-source')) {
      mapRef.current.removeSource('bbox-source');
    }

    // Create a Feature Collection from fire points
    const points = turf.featureCollection(
      fireData.map(fire => turf.point([fire.longitude, fire.latitude]))
    );

    // Check the number of points
    if (points.features.length === 1) {
      // If there's only one point, create a circle around it
      const singleFire = points.features[0];
      const circle = turf.circle(singleFire.geometry.coordinates, 0.2, {
        steps: 64,
        units: 'kilometers'
      });

      // Add the source and layer for the circle
      mapRef.current.addSource('bbox-source', {
        'type': 'geojson',
        'data': circle
      });

      mapRef.current.addLayer({
        'id': 'bbox-layer',
        'type': 'fill',
        'source': 'bbox-source',
        'layout': {},
        'paint': {
          'fill-color': '#00ff00',
          'fill-opacity': 0.2,
          'fill-outline-color': '#008000'
        }
      });
    } else if (points.features.length < 3) {
      // If fewer than 3 points, create a bounding box
      const bbox = turf.bbox(points);
      const bboxPolygon = turf.bboxPolygon(bbox);

      // Add padding around the bounding box with rounded corners
      const bufferedBox = turf.buffer(bboxPolygon, 0.2, { 
        units: 'kilometers'
      });

      // Add the source and layer to the map
      mapRef.current.addSource('bbox-source', {
        'type': 'geojson',
        'data': bufferedBox
      });

      mapRef.current.addLayer({
        'id': 'bbox-layer',
        'type': 'fill',
        'source': 'bbox-source',
        'layout': {},
        'paint': {
          'fill-color': '#00ff00',
          'fill-opacity': 0.2,
          'fill-outline-color': '#008000'
        }
      });
    } else {
      // Calculate the convex hull that contains all points
      const hull = turf.convex(points);

      // Add padding around the hull with rounded corners
      const bufferedHull = turf.buffer(hull, 0.2, { 
        units: 'kilometers'
      });

      // Add the source and layer to the map
      mapRef.current.addSource('bbox-source', {
        'type': 'geojson',
        'data': bufferedHull
      });

      mapRef.current.addLayer({
        'id': 'bbox-layer',
        'type': 'fill',
        'source': 'bbox-source',
        'layout': {},
        'paint': {
          'fill-color': '#00ff00',
          'fill-opacity': 0.2,
          'fill-outline-color': '#008000'
        }
      });
    }
  }, [fireData, mapLoaded]);

  return (
    <>
      {showStream && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 99999,
          }}
        >
          {selectedCluster.fires[0].isLiveStream ? (
          // {selectedCluster.fires[0].isOngoing ? (
            <StreamPlayer selectedCluster={selectedCluster} onClose={() => setShowStream(false)} />
          ) : (
            <VODPlayer playbackId={selectedCluster.fires[0].playbackId} onClose={() => setShowStream(false)} />
          )}
        </div>
      )}
      <div id="map-container" ref={mapContainerRef} style={{ height: "100vh" }} />
      {mapLoaded &&
        fireClusters.map((cluster, index) => (
          <FireMarker
            key={index}
            map={mapRef.current}
            location={cluster.center}
            count={cluster.fires.length}
            fires={cluster.fires}
            onClick={() => {
              setSelectedCluster(cluster);
              console.log(cluster);
              setShowStream(true);
            }}
          />
        ))}
      {mapLoaded &&
        newsLoaded &&
        Object.entries(newsLocations).map(([locationName, coordinates], index) => (
          <NewsMarker
            key={index}
            map={mapRef.current}
            location={coordinates}
            news={newsArticlesForLocation[locationName]}
            onClick={(news) => openModal(news)}
          />
        ))}
      <NewsModal isOpen={isModalOpen} news={selectedNews} onClose={closeModal} />
    </>
  );
}

export default Map;
