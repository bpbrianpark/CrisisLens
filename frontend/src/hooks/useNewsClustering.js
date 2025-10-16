import { useState, useEffect, useCallback } from "react";

export const useNewsClustering = (newsLocations, newsArticlesForLocation, mapRef, mapLoaded) => {
  const [newsClusters, setNewsClusters] = useState([]);

  const clusterNewsLocations = useCallback((locations) => {
    // Use screen distance instead of geographic distance
    // Cluster radius in pixels - increased for more aggressive clustering
    const clusterRadiusPixels = 100;
    const clusters = [];

    locations.forEach((location) => {
      let added = false;
      for (const cluster of clusters) {
        const [clusterLng, clusterLat] = cluster.center;
        
        // Convert both points to screen coordinates
        const clusterPoint = mapRef.current.project([clusterLng, clusterLat]);
        const locationPoint = mapRef.current.project([location.longitude, location.latitude]);
        
        // Calculate pixel distance
        const pixelDistance = Math.sqrt(
          Math.pow(clusterPoint.x - locationPoint.x, 2) + 
          Math.pow(clusterPoint.y - locationPoint.y, 2)
        );

        if (pixelDistance <= clusterRadiusPixels) {
          cluster.locations.push(location);
          cluster.center = [
            (clusterLng * cluster.locations.length + location.longitude) / (cluster.locations.length + 1),
            (clusterLat * cluster.locations.length + location.latitude) / (cluster.locations.length + 1),
          ];
          added = true;
          break;
        }
      }

      if (!added) {
        clusters.push({
          center: [location.longitude, location.latitude],
          locations: [location],
        });
      }
    });

    return clusters;
  }, [mapRef]);

  const updateNewsClusters = useCallback(() => {
    if (!mapRef.current || !mapLoaded || Object.keys(newsLocations).length === 0) return;
    
    // Convert newsLocations object to array of location objects (like fireData)
    const newsLocationData = Object.entries(newsLocations).map(([locationName, coordinates]) => {
      // Collect all articles for this location from all location-crisis pairs
      const allArticles = [];
      const crisisTypes = new Set();
      
      Object.entries(newsArticlesForLocation).forEach(([locationCrisisKey, articles]) => {
        if (locationCrisisKey.startsWith(locationName + '|')) {
          const crisisType = locationCrisisKey.split('|')[1];
          crisisTypes.add(crisisType);
          allArticles.push(...articles);
        }
      });
      
      return {
        name: locationName,
        longitude: coordinates[0],
        latitude: coordinates[1],
        articles: allArticles
      };
    });
    
    const clusters = clusterNewsLocations(newsLocationData);
    
    setNewsClusters(clusters);
  }, [mapLoaded, newsLocations, newsArticlesForLocation, clusterNewsLocations, mapRef]);

  useEffect(() => {
    if (Object.keys(newsLocations).length > 0) {
      updateNewsClusters();
    }
  }, [newsLocations, newsArticlesForLocation, updateNewsClusters]);

  return {
    newsClusters,
    updateNewsClusters,
  };
};
