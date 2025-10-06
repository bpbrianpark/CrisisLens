import { useState, useEffect, useCallback } from "react";

export const useFireClustering = (fireData, mapRef) => {
  const [fireClusters, setFireClusters] = useState([]);

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

  const updateClusters = useCallback(() => {
    if (!mapRef.current || fireData.length === 0) return;

    const zoom = mapRef.current.getZoom();
    const clusters = clusterFires(fireData, zoom);
    setFireClusters(clusters);
  }, [fireData, mapRef]);

  useEffect(() => {
    if (fireData.length > 0) {
      updateClusters();
    }
  }, [fireData, updateClusters]);

  return {
    fireClusters,
    updateClusters,
  };
};
