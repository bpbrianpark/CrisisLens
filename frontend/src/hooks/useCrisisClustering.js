import { useState, useEffect, useCallback } from "react";

export const useCrisisClustering = (crisisData, mapRef) => {
  const [crisesClusters, setCrisesClusters] = useState([]);

  const clusterCrises = useCallback((locations) => {
    // Use screen distance instead of geographic distance
    // Cluster radius in pixels - increased for more aggressive clustering
    const clusterRadiusPixels = 120;
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
          cluster.crises.push(location);
          cluster.center = [
            (clusterLng * cluster.crises.length + location.longitude) / (cluster.crises.length + 1),
            (clusterLat * cluster.crises.length + location.latitude) / (cluster.crises.length + 1),
          ];
          added = true;
          break;
        }
      }

      if (!added) {
        clusters.push({
          center: [location.longitude, location.latitude],
          crises: [location],
        });
      }
    });

    return clusters;
  }, [mapRef]);

  const updateClusters = useCallback(() => {
    if (!mapRef.current || crisisData.length === 0) return;

    const clusters = clusterCrises(crisisData);
    setCrisesClusters(clusters);
  }, [crisisData, clusterCrises, mapRef]);

  useEffect(() => {
    if (crisisData.length > 0) {
      updateClusters();
    }
  }, [crisisData, updateClusters]);

  return {
    crisesClusters,
    updateClusters,
  };
};
