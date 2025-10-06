import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";

const EMERGENCY_ICON_URL =
  "https://images.emojiterra.com/google/android-12l/512px/1f692.png";

function EmergencyMarker({ map, location, event, onClick }) {
  useEffect(() => {
    if (!map || !location || location.length !== 2) {
      return;
    }

    const el = document.createElement("div");
    el.style.backgroundImage = `url(${EMERGENCY_ICON_URL})`;
    el.style.backgroundSize = "contain";
    el.style.width = "32px";
    el.style.height = "32px";
    el.style.cursor = "pointer";

    const marker = new mapboxgl.Marker(el)
      .setLngLat(location)
      .addTo(map);

    if (onClick) {
      el.addEventListener("click", () => onClick(event));
    }

    return () => marker.remove();
  }, [map, location, event, onClick]);

  return null;
}

EmergencyMarker.propTypes = {
  map: PropTypes.object.isRequired,
  location: PropTypes.arrayOf(PropTypes.number).isRequired,
  event: PropTypes.object.isRequired,
  onClick: PropTypes.func,
};

export default EmergencyMarker;
