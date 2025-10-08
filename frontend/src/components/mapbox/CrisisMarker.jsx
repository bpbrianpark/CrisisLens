import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";
import { CRISIS_BY_ID } from "../../constants/crisisTypes";

function CrisisMarker({ map, location, count = 1, onClick, crises }) {
  useEffect(() => {
    if (!map || !location || location.length !== 2) {
      console.error("Map or location is invalid:", { map, location });
      return;
    }

    const crisisId = crises?.[0]?.crisis;
    const crisisType = CRISIS_BY_ID[crisisId];
    const iconUrl = crisisType?.iconUrl || "/icons/openmoji/other.svg";

    const markerElement = document.createElement("div");
    markerElement.style.background = `no-repeat center/contain url(${iconUrl})`;
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

    const marker = new mapboxgl.Marker(markerElement).setLngLat(location).addTo(map);

    if (onClick) {
      markerElement.addEventListener("click", () => onClick(crises));
    }

    return () => marker.remove();
  }, [map, location, count, onClick, crises]);

  return null;
}

CrisisMarker.propTypes = {
  map: PropTypes.object.isRequired,
  location: PropTypes.arrayOf(PropTypes.number).isRequired,
  count: PropTypes.number,
  onClick: PropTypes.func,
  crises: PropTypes.arrayOf(PropTypes.object),
};

export default CrisisMarker;
