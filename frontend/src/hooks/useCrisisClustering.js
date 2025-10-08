import { useState, useEffect, useCallback } from "react";

export const useCrisisClustering = (crisisData, mapRef) => {
  const [crisesClusters, setCrisesClusters] = useState([]);

  const clusterCrises = (locations, zoom) => {
    const zoomFactor = 0.01 / Math.pow(2, zoom - 10);
    const clusters = [];

    locations.forEach((location) => {
      let added = false;
      for (const cluster of clusters) {
        const [lng, lat] = cluster.center;
        const distance = Math.sqrt(Math.pow(lng - location.longitude, 2) + Math.pow(lat - location.latitude, 2));

        if (distance <= zoomFactor) {
          cluster.crises.push(location);
          cluster.center = [
            (lng * cluster.crises.length + location.longitude) / (cluster.crises.length + 1),
            (lat * cluster.crises.length + location.latitude) / (cluster.crises.length + 1),
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
  };

  const updateClusters = useCallback(() => {
    if (!mapRef.current || crisisData.length === 0) return;

    const zoom = mapRef.current.getZoom();
    const clusters = clusterCrises(crisisData, zoom);
    setCrisesClusters(clusters);
  }, [crisisData, mapRef]);

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
