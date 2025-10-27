import { useState, useCallback, useEffect } from "react";
import * as turf from "@turf/turf";

/**
 * Hook to manage flyover mode for traffic/construction incidents
 * - Flies camera to incident with tilt
 * - Shows directional impact ribbon (tapered, gradient)
 * - Shows animated chevrons along corridor
 * - Mobile-compatible, icons remain stable during tilt
 */
export const useTrafficFlyover = (mapRef) => {
  const [flyoverState, setFlyoverState] = useState({
    isActive: false,
    focusedIncident: null,
    previousZoom: null,
    previousPitch: null,
  });

  // Clean up layers when flyover is closed
  const cleanupLayers = useCallback(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const layersToRemove = [
      'traffic-impact-ribbon',
      'traffic-lane-closure-layer',
    ];
    
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    const sourcesToRemove = [
      'traffic-impact-ribbon-source',
      'traffic-lane-closure-source',
    ];
    
    sourcesToRemove.forEach(sourceId => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });
  }, [mapRef]);

  // Create impact ribbon geometry using Turf
  const createImpactRibbon = useCallback((center, bearing, lengthKm = 0.5) => {
    // Create a tapered cone-like polygon extending downstream
    const point = turf.point(center);
    
    // Calculate points along the corridor
    const widthAtStart = 0.03; // km at closure point (narrow)
    const widthAtEnd = 0.15; // km at end (wider)
    
    // Create the centerline
    const endPoint = turf.destination(point, lengthKm, bearing, { units: 'kilometers' });
    
    // Create offset lines for the cone shape
    const leftStart = turf.destination(point, widthAtStart / 2, bearing - 90, { units: 'kilometers' });
    const rightStart = turf.destination(point, widthAtStart / 2, bearing + 90, { units: 'kilometers' });
    const leftEnd = turf.destination(endPoint, widthAtEnd / 2, bearing - 90, { units: 'kilometers' });
    const rightEnd = turf.destination(endPoint, widthAtEnd / 2, bearing + 90, { units: 'kilometers' });
    
    // Create the tapered polygon
    const polygon = turf.polygon([[
      turf.getCoord(leftStart),
      turf.getCoord(leftEnd),
      turf.getCoord(rightEnd),
      turf.getCoord(rightStart),
      turf.getCoord(leftStart),
    ]]);
    
    return polygon;
  }, []);

  // Create lane closure lines along the affected corridor
  const createLaneClosures = useCallback((center, bearing, lengthKm = 0.5, numLanes = 2) => {
    const point = turf.point(center);
    const laneLines = [];
    const laneWidth = 0.006; // km (~6 meters between lane lines)
    
    // Create parallel lines representing blocked lanes
    for (let i = 0; i < numLanes; i++) {
      const offset = (i - (numLanes - 1) / 2) * laneWidth;
      
      // Create start and end points for each lane line
      const startPoint = turf.destination(point, Math.abs(offset), bearing + (offset < 0 ? -90 : 90), { units: 'kilometers' });
      const endPoint = turf.destination(startPoint, lengthKm, bearing, { units: 'kilometers' });
      
      // Create a line for this lane
      laneLines.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            turf.getCoord(startPoint),
            turf.getCoord(endPoint),
          ],
        },
        properties: {
          laneIndex: i,
          blocked: true,
        },
      });
    }
    
    return turf.featureCollection(laneLines);
  }, []);

  // Estimate bearing based on road name or default to south (useful for demo)
  const estimateBearing = useCallback((incident) => {
    const roadName = incident.roadName?.toLowerCase() || '';
    
    // Try to infer direction from road name
    if (roadName.includes('north') || roadName.includes('northbound')) return 0;
    if (roadName.includes('south') || roadName.includes('southbound')) return 180;
    if (roadName.includes('east') || roadName.includes('eastbound')) return 90;
    if (roadName.includes('west') || roadName.includes('westbound')) return 270;
    
    // Check for numbered highways (US-101, I-280, etc.)
    // US-101 and I-280 in SF generally run north-south
    if (roadName.includes('101') || roadName.includes('280')) return 180;
    
    // Default to 180 (south) for demo purposes
    return 180;
  }, []);

  // Add impact visualization layers
  const addImpactLayers = useCallback((incident, zoom) => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const center = incident.coordinates;
    
    // Estimate bearing
    const bearing = estimateBearing(incident);
    
    // Calculate ribbon length based on zoom (more visible at higher zoom)
    const baseLength = 0.5; // km
    const lengthMultiplier = Math.max(0.5, Math.min(2, (18 - zoom) / 3));
    const ribbonLength = baseLength * lengthMultiplier;
    
    // Create ribbon geometry
    const ribbon = createImpactRibbon(center, bearing, ribbonLength);
    
    // Add ribbon source and layer
    if (!map.getSource('traffic-impact-ribbon-source')) {
      map.addSource('traffic-impact-ribbon-source', {
        type: 'geojson',
        data: ribbon,
      });
    } else {
      map.getSource('traffic-impact-ribbon-source').setData(ribbon);
    }
    
    if (!map.getLayer('traffic-impact-ribbon')) {
      map.addLayer({
        id: 'traffic-impact-ribbon',
        type: 'fill',
        source: 'traffic-impact-ribbon-source',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'distance'],
            0, '#ff6b6b',
            1, '#feca57'
          ],
          'fill-opacity': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            14, 0.3,
            16, 0.45,
            18, 0.55
          ],
        },
      }, 'road-label'); // Place below labels but above roads
    }
    
    // Create lane closure visualization
    const numBlockedLanes = 2; // Can be adjusted based on incident data
    const laneClosures = createLaneClosures(center, bearing, ribbonLength, numBlockedLanes);
    
    // Add lane closure source and layer
    if (!map.getSource('traffic-lane-closure-source')) {
      map.addSource('traffic-lane-closure-source', {
        type: 'geojson',
        data: laneClosures,
      });
    } else {
      map.getSource('traffic-lane-closure-source').setData(laneClosures);
    }
    
    if (!map.getLayer('traffic-lane-closure-layer')) {
      map.addLayer({
        id: 'traffic-lane-closure-layer',
        type: 'line',
        source: 'traffic-lane-closure-source',
        paint: {
          'line-color': '#ff4757',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 2,
            16, 3,
            18, 4
          ],
          'line-opacity': 0.8,
          'line-dasharray': [2, 2], // Dashed lines to indicate closure
        },
      }, 'road-label');
    }
  }, [mapRef, createImpactRibbon, createLaneClosures, estimateBearing]);

  // Update layers on zoom/pitch changes
  useEffect(() => {
    if (!mapRef.current || !flyoverState.isActive || !flyoverState.focusedIncident) {
      return;
    }

    const map = mapRef.current;
    
    const handleZoomOrPitch = () => {
      const currentZoom = map.getZoom();
      addImpactLayers(flyoverState.focusedIncident, currentZoom);
    };

    map.on('zoom', handleZoomOrPitch);
    map.on('pitch', handleZoomOrPitch);

    return () => {
      map.off('zoom', handleZoomOrPitch);
      map.off('pitch', handleZoomOrPitch);
    };
  }, [mapRef, flyoverState.isActive, flyoverState.focusedIncident, addImpactLayers]);

  // Enter flyover mode for traffic incident
  const enterFlyover = useCallback((incident) => {
    if (!mapRef.current || !incident) return;

    const map = mapRef.current;
    const center = incident.coordinates;
    
    // Store current zoom and pitch before flying
    const currentZoom = map.getZoom();
    const currentPitch = map.getPitch();

    // Determine zoom based on device
    const isMobile = window.innerWidth <= 768;
    const targetZoom = isMobile ? 15 : 16;
    const targetPitch = isMobile ? 45 : 50;

    // Fly to incident with tilt and zoom
    map.flyTo({
      center,
      zoom: targetZoom,
      pitch: targetPitch,
      bearing: map.getBearing(),
      duration: 1000,
      essential: true,
    });

    // Add impact layers after a brief delay to let camera settle
    setTimeout(() => {
      addImpactLayers(incident, targetZoom);
    }, 800);

    setFlyoverState({
      isActive: true,
      focusedIncident: incident,
      previousZoom: currentZoom,
      previousPitch: currentPitch,
    });
  }, [mapRef, addImpactLayers]);

  // Exit flyover mode
  const exitFlyover = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clean up layers first
    cleanupLayers();

    setFlyoverState((prevState) => {
      // Return to the previous zoom level and pitch
      const targetZoom = prevState.previousZoom || 11;
      const targetPitch = prevState.previousPitch || 0;
      
      map.flyTo({
        pitch: targetPitch,
        zoom: targetZoom,
        duration: 1200,
        essential: true,
      });

      return {
        isActive: false,
        focusedIncident: null,
        previousZoom: null,
        previousPitch: null,
      };
    });
  }, [mapRef, cleanupLayers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupLayers();
    };
  }, [cleanupLayers]);

  return {
    flyoverState,
    enterFlyover,
    exitFlyover,
  };
};

