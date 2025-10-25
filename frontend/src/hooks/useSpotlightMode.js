import { useState, useCallback } from "react";

/**
 * Hook to manage flyover mode for EMS incidents
 * - Flies camera to incident with tilt
 * - No dimming effect (removed per user request)
 */
export const useSpotlightMode = (mapRef) => {
  const [spotlightState, setSpotlightState] = useState({
    isActive: false,
    focusedIncident: null,
    previousZoom: null,
  });


  // Enter flyover mode for EMS
  const enterSpotlight = useCallback((incident) => {
    if (!mapRef.current || !incident) return;

    const map = mapRef.current;
    const center = incident.coordinates || [incident.longitude, incident.latitude];
    
    // Store current zoom level before flying
    const currentZoom = map.getZoom();

    // Fly to incident with tilt and zoom
    map.flyTo({
      center,
      zoom: 17,
      pitch: 60,
      bearing: map.getBearing(), // Keep current bearing
      duration: 2000,
      essential: true,
    });

    setSpotlightState({
      isActive: true,
      focusedIncident: incident,
      previousZoom: currentZoom,
    });
  }, [mapRef]);

  // Exit flyover mode
  const exitSpotlight = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    setSpotlightState((prevState) => {
      // Return to the previous zoom level (or default to 11 if not set)
      const targetZoom = prevState.previousZoom || 11;
      
      map.flyTo({
        pitch: 0,
        zoom: targetZoom,
        duration: 1500,
        essential: true,
      });

      return {
        isActive: false,
        focusedIncident: null,
        previousZoom: null,
      };
    });
  }, [mapRef]);

  return {
    spotlightState,
    enterSpotlight,
    exitSpotlight,
  };
};

