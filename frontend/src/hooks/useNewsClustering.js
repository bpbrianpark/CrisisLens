import { useState, useEffect, useCallback } from "react";

export const useNewsClustering = (newsLocations, newsArticlesForLocation, mapRef, mapLoaded) => {
  const [newsClusters, setNewsClusters] = useState([]);

  const clusterNewsLocations = (locations, zoom) => {
    const zoomFactor = 0.01 / Math.pow(2, zoom - 10);
    const clusters = [];

    locations.forEach((location) => {
      let added = false;
      for (const cluster of clusters) {
        const [lng, lat] = cluster.center;
        const distance = Math.sqrt(Math.pow(lng - location.longitude, 2) + Math.pow(lat - location.latitude, 2));

        if (distance <= zoomFactor) {
          cluster.locations.push(location);
          cluster.center = [
            (lng * cluster.locations.length + location.longitude) / (cluster.locations.length + 1),
            (lat * cluster.locations.length + location.latitude) / (cluster.locations.length + 1),
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
  };

  const updateNewsClusters = useCallback(() => {
    console.log("updateNewsClusters called. newsLocations:", newsLocations);
    if (!mapRef.current || !mapLoaded || Object.keys(newsLocations).length === 0) return;

    const zoom = mapRef.current.getZoom();
    
    // Convert newsLocations object to array of location objects (like fireData)
    const newsLocationData = Object.entries(newsLocations).map(([name, coordinates]) => ({
      name,
      longitude: coordinates[0],
      latitude: coordinates[1],
      articles: newsArticlesForLocation[name] || []
    }));
    
    console.log("News Location Data:", newsLocationData);
    newsLocationData.forEach(location => {
      console.log(`News Location: ${location.name} at ${location.longitude}, ${location.latitude}`);
    });
    
    const clusters = clusterNewsLocations(newsLocationData, zoom);
    console.log("News Clusters:", clusters);
    clusters.forEach(cluster => {
      console.log(` Cluster at ${cluster.center[0]}, ${cluster.center[1]}:`, cluster.locations);
    });
    
    setNewsClusters(clusters);
  }, [mapLoaded, newsLocations, newsArticlesForLocation, mapRef]);

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
