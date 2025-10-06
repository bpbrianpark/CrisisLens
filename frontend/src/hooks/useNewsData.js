import { useState, useEffect } from "react";
import { newsData } from "../components/mapbox/newsData";

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;

export const useNewsData = (fireLocations) => {
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [locationKeywords, setLocationKeywords] = useState(new Set());
  const [newsLocations, setNewsLocations] = useState({});
  const [newsArticlesForLocation, setNewsArticlesForLocation] = useState({});
  const [newsCache, setNewsCache] = useState({});
  const [isNewsFetching, setIsNewsFetching] = useState(false);

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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${
          import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
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

  const updateLocationKeywords = async () => {
    if (!fireLocations.length) return;

    const newKeywords = new Set();

    for (const [longitude, latitude] of fireLocations) {
      const locationNames = await getLocationName(longitude, latitude);
      locationNames.forEach((name) => newKeywords.add(name));
    }

    setLocationKeywords(newKeywords);
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

  useEffect(() => {
    if (fireLocations.length > 0) {
      updateLocationKeywords();
    }
  }, [fireLocations]);

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

  return {
    newsLoaded,
    newsLocations,
    newsArticlesForLocation,
  };
};
