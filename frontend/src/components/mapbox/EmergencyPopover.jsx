import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";

function EmergencyPopover({ map, location, event, onClose }) {
  const popoverRef = useRef();

  useEffect(() => {
    if (!map || !location || !event) return;

    const style = document.createElement('style');
    style.setAttribute('data-emergency-popover', 'true');
    style.textContent = `
      .custom-emergency-popup .mapboxgl-popup-tip {
        display: none !important;
      }
      .custom-emergency-popup .mapboxgl-popup-content {
        padding: 0 !important;
        border-radius: 8px !important;
      }
    `;
    document.head.appendChild(style);

    const popoverElement = document.createElement("div");
    popoverElement.className = "emergency-popover";
    popoverElement.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 16rem;
      z-index: 1000;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.style.cssText = `
      position: absolute;
      top: 5px;
      right: 8px;
      background: none;
      border: none;
      outline: none;
      font-size: 18px;
      cursor: pointer;
      color: #666;
      padding: 0;
      margin: 0;
      box-shadow: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    `;
    closeButton.onclick = onClose;

    const content = document.createElement("div");
    content.style.cssText = `
      text-align: center;
    `;

    // Add emergency message
    const emergencyMessage = document.createElement("div");
    emergencyMessage.style.cssText = `
      font-weight: bold;
      color: #333;
      line-height: 1.4;
    `;
    emergencyMessage.textContent = "Emergency Responders in the Area";

    content.appendChild(emergencyMessage);
    popoverElement.appendChild(closeButton);
    popoverElement.appendChild(content);

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, 0], 
      className: 'custom-emergency-popup', 
    })
      .setLngLat(location)
      .setDOMContent(popoverElement)
      .addTo(map);

    popoverRef.current = popup;

    return () => {
      if (popoverRef.current) {
        popoverRef.current.remove();
      }
      const existingStyle = document.querySelector('style[data-emergency-popover]');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [map, location, event, onClose]);

  return null;
}

EmergencyPopover.propTypes = {
  map: PropTypes.object.isRequired,
  location: PropTypes.arrayOf(PropTypes.number).isRequired,
  event: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default EmergencyPopover;
