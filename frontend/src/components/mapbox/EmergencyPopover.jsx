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
        border-radius: 14px !important;
        background: transparent !important;
        border: none !important;
      }
    `;
    document.head.appendChild(style);

    const popoverElement = document.createElement("div");
    popoverElement.className = "emergency-popover";
    popoverElement.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(17, 24, 39, 0.08);
      border-radius: 14px;
      padding: 14px 14px 12px 14px;
      box-shadow: 0 10px 30px rgba(2, 6, 23, 0.15);
      backdrop-filter: saturate(140%) blur(6px);
      width: 18rem;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      font-size: 14px;
    `;

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(15, 23, 42, 0.04);
      border: 1px solid rgba(17, 24, 39, 0.08);
      outline: none;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      font-size: 16px;
      line-height: 26px;
      cursor: pointer;
      color: #374151;
      padding: 0;
      margin: 0;
      box-shadow: 0 1px 2px rgba(2, 6, 23, 0.06);
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      transition: background 120ms ease, transform 80ms ease;
    `;
    closeButton.onmouseenter = () => {
      closeButton.style.background = "rgba(15, 23, 42, 0.08)";
    };
    closeButton.onmouseleave = () => {
      closeButton.style.background = "rgba(15, 23, 42, 0.04)";
    };
    closeButton.onclick = onClose;

    const content = document.createElement("div");
    content.style.cssText = `
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
    `;

    const leadingIcon = document.createElement("div");
    leadingIcon.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border: 1px solid rgba(220, 38, 38, 0.18);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
      color: #991b1b;
      font-size: 18px;
      font-weight: 700;
    `;
    leadingIcon.textContent = "!";

    const textCol = document.createElement("div");
    textCol.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;

    const title = document.createElement("div");
    title.style.cssText = `
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.1px;
    `;
    title.textContent = "EMS in Area";

    const pill = document.createElement("div");
    pill.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #334155;
    `;
    const dot = document.createElement("span");
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #f59e0b;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.18);
    `;
    const pillText = document.createElement("span");
    pillText.textContent = event.callType || "Active response";
    pill.appendChild(dot);
    pill.appendChild(pillText);

    textCol.appendChild(title);
    textCol.appendChild(pill);
    content.appendChild(leadingIcon);
    content.appendChild(textCol);
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
