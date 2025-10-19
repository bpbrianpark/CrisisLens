import { useEffect, useRef } from "react";
import * as turf from "@turf/turf";

// Crisis types that typically affect large geographic areas
const LARGE_SCALE_DISASTERS = new Set([
  "wildfire",
  "flood",
  "earthquake",
  "storm",
  "heat",
  "cold",
  "landslide",
  "avalanche",
  "tsunami",
  "volcano",
  "power_outage",
  "outbreak",
  "air_quality",
  "evacuation",
]);

// Determine if a crisis is large-scale
const isLargeScaleDisaster = (crisisType) => {
  return LARGE_SCALE_DISASTERS.has(crisisType);
};

export const useMapLayers = (fireData, mapRef, mapLoaded) => {
  const clusterLayersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded || fireData.length < 1) return;

    const map = mapRef.current;
    const currentZoom = map.getZoom();
    
    // Only show convex hulls when zoomed out (zoom level < 13)
    const shouldShowHulls = currentZoom < 13;

    // Clean up all existing cluster layers
    clusterLayersRef.current.forEach((id) => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id.replace("-layer", "-source"))) {
        map.removeSource(id.replace("-layer", "-source"));
      }
    });
    clusterLayersRef.current = [];

    // Also clean up old single bbox layer/source
    if (map.getLayer("bbox-layer")) {
      map.removeLayer("bbox-layer");
    }
    if (map.getSource("bbox-source")) {
      map.removeSource("bbox-source");
    }

    // Don't render hulls if zoomed in too much
    if (!shouldShowHulls) {
      return;
    }

    // Create a Feature Collection from fire points
    const points = turf.featureCollection(fireData.map((fire) => turf.point([fire.longitude, fire.latitude])));

    // Group all crisis points into ONE cluster if they're the same type and reasonably close
    // Then create a convex hull outline around them
    
    // Determine if we have mostly large-scale or localized events
    const crisisTypes = fireData.map(f => f.crisis);
    const hasLargeScale = crisisTypes.some(isLargeScaleDisaster);
    
    // Use appropriate clustering distance
    const clusterDistance = hasLargeScale ? 100 : 15; // km - more generous to group related incidents
    
    const clusters = [];
    points.features.forEach((point) => {
      let addedToCluster = false;
      
      for (const cluster of clusters) {
        // Check distance to any point in the cluster
        for (const clusterPoint of cluster) {
          const distance = turf.distance(
            clusterPoint.geometry.coordinates, 
            point.geometry.coordinates, 
            { units: "kilometers" }
          );
          
          if (distance <= clusterDistance) {
            cluster.push(point);
            addedToCluster = true;
            break;
          }
        }
        if (addedToCluster) break;
      }
      
      if (!addedToCluster) {
        clusters.push([point]);
      }
    });

    // Process each cluster - create a tight convex hull with minimal buffer
    clusters.forEach((cluster, index) => {
      let geometry;
      
      // Small, reasonable buffer that just outlines the points
      const bufferDistance = hasLargeScale ? 3 : 1; // km - just a small outline
      
      if (cluster.length === 1) {
        // Single point: small circle
        geometry = turf.circle(cluster[0].geometry.coordinates, bufferDistance, {
          steps: 64,
          units: "kilometers",
        });
      } else if (cluster.length === 2) {
        // Two points: buffered line
        const line = turf.lineString([
          cluster[0].geometry.coordinates,
          cluster[1].geometry.coordinates,
        ]);
        geometry = turf.buffer(line, bufferDistance, { 
          units: "kilometers",
          steps: 64 
        });
      } else {
        // 3+ points: convex hull with small buffer
        const clusterPoints = turf.featureCollection(cluster);
        
        try {
          const hull = turf.convex(clusterPoints);
          
          if (hull) {
            // Apply small buffer to create outline
            geometry = turf.buffer(hull, bufferDistance, { 
              units: "kilometers",
              steps: 64 
            });
          } else {
            // Fallback: circle around centroid
            const centroid = turf.centroid(clusterPoints);
            geometry = turf.circle(centroid.geometry.coordinates, bufferDistance, {
              steps: 64,
              units: "kilometers",
            });
          }
        } catch (error) {
          console.warn("Error creating convex hull:", error);
          const centroid = turf.centroid(clusterPoints);
          geometry = turf.circle(centroid.geometry.coordinates, bufferDistance, {
            steps: 64,
            units: "kilometers",
          });
        }
      }

      // Add the source and layer to the map
      const sourceId = `bbox-source-${index}`;
      const layerId = `bbox-layer-${index}`;

      map.addSource(sourceId, {
        type: "geojson",
        data: geometry,
      });

      map.addLayer({
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
      
      clusterLayersRef.current.push(layerId);
    });

    // Cleanup function
    return () => {
      clusterLayersRef.current.forEach((id) => {
        if (map && map.getLayer(id)) {
          map.removeLayer(id);
        }
        if (map && map.getSource(id.replace("-layer", "-source"))) {
          map.removeSource(id.replace("-layer", "-source"));
        }
      });
    };
  }, [fireData, mapLoaded, mapRef]);
};
