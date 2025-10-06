import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import StreamPlayer from "../livepeer/StreamPlayer";
import FireMarker from "./FireMarker";
import NewsMarker from "./NewsMarker";
import { newsData } from "./newsData";
import NewsModal from "../NewsModal";
import * as turf from "@turf/turf";
import VODPlayer from "../livepeer/VODPlayer";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

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
  const [newsCache, setNewsCache] = useState({});
  const [isNewsFetching, setIsNewsFetching] = useState(false);

  const openModal = (news) => {
    setSelectedNews(news);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNews(null);
    setIsModalOpen(false);
  };

  const processFireData = (livestreams, assets) => {
    const activeLivestreams = livestreams
      .filter((stream) => 
        stream.status !== "finished" && 
        stream.longitude != null && 
        stream.latitude != null &&
        typeof stream.longitude === 'number' &&
        typeof stream.latitude === 'number'
      )
      .map((stream) => ({
        ...stream,
        isLiveStream: true,
        isOnGoing: true,
      }));

    const readyAssets = assets
      .filter((asset) => 
        asset.status === "ready" && 
        asset.longitude != null && 
        asset.latitude != null &&
        typeof asset.longitude === 'number' &&
        typeof asset.latitude === 'number'
      )
      .map((asset) => ({
        ...asset,
        isLiveStream: false,
        isOnGoing: false,
      }));

    const fires = [...activeLivestreams, ...readyAssets];
    setFireData(fires);
    setFireLocations(fires.map((fire) => [fire.longitude, fire.latitude]));
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
  
      // Create a custom container for the logo and geocoder
      const topLeftContainer = document.createElement("div");
      topLeftContainer.className = "custom-geocoder-container";
      topLeftContainer.style.display = "flex";
      topLeftContainer.style.alignItems = "center";
      topLeftContainer.style.gap = "4px";
      topLeftContainer.style.paddingLeft = "12px";
  
      // Add the logo to the container
      const logo = document.createElement("img");
      logo.src = "https://i.imgur.com/soVndGN.png"; // Update with the actual path
      logo.alt = "CrisisLens Logo";
      logo.style.width = "40px";
      logo.style.height = "40px";
  
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

    let livestreamsData = [];
    let assetsData = [];

    const updateFireData = () => {
      processFireData(livestreamsData, assetsData);
    };

    // Set up real-time listeners for livestreams
    const livestreamsUnsubscribe = onSnapshot(
      collection(db, "livestreams"),
      (snapshot) => {
        livestreamsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          longitude: doc.data().longitude,
          latitude: doc.data().latitude,
          ...doc.data(),
        }));
        updateFireData();
      },
      (error) => {
        console.error("Error listening to livestreams:", error);
      }
    );

    // Set up real-time listeners for assets
    const assetsUnsubscribe = onSnapshot(
      collection(db, "assets"),
      (snapshot) => {
        assetsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          longitude: doc.data().longitude,
          latitude: doc.data().latitude,
          ...doc.data(),
        }));
        updateFireData();
      },
      (error) => {
        console.error("Error listening to assets:", error);
      }
    );

    // Clean up listeners on unmount
    return () => {
      livestreamsUnsubscribe();
      assetsUnsubscribe();
    };
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
    if (!mapRef.current || fireData.length === 0) return;

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
    if (!locationKeywords.size || isNewsFetching) return;

    // Check if we already have all the articles we need
    const neededLocations = Array.from(locationKeywords).filter(location => !newsCache[location]);
    if (neededLocations.length === 0) {
      // All articles are already cached, just update the display
      const articlesMap = {};
      for (const location of locationKeywords) {
        articlesMap[location] = newsCache[location];
      }
      setNewsArticlesForLocation(articlesMap);
      setNewsLoaded(true);
      return;
    }

    setIsNewsFetching(true);
    const articlesMap = { ...newsArticlesForLocation };

    for (const location of locationKeywords) {
      // Check if we already have articles for this location
      if (newsCache[location]) {
        console.log(`📦 Using cached news for location: ${location}`);
        articlesMap[location] = newsCache[location];
        continue;
      }

      // Only fetch if not already cached
      const articles = await fetchNewsForLocation(location);
      if (articles) {
        articlesMap[location] = articles;
        // Cache the articles
        setNewsCache(prev => ({ ...prev, [location]: articles }));
      }
    }

    setNewsArticlesForLocation(articlesMap);
    setNewsLoaded(true);
    setIsNewsFetching(false);
  };

  const fetchNewsForLocation = async (location) => {
    try {
      console.log(`🔍 Fetching news for location: ${location}`);
      const query = encodeURIComponent(`${location} + (fire OR wildfire OR burning)`);

      const response = await fetch(
        `https://api.thenewsapi.com/v1/news/all?` +
          `api_token=${NEWS_API_KEY}&` +
          `search=${query}&` +
          `limit=3&` +
          `sort=published_at`
      );

      const data = await response.json();

      if (data && data.data && data.data.length > 0) {
        console.log(`News articles for ${location}:`, data.data);
        return data.data;
      } else {
        console.warn(`No articles returned from API for ${location}. Returning random fallback articles.`);
      }
    } catch (error) {
      console.error(`Error fetching news for ${location}:`, error);
    }

    // Return 1–3 random articles from newsData.data as fallback
    const fallbackArticles = newsData.data;
    const randomArticles = fallbackArticles.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);

    console.log(`Random fallback articles for ${location}:`, randomArticles);
    return randomArticles;
  };

  useEffect(() => {
    if (locationKeywords.size > 0) {
      updateNewsLocations();
    }
  }, [locationKeywords]);

  useEffect(() => {
    if (newsLocations && Object.keys(newsLocations).length > 0 && !isNewsFetching) {
      updateNewsArticles();
    }
  }, [newsLocations, isNewsFetching]);

  useEffect(() => {
    if (fireData.length > 0) {
      updateClusters();
    }
  }, [fireData]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || fireData.length < 1) return;

    // Remove existing box layer and source if they exist
    if (mapRef.current.getLayer("bbox-layer")) {
      mapRef.current.removeLayer("bbox-layer");
    }
    if (mapRef.current.getSource("bbox-source")) {
      mapRef.current.removeSource("bbox-source");
    }

    // Create a Feature Collection from fire points
    const points = turf.featureCollection(fireData.map((fire) => turf.point([fire.longitude, fire.latitude])));

    // Check the number of points
    if (points.features.length === 1) {
      // If there's only one point, create a circle around it
      const singleFire = points.features[0];
      const circle = turf.circle(singleFire.geometry.coordinates, 0.2, {
        steps: 64,
        units: "kilometers",
      });

      // Add the source and layer for the circle
      if (!mapRef.current.getSource("bbox-source")) {
        mapRef.current.addSource("bbox-source", {
          type: "geojson",
          data: circle,
        });
      } else {
        mapRef.current.getSource("bbox-source").setData(circle);
      }

      if (!mapRef.current.getLayer("bbox-layer")) {
        mapRef.current.addLayer({
          id: "bbox-layer",
          type: "fill",
          source: "bbox-source",
          layout: {},
          paint: {
            "fill-color": "#00ff00",
            "fill-opacity": 0.2,
            "fill-outline-color": "#008000",
          },
        });
      }
    } else {
      // Group points into clusters based on distance
      const clusters = [];
      points.features.forEach((point) => {
        let addedToCluster = false;
        for (const cluster of clusters) {
          const distance = turf.distance(cluster[0].geometry.coordinates, point.geometry.coordinates, {
            units: "kilometers",
          });
          if (distance <= 3) {
            cluster.push(point);
            addedToCluster = true;
            break;
          }
        }
        if (!addedToCluster) {
          clusters.push([point]);
        }
      });

      // Process each cluster
      clusters.forEach((cluster, index) => {
        let geometry;
        if (cluster.length === 1) {
          // Create a circle for a single point cluster
          geometry = turf.circle(cluster[0].geometry.coordinates, 0.2, {
            steps: 64,
            units: "kilometers",
          });
        } else {
          // Calculate the convex hull for multiple points
          const clusterPoints = turf.featureCollection(cluster);
          const hull = turf.convex(clusterPoints);
          
          // Check if convex hull was successfully created
          if (hull) {
            geometry = turf.buffer(hull, 0.2, { units: "kilometers" });
          } else {
            // Fallback: create a circle around the centroid if convex hull fails
            const centroid = turf.centroid(clusterPoints);
            geometry = turf.circle(centroid.geometry.coordinates, 0.2, {
              steps: 64,
              units: "kilometers",
            });
          }
        }

        // Add the source and layer to the map for each cluster
        const sourceId = `bbox-source-${index}`;
        const layerId = `bbox-layer-${index}`;

        if (!mapRef.current.getSource(sourceId)) {
          mapRef.current.addSource(sourceId, {
            type: "geojson",
            data: geometry,
          });
        } else {
          mapRef.current.getSource(sourceId).setData(geometry);
        }

        if (!mapRef.current.getLayer(layerId)) {
          mapRef.current.addLayer({
            id: layerId,
            type: "fill",
            source: sourceId,
            layout: {},
            paint: {
              "fill-color": "#00ff00",
              "fill-opacity": 0.2,
              "fill-outline-color": "#008000",
            },
          });
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
            width: "100vw",
            height: "100vh",
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
