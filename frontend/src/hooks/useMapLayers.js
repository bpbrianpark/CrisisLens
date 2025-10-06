import { useEffect } from "react";
import * as turf from "@turf/turf";

export const useMapLayers = (fireData, mapRef, mapLoaded) => {
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || fireData.length < 1) return;

    // Remove existing box layer and source if they exist
    if (mapRef.current.getLayer("bbox-layer")) {
      mapRef.current.removeLayer("bbox-layer");
    }
    if (mapRef.current.getSource("bbox-source")) {
      mapRef.current.removeSource("bbox-source");
    }

    // Create a Feature Collection from fire points
    const points = turf.featureCollection(fireData.map((fire) => turf.point([fire.longitude, fire.latitude])));

    // Check the number of points
    if (points.features.length === 1) {
      // If there's only one point, create a circle around it
      const singleFire = points.features[0];
      const circle = turf.circle(singleFire.geometry.coordinates, 0.2, {
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
      // Group points into clusters based on distance
      const clusters = [];
      points.features.forEach((point) => {
        let addedToCluster = false;
        for (const cluster of clusters) {
          const distance = turf.distance(cluster[0].geometry.coordinates, point.geometry.coordinates, {
            units: "kilometers",
          });
          if (distance <= 3) {
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
          geometry = turf.circle(cluster[0].geometry.coordinates, 0.2, {
            steps: 64,
            units: "kilometers",
          });
        } else {
          // Calculate the convex hull for multiple points
          const clusterPoints = turf.featureCollection(cluster);
          const hull = turf.convex(clusterPoints);
          
          // Check if convex hull was successfully created
          if (hull) {
            geometry = turf.buffer(hull, 0.2, { units: "kilometers" });
          } else {
            // Fallback: create a circle around the centroid if convex hull fails
            const centroid = turf.centroid(clusterPoints);
            geometry = turf.circle(centroid.geometry.coordinates, 0.2, {
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
  }, [fireData, mapLoaded]);
};
