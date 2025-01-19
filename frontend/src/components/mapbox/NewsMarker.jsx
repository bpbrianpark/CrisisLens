import { useEffect } from "react";
import mapboxgl from "mapbox-gl";

function NewsMarker({ map, location, news }) {
  useEffect(() => {
    if (!news || news.length === 0) {
      console.warn(`No news available for location: ${location}`);
      return;
    }

    const markerElement = document.createElement("div");
    markerElement.style.backgroundImage = "url(https://images.emojiterra.com/mozilla/512px/1f4e2.png)";
    markerElement.style.backgroundSize = "contain";
    markerElement.style.width = "40px";
    markerElement.style.height = "40px";

    const marker = new mapboxgl.Marker(markerElement).setLngLat(location).addTo(map);

    const popup = new mapboxgl.Popup({ offset: 25 }).setText(news[0]?.title || "No title available");

    marker.setPopup(popup);
    marker.getElement().style.cursor = "pointer";
    marker.getElement().addEventListener("click", () => {
      popup.addTo(map);
    });

    return () => marker.remove();
  }, [map, location, news]);

  return null;
}

export default NewsMarker;
