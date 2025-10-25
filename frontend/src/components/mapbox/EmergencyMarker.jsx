import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";

const EMERGENCY_ICON_URL =
  "https://images.emojiterra.com/google/android-12l/512px/1f692.png";

function EmergencyMarker({ map, location, event, onClick, isInSpotlight }) {
  useEffect(() => {
    if (!map || !location || location.length !== 2) {
      return;
    }

    const el = document.createElement("div");
    el.style.backgroundImage = `url(${EMERGENCY_ICON_URL})`;
    el.style.backgroundSize = "contain";
    el.style.cursor = "pointer";
    el.style.transition = "width 0.3s ease, height 0.3s ease";

    // Function to update size based on zoom (only when in spotlight)
    const updateSize = () => {
      if (isInSpotlight) {
        const zoom = map.getZoom();
        // Scale up with zoom during spotlight (larger when zoomed in)
        // At zoom 11: 32px, at zoom 17 (flyover): 64px
        const size = Math.min(Math.max(32, 32 + (zoom - 11) * 5.33), 70);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
      } else {
        // Keep constant size when not in spotlight
        el.style.width = "32px";
        el.style.height = "32px";
      }
    };

    // Set initial size
    updateSize();

    // Update size on zoom
    map.on("zoom", updateSize);

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
      pitchAlignment: 'viewport',
      rotationAlignment: 'viewport',
    })
      .setLngLat(location)
      .addTo(map);

    if (onClick) {
      el.addEventListener("click", () => onClick(event));
    }

    return () => {
      map.off("zoom", updateSize);
      marker.remove();
    };
  }, [map, location, event, onClick, isInSpotlight]);

  return null;
}

EmergencyMarker.propTypes = {
  map: PropTypes.object.isRequired,
  location: PropTypes.arrayOf(PropTypes.number).isRequired,
  event: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  isInSpotlight: PropTypes.bool,
};

export default EmergencyMarker;
