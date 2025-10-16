import { useEffect, useCallback } from "react";
import * as turf from "@turf/turf";

export const useMapLayers = (fireData, mapRef, mapLoaded) => {
  const updateConvexHulls = useCallback(() => {
    if (!mapRef.current || !mapLoaded || fireData.length < 1) return;

    const zoom = mapRef.current.getZoom();

    // Remove existing box layer and source if they exist
    if (mapRef.current.getLayer("bbox-layer")) {
      mapRef.current.removeLayer("bbox-layer");
    }
    if (mapRef.current.getSource("bbox-source")) {
      mapRef.current.removeSource("bbox-source");
    }

    // Create a Feature Collection from fire points
    const points = turf.featureCollection(fireData.map((fire) => turf.point([fire.longitude, fire.latitude])));

    // Calculate zoom-responsive buffer size
    // At zoom 10: ~2km buffer, at zoom 15: ~0.1km buffer
    const bufferSize = Math.max(0.05, 2 / Math.pow(2, zoom - 10));

    // Check the number of points
    if (points.features.length === 1) {
      // If there's only one point, create a circle around it
      const singleCrisis = points.features[0];
      const circle = turf.circle(singleCrisis.geometry.coordinates, bufferSize, {
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
      // Group points into clusters based on screen distance
      const clusters = [];
      const clusterRadiusPixels = 200; // Increased for more aggressive convex hull clustering
      
      points.features.forEach((point) => {
        let addedToCluster = false;
        for (const cluster of clusters) {
          // Convert both points to screen coordinates
          const clusterPoint = mapRef.current.project(cluster[0].geometry.coordinates);
          const pointScreen = mapRef.current.project(point.geometry.coordinates);
          
          // Calculate pixel distance
          const pixelDistance = Math.sqrt(
            Math.pow(clusterPoint.x - pointScreen.x, 2) + 
            Math.pow(clusterPoint.y - pointScreen.y, 2)
          );
          
          if (pixelDistance <= clusterRadiusPixels) {
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
          geometry = turf.circle(cluster[0].geometry.coordinates, bufferSize, {
            steps: 64,
            units: "kilometers",
          });
        } else {
          // Calculate the convex hull for multiple points
          const clusterPoints = turf.featureCollection(cluster);
          const hull = turf.convex(clusterPoints);

          // Check if convex hull was successfully created
          if (hull) {
            geometry = turf.buffer(hull, bufferSize, { units: "kilometers" });
          } else {
            // Fallback: create a circle around the centroid if convex hull fails
            const centroid = turf.centroid(clusterPoints);
            geometry = turf.circle(centroid.geometry.coordinates, bufferSize, {
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
  }, [fireData, mapLoaded, mapRef]);

  // Update convex hulls when data changes
  useEffect(() => {
    updateConvexHulls();
  }, [updateConvexHulls]);

  // Return the update function so it can be called from Map component
  return { updateConvexHulls };
};
