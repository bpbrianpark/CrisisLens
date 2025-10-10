import { useState, useEffect } from "react";
import { newsData } from "../components/mapbox/newsData";
import { CRISIS_BY_ID } from "../constants/crisisTypes";

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

export const useNewsData = (crisisData) => {
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [locationKeywords, setLocationKeywords] = useState(new Set());
  const [newsLocations, setNewsLocations] = useState({});
  const [newsArticlesForLocation, setNewsArticlesForLocation] = useState({});
  const [newsCache, setNewsCache] = useState(() => {
    try {
      const saved = localStorage.getItem('newsCache');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load news cache from localStorage:', error);
      return {};
    }
  });
  const [isNewsFetching, setIsNewsFetching] = useState(false);
  const [locationToCrisisType, setLocationToCrisisType] = useState({});

  // Save cache to localStorage whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem('newsCache', JSON.stringify(newsCache));
    } catch (error) {
      console.warn('Failed to save news cache to localStorage:', error);
    }
  }, [newsCache]);

  const getLocationName = async (longitude, latitude) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=neighborhood,locality,place&access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`
      );
      const data = await response.json();
      return data.features.map((feature) => feature.text) || [];
    } catch (error) {
      console.error("Error fetching location name:", error);
      return [];
    }
  };

  const getCoordinatesForLocation = async (locationName) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
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

  const getCrisisKeywords = (crisisTypeId) => {
    const crisisType = CRISIS_BY_ID[crisisTypeId];
    if (crisisType && crisisType.aliases) {
      // Use the first alias for the search query for now
      const keywords = crisisType.aliases[0];
      return keywords || crisisType.label;
    }
    return "emergency OR crisis";
  };

  const fetchNewsForLocation = async (location, crisisTypeId) => {
    try {
      console.log(`🔍 Fetching news for location: ${location} with crisis type: ${crisisTypeId}`);
      
      const crisisKeywords = getCrisisKeywords(crisisTypeId);
      const query = encodeURIComponent(`${location} (${crisisKeywords})`);

      const response = await fetch(
        `https://api.thenewsapi.com/v1/news/all?` +
        `api_token=${NEWS_API_KEY}&` +
        `search=${query}&` +
        `limit=3&` +
        `sort=published_at`
      );

      const data = await response.json();

      if (data && data.data && data.data.length > 0) {
        console.log(`📰 News articles for ${location}:`, data.data);
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

  const updateLocationKeywords = async () => {
    if (!crisisData.length) return;

    const newKeywords = new Set();
    const locationToCrisisMap = {};

    for (const crisis of crisisData) {
      const locationNames = await getLocationName(crisis.longitude, crisis.latitude);
      locationNames.forEach((name) => {
        newKeywords.add(name);
        // Map each location name to its crisis type
        locationToCrisisMap[name] = crisis.crisis;
      });
    }

    setLocationKeywords(newKeywords);
    setLocationToCrisisType(locationToCrisisMap);
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
      const crisisTypeId = locationToCrisisType[location];
      const articles = await fetchNewsForLocation(location, crisisTypeId);
      if (articles) {
        // Add crisis type info to each article
        const articlesWithCrisisType = articles.map(article => ({
          ...article,
          crisisType: crisisTypeId,
          location: location
        }));
        articlesMap[location] = articlesWithCrisisType;
        // Cache the articles
        setNewsCache(prev => ({ ...prev, [location]: articlesWithCrisisType }));
      }
    }

    setNewsArticlesForLocation(articlesMap);
    setNewsLoaded(true);
    setIsNewsFetching(false);
  };

  useEffect(() => {
    if (crisisData.length > 0) {
      updateLocationKeywords();
    }
  }, [crisisData]);

  useEffect(() => {
    if (locationKeywords.size > 0) {
      updateNewsLocations();
    }
  }, [locationKeywords]);

  useEffect(() => {
    const locCount = Object.keys(newsLocations).length;
    if (newsLocations && locCount > 0 && !isNewsFetching) {
      updateNewsArticles();
    }
  }, [newsLocations, isNewsFetching, locationKeywords, locationToCrisisType]);

  return {
    newsLoaded,
    newsLocations,
    newsArticlesForLocation,
  };
};
