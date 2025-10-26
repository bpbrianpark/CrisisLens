import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";

const CLOSURE_IMAGE_URL="https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/OOjs_UI_icon_alert-yellow.svg/1200px-OOjs_UI_icon_alert-yellow.svg.png"

function ClosureMarker({ map, location, event, onClick }) {
  const markerRef = useRef(null);
  const markerElementRef = useRef(null);

  // Create marker once
  useEffect(() => {
    if (!map || !location || location.length !== 2) {
      console.error("Map or location is invalid:", { map, location });
      return;
    }

    const markerElement = document.createElement("div");
    markerElement.style.backgroundImage = "url(" + CLOSURE_IMAGE_URL + ")";
    markerElement.style.backgroundSize = "contain";
    markerElement.style.backgroundRepeat = "no-repeat";
    markerElement.style.backgroundPosition = "center";
    markerElement.style.width = `30px`;
    markerElement.style.height = `30px`;
    markerElement.style.position = "absolute";
    markerElement.style.cursor = "pointer";
    markerElement.style.opacity = "1";
    markerElement.style.outline = "none";
    markerElement.style.border = "none";
    markerElement.style.userSelect = "none";
    markerElement.style.WebkitTapHighlightColor = "transparent";
    markerElement.style.WebkitTouchCallout = "none";

    // Create marker with viewport alignment for stability during tilt
    const marker = new mapboxgl.Marker({
      element: markerElement,
      anchor: 'center',
      pitchAlignment: 'viewport', // Keeps icon upright during tilt
      rotationAlignment: 'viewport', // Keeps icon north-aligned
    })
      .setLngLat(location)
      .addTo(map);

    markerRef.current = marker;
    markerElementRef.current = markerElement;

    return () => {
      marker.remove();
      markerRef.current = null;
      markerElementRef.current = null;
    };
  }, [map, location]); // Only recreate if map or location changes

  // Update click handler without recreating marker
  useEffect(() => {
    const markerElement = markerElementRef.current;
    if (!markerElement || !onClick) return;

    const handleClick = () => onClick(event);
    markerElement.addEventListener("click", handleClick);

    return () => {
      markerElement.removeEventListener("click", handleClick);
    };
  }, [event, onClick]);

  return null;
}

ClosureMarker.propTypes = {
  map: PropTypes.object.isRequired,
  location: PropTypes.arrayOf(PropTypes.number).isRequired,
  event: PropTypes.object.isRequired,
  onClick: PropTypes.func,
};

export default ClosureMarker;
