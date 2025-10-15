import { useState, useEffect } from "react";
import { newsData } from "../components/mapbox/newsData";
import { CRISIS_BY_ID } from "../constants/crisisTypes";

const NEWSDATA_API_KEY = import.meta.env.VITE_NEWS_DATA_API_KEY;

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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place,locality,district,region,country&access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox geocoding failed: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.features && data.features.length > 0) {
        // Extract city, state, country from Mapbox response
        let city = null;
        let state = null;
        let country = null;

        data.features.forEach(feature => {
          const placeType = feature.place_type[0];
          const placeName = feature.text;
          
          if (placeType === 'place' || placeType === 'locality') {
            city = placeName;
          } else if (placeType === 'district' || placeType === 'region') {
            state = placeName;
          } else if (placeType === 'country') {
            country = placeName;
          }
        });

        // Return in same format as OpenStreetMap
        if (city && state) {
          return `${city}, ${state}`;
        } else if (city && country) {
          return `${city}, ${country}`;
        } else if (city) {
          return city;
        } else if (state && country) {
          return `${state}, ${country}`;
        } else if (state) {
          return state;
        } else if (country) {
          return country;
        }
      }

      return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    } catch (error) {
      console.error("Mapbox geocoding failed:", error);
      return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
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
      const query = encodeURIComponent(`${location} AND ${crisisKeywords}`);
      console.log("Query:", query);

      const response = await fetch(
        `https://newsdata.io/api/1/news?` +
        `apikey=${NEWSDATA_API_KEY}&` +
        `qInTitle=${query}&` +
        `language=en&` +
        `size=3`
      );

      const data = await response.json();

      if (data && data.results && data.results.length > 0) {
        return data.results;
      } else {
        console.warn(`No articles returned from NewsData.io for ${location}. Returning random fallback articles.`);
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
    if (!crisisData.length) {
      return;
    }

    const locationCrisisPairs = new Set();
    const locationToCrisisMap = {};

    const locationPromises = crisisData.map(async (crisis) => {
      const locationName = await getLocationName(crisis.longitude, crisis.latitude);
      return { locationName, crisis: crisis.crisis };
    });

    const results = await Promise.all(locationPromises);
    
    results.forEach(({ locationName, crisis }) => {
      if (locationName) {
        // Create unique key for location + crisis type combination
        const locationCrisisKey = `${locationName}|${crisis}`;
        locationCrisisPairs.add(locationCrisisKey);
        locationToCrisisMap[locationCrisisKey] = { location: locationName, crisis };
      }
    });

    setLocationKeywords(locationCrisisPairs);
    setLocationToCrisisType(locationToCrisisMap);
  };

  const updateNewsLocations = async () => {
    if (!locationKeywords.size) return;

    const locationsMap = {};

    // Extract unique location names from location-crisis pairs
    const uniqueLocations = new Set();
    for (const locationCrisisKey of locationKeywords) {
      const { location } = locationToCrisisType[locationCrisisKey];
      uniqueLocations.add(location);
    }

    for (const locationName of uniqueLocations) {
      const coordinates = await getCoordinatesForLocation(locationName);
      if (coordinates) {
        locationsMap[locationName] = coordinates;
      }
    }

    setNewsLocations(locationsMap);
  };

  const updateNewsArticles = async () => {
    if (!locationKeywords.size || isNewsFetching) {
      return;
    }

    // Check if we already have all the articles we need
    const neededLocations = Array.from(locationKeywords).filter(location => !newsCache[location]);
    if (neededLocations.length === 0) {
      console.log('📦 All articles already cached, using cached data');
      // All articles are already cached, just update the display
      const articlesMap = {};
      for (const locationCrisisKey of locationKeywords) {
        const cachedArticles = newsCache[locationCrisisKey];
        articlesMap[locationCrisisKey] = cachedArticles;
      }
      setNewsArticlesForLocation(articlesMap);
      setNewsLoaded(true);
      return;
    }

    setIsNewsFetching(true);
    const articlesMap = { ...newsArticlesForLocation };

    for (const locationCrisisKey of locationKeywords) {
      // Check if we already have articles for this location-crisis combination
      if (newsCache[locationCrisisKey]) {
        const cachedArticles = newsCache[locationCrisisKey];
        console.log(`📦 Using cached news for: ${locationCrisisKey} (${cachedArticles.length} articles)`);
        articlesMap[locationCrisisKey] = cachedArticles;
        continue;
      }

      // Only fetch if not already cached
      const { location, crisis } = locationToCrisisType[locationCrisisKey];
      const articles = await fetchNewsForLocation(location, crisis);
      if (articles) {
        // Add crisis type info to each article
        const articlesWithCrisisType = articles.map(article => ({
          ...article,
          crisisType: crisis,
          location: location,
          locationCrisisKey: locationCrisisKey
        }));
        articlesMap[locationCrisisKey] = articlesWithCrisisType;
        // Cache the articles
        setNewsCache(prev => ({ ...prev, [locationCrisisKey]: articlesWithCrisisType }));
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
