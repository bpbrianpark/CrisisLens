import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import FireMarker from "./FireMarker";
import NewsMarker from "./NewsMarker";
import { newsData } from "./newsData";
import NewsModal from "../NewsModal";

mapboxgl.accessToken = "pk.eyJ1IjoiYWxldGhlYWsiLCJhIjoiY202MnhkcXB5MTI3ZzJrbzhyeTJ4NXdnaCJ9.eSFNm5gmF2-oVfqyZ3RZ3Q";

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

function Map() {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [fireLocations, setFireLocations] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [locationKeywords, setLocationKeywords] = useState(new Set());
  const [newsLocations, setNewsLocations] = useState({});
  const [newsArticlesForLocation, setNewsArticlesForLocation] = useState({});
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (news) => {
    setSelectedNews(news);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNews(null);
    setIsModalOpen(false);
  };

  const fetchFireLocations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "videos"));
      const locations = [];

      querySnapshot.forEach((doc) => {
        const { latitude, longitude } = doc.data();
        if (latitude && longitude) {
          locations.push([longitude, latitude]);
        }
      });
      console.log(locations);
      setFireLocations(locations);
    } catch (error) {
      console.error("Error fetching video data:", error);
    }
  };

  const getLocationName = async (longitude, latitude) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=neighborhood,locality,place&access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      const features = data.features || [];
      const locationNames = features.map((feature) => feature.text).filter(Boolean);

      return locationNames;
    } catch (error) {
      console.error("Error fetching location name:", error);
      return [];
    }
  };

  const updateLocationKeywords = async () => {
    if (!fireLocations.length) return;

    const newKeywords = new Set();

    for (const [longitude, latitude] of fireLocations) {
      const locationNames = await getLocationName(longitude, latitude);
      locationNames.forEach((name) => newKeywords.add(name));
    }

    setLocationKeywords(newKeywords);
    console.log("Location Keywords:", Array.from(newKeywords));
  };

  const fetchNewsForLocation = async (location) => {
    try {
      const query = encodeURIComponent(`${location} + (fire OR wildfire OR burning)`);
      // const response = await fetch(
      //   `https://api.thenewsapi.com/v1/news/all?` +
      //     `api_token=${NEWS_API_KEY}&` +
      //     `search=${query}&` +
      //     `limit=3&` +
      //     `sort=published_at`
      // );

      // const data = await response.json();
      // console.log(`News articles for ${location}:`, data);
      // return data.data || [];
      // return response.data || [];

      if (location == "Vancouver") {
        return newsData.Vancouver.data;
      } else {
        return newsData.UBC.data;
      }
    } catch (error) {
      console.error(`Error fetching news for ${location}:`, error);
      return [];
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
    console.log("News articles map:", articlesMap);
  };

  const getCoordinatesForLocation = async (locationName) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?` +
          `access_token=${mapboxgl.accessToken}&` +
          `types=place,locality,neighborhood`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        console.log(`Coordinates for ${locationName}:`, { lng, lat });
        return [lng, lat];
      }
      return null;
    } catch (error) {
      console.error(`Error getting coordinates for ${locationName}:`, error);
      return null;
    }
  };

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
    console.log("News locations map:", locationsMap);
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

      setMapLoaded(true);
    });

    return () => {
      mapRef.current?.remove();
    };
  }, [userLocation]);

  useEffect(() => {
    if (mapLoaded) {
      fetchFireLocations();
    }
  }, [mapLoaded]);

  useEffect(() => {
    if (mapLoaded && fireLocations.length > 0) {
      updateLocationKeywords();
    }
  }, [mapLoaded, fireLocations]);

  useEffect(() => {
    if (locationKeywords.size > 0) {
      updateNewsArticles();
    }
  }, [locationKeywords]);

  useEffect(() => {
    if (locationKeywords.size > 0) {
      updateNewsLocations();
    }
  }, [locationKeywords]);

  return (
    <>
      <div id="map-container" ref={mapContainerRef} style={{ height: "100vh" }} />
      {locationError && <div className="sidebar">Location error: {locationError}</div>}
      {mapLoaded &&
        fireLocations.map((location, index) => <FireMarker key={index} map={mapRef.current} location={location} />)}
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
