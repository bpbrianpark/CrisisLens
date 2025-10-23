import { useState, useEffect } from "react";

const CLOSURE_ZOOM_LEVEL = 7;

export const useZoomVisibility = (mapRef, mapLoaded) => {
  const [currentZoom, setCurrentZoom] = useState(null);
  const [shouldShowClosures, setShouldShowClosures] = useState(false);
  const [shouldShowEmergencies, setShouldShowEmergencies] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    
    const updateZoom = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      
      const showClosures = zoom >= CLOSURE_ZOOM_LEVEL;
      const showEmergencies = zoom >= CLOSURE_ZOOM_LEVEL;
      
      console.log('Zoom level:', zoom, 'Show closures:', showClosures, 'Show emergencies:', showEmergencies);
      
      setShouldShowClosures(showClosures);
      setShouldShowEmergencies(showEmergencies);
    };

    updateZoom();

    map.on('zoom', updateZoom);
    map.on('zoomend', updateZoom);

    return () => {
      map.off('zoom', updateZoom);
      map.off('zoomend', updateZoom);
    };
  }, [mapRef, mapLoaded]);

  return {
    currentZoom,
    shouldShowClosures,
    shouldShowEmergencies,
  };
};
