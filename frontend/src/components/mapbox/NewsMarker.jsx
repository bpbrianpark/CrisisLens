import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";

function NewsMarker({ map, location, news, count = 1, onClick, locationNames }) {
  useEffect(() => {
    if (!news || news.length === 0) {
      console.warn(`No news available for location: ${location}`);
      return;
    }

    if (!map || !location || location.length !== 2) {
      console.error("Map or location is invalid:", { map, location });
      return;
    }

    const markerElement = document.createElement("div");
    markerElement.style.backgroundImage = "url(https://images.emojiterra.com/mozilla/512px/1f4e2.png)";
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
      countBadge.style.background = "rgba(0, 100, 200, 0.8)";
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
      markerElement.addEventListener("click", () => onClick(news, locationNames));
    }

    return () => marker.remove();
  }, [map, location, news, count, onClick, locationNames]);

  return null;
}

NewsMarker.propTypes = {
  map: PropTypes.object.isRequired,
  location: PropTypes.arrayOf(PropTypes.number).isRequired,
  news: PropTypes.arrayOf(PropTypes.object).isRequired,
  count: PropTypes.number,
  onClick: PropTypes.func,
  locationNames: PropTypes.arrayOf(PropTypes.string),
};

export default NewsMarker;
