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
        border-radius: 8px !important;
      }
    `;
    document.head.appendChild(style);

    const popoverElement = document.createElement("div");
    popoverElement.className = "closure-popover";
    popoverElement.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 20rem;
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

    const headline = document.createElement("div");
    headline.style.cssText = `
      margin-bottom: 8px;
      color: #333;
      line-height: 1.4;
    `;
    
    const headlineText = event.headline || "No headline available";
    const sentences = headlineText.split('.').filter(sentence => sentence.trim() !== '');
    
    if (sentences.length > 0) {
      const firstSentence = document.createElement("div");
      firstSentence.style.cssText = `
        font-weight: bold;
        margin-bottom: 4px;
      `;
      firstSentence.textContent = sentences[0].trim() + (sentences.length > 1 ? '.' : '');
      headline.appendChild(firstSentence);
      
      for (let i = 1; i < sentences.length; i++) {
        const sentence = document.createElement("div");
        sentence.style.cssText = `
          font-weight: normal;
          margin-bottom: 4px;
        `;
        sentence.textContent = sentences[i].trim() + '.';
        headline.appendChild(sentence);
      }
    } else {
      headline.textContent = headlineText;
    }

    const roadsInfo = document.createElement("div");
    roadsInfo.style.cssText = `
    `;

    if (event.roads && event.roads.length > 0) {
      const roadsTitle = document.createElement("div");
      roadsTitle.style.cssText = `
        font-weight: bold;
        margin-bottom: 4px;
        color: #555;
      `;
      roadsTitle.textContent = "Road Information:";

      roadsInfo.appendChild(roadsTitle);
    } else {
      roadsInfo.textContent = "No road information available";
    }

    const status = document.createElement("div");
    status.style.cssText = `
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      display: inline-block;
      background: ${event.status === "ACTIVE" ? "#ffeb3b" : "#e0e0e0"};
      color: ${event.status === "ACTIVE" ? "#333" : "#666"};
    `;
    status.textContent = `${event.status || "Unknown"}`;

    content.appendChild(headline);
    content.appendChild(status);
    popoverElement.appendChild(closeButton);
    popoverElement.appendChild(content);

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, 0], 
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
