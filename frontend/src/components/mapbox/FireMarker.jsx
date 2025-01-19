import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";

function FireMarker({ map, location, count = 1, onClick, fires }) {
  useEffect(() => {
    if (!map || !location || location.length !== 2) {
      console.error("Map or location is invalid:", { map, location });
      return;
    }

    const markerElement = document.createElement("div");
    markerElement.style.backgroundImage =
      "url(https://uxwing.com/wp-content/themes/uxwing/download/e-commerce-currency-shopping/flame-icon.png)";
    markerElement.style.backgroundSize = "contain";
    markerElement.style.width = `${30 + count * 2}px`;
    markerElement.style.height = `${30 + count * 2}px`;
    markerElement.style.position = "absolute";
    markerElement.style.cursor = "pointer";

    if (count > 1) {
      const countBadge = document.createElement("div");
      countBadge.style.position = "absolute";
      countBadge.style.bottom = "-5px";
      countBadge.style.right = "-5px";
      countBadge.style.background = "rgba(255, 0, 0, 0.8)";
      countBadge.style.color = "white";
      countBadge.style.fontWeight = "bold";
      countBadge.style.fontSize = "12px";
      countBadge.style.borderRadius = "50%";
      countBadge.style.padding = "2px 5px";
      countBadge.textContent = count;
      markerElement.appendChild(countBadge);
    }

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat(location)
      .addTo(map);

    if (onClick) {
      markerElement.addEventListener("click", () => onClick(fires));
    }

    return () => marker.remove();
  }, [map, location, count, onClick, fires]);

  return null;
}

FireMarker.propTypes = {
  map: PropTypes.object.isRequired,
  location: PropTypes.arrayOf(PropTypes.number).isRequired,
  count: PropTypes.number,
  onClick: PropTypes.func,
  fires: PropTypes.arrayOf(PropTypes.object),
};

export default FireMarker;
