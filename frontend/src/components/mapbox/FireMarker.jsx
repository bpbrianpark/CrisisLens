import { useEffect } from "react";
import mapboxgl from "mapbox-gl";

function FireMarker({ map, location }) {
  useEffect(() => {
    const markerElement = document.createElement("div");
    markerElement.style.backgroundImage =
      "url(https://uxwing.com/wp-content/themes/uxwing/download/e-commerce-currency-shopping/flame-icon.png)";
    markerElement.style.backgroundSize = "contain";
    markerElement.style.width = "30px";
    markerElement.style.height = "30px";

    const marker = new mapboxgl.Marker(markerElement).setLngLat(location).addTo(map);

    const popup = new mapboxgl.Popup({ offset: 25 }).setText("This is a generic popup message.");

    marker.setPopup(popup);
    marker.getElement().style.cursor = "pointer";
    marker.getElement().addEventListener("click", () => {
      popup.addTo(map);
    });

    return () => marker.remove();
  }, [map, location]);

  return null;
}

export default FireMarker;
