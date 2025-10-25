import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";

const CLOSURE_IMAGE_URL="https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/OOjs_UI_icon_alert-yellow.svg/1200px-OOjs_UI_icon_alert-yellow.svg.png"

function ClosureMarker({ map, location, event, onClick }) {
  useEffect(() => {
    if (!map || !location || location.length !== 2) {
      console.error("Map or location is invalid:", { map, location });
      return;
    }

    const markerElement = document.createElement("div");
    markerElement.style.backgroundImage =
      "url(" + CLOSURE_IMAGE_URL + ")";
    markerElement.style.backgroundSize = "contain";
    markerElement.style.width = `30px`;
    markerElement.style.height = `30px`;
    markerElement.style.position = "absolute";
    markerElement.style.cursor = "pointer";

    const marker = new mapboxgl.Marker({
      element: markerElement,
      anchor: 'center',
      pitchAlignment: 'viewport',
      rotationAlignment: 'viewport',
    })
      .setLngLat(location)
      .addTo(map);

    if (onClick) {
      markerElement.addEventListener("click", () => onClick(event));
    }

    return () => marker.remove();
  }, [map, location, event, onClick]);

  return null;
}

ClosureMarker.propTypes = {
  map: PropTypes.object.isRequired,
  location: PropTypes.arrayOf(PropTypes.number).isRequired,
  event: PropTypes.object.isRequired,
  onClick: PropTypes.func,
};

export default ClosureMarker;
