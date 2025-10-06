import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";

function ClosurePopover({ map, location, event, onClose }) {
  const popoverRef = useRef();

  useEffect(() => {
    if (!map || !location || !event) return;

    const style = document.createElement('style');
    style.setAttribute('data-closure-popover', 'true');
    style.textContent = `
      .custom-popup .mapboxgl-popup-tip {
        display: none !important;
      }
      .custom-popup .mapboxgl-popup-content {
        padding: 0 !important;
        border-radius: 14px !important;
        background: transparent !important;
        border: none !important;
      }
    `;
    document.head.appendChild(style);

    const popoverElement = document.createElement("div");
    popoverElement.className = "closure-popover";
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
      flex-direction: column;
      align-items: center;
      gap: 10px;
      width: 100%;
    `;

    const textCol = document.createElement("div");
    textCol.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100%;
    `;

    const title = document.createElement("div");
    title.style.cssText = `
      color: #0f172a;
      letter-spacing: 0.1px;
      text-align: center;
      width: 100%;
    `;
    const headlineText = event.headline || "Traffic Advisory";
    const sentences = headlineText
      .split('.')
      .map(s => s.trim())
      .filter(Boolean);
    if (sentences.length > 0) {
      sentences.forEach((s, idx) => {
        const line = document.createElement('div');
        line.style.cssText = `
          margin: ${idx === 0 ? '0' : '2px 0 0 0'};
          ${idx === 0 ? 'font-weight: 700;' : 'font-weight: 400;'}
        `;
        line.textContent = s + '.';
        title.appendChild(line);
      });
    } else {
      title.textContent = headlineText;
    }

    const pill = document.createElement("div");
    pill.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #334155;
      margin-top: 2px;
    `;
    const dot = document.createElement("span");
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: ${event.status === "ACTIVE" ? "#10b981" : "#9ca3af"};
      box-shadow: 0 0 0 3px ${event.status === "ACTIVE" ? "rgba(16,185,129,0.18)" : "rgba(156,163,175,0.18)"};
    `;
    const pillText = document.createElement("span");
    const roadName = event.roadName || (event.roads && event.roads[0] && event.roads[0].name) || "Road Closure";
    pillText.textContent = `${event.eventType || "Closure"} • ${roadName}`;
    pill.appendChild(dot);
    pill.appendChild(pillText);

    const textColContainer = document.createElement("div");
    textColContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      width: 100%;
      text-align: center;
    `;
    textCol.appendChild(title);
    textCol.appendChild(pill);
    textColContainer.appendChild(textCol);

    content.appendChild(textColContainer);
    popoverElement.appendChild(closeButton);
    popoverElement.appendChild(content);

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, -6], 
      className: 'custom-popup', 
    })
      .setLngLat(location)
      .setDOMContent(popoverElement)
      .addTo(map);

    popoverRef.current = popup;

    return () => {
      if (popoverRef.current) {
        popoverRef.current.remove();
      }

      const existingStyle = document.querySelector('style[data-closure-popover]');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [map, location, event, onClose]);

  return null;
}

ClosurePopover.propTypes = {
  map: PropTypes.object.isRequired,
  location: PropTypes.arrayOf(PropTypes.number).isRequired,
  event: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ClosurePopover;
