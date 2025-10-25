import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import PropTypes from "prop-types";
import { CRISIS_BY_ID } from "../../constants/crisisTypes";

function CrisisMarker({ map, location, count = 1, onClick, crises }) {
  const MAX_BADGES = 3;
  const FALLBACK_ICON = "/icons/openmoji/plus.svg";

  useEffect(() => {
    if (!map || !location || location.length !== 2) {
      console.error("Map or location is invalid:", { map, location });
      return;
    }

    const secs = (c) => c?.createdAt?.seconds ?? 0;

    const sorted = (crises ?? []).slice().sort((a, b) => secs(b) - secs(a));
    const mostRecentCrisis = sorted[0];
    const mainCrisisId = mostRecentCrisis?.crisis;
    const crisisId = mostRecentCrisis?.crisis;
    const crisisType = CRISIS_BY_ID[crisisId];
    const iconUrl = crisisType?.iconUrl || "/icons/openmoji/other.svg";

    const seen = new Set([mainCrisisId]);
    const otherCategoryIds = [];
    for (const c of sorted) {
      const id = c?.crisis;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      otherCategoryIds.push(id);
    }

    const markerElement = document.createElement("div");
    const baseSize = 30 + count * 2;
    markerElement.style.background = `no-repeat center/contain url(${iconUrl})`;
    markerElement.style.width = `${baseSize}px`;
    markerElement.style.height = `${baseSize}px`;
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

    let showOtherCategroyIds = otherCategoryIds.slice(0, MAX_BADGES);
    const forceFallbackLast = otherCategoryIds.length > MAX_BADGES;

    const miniSize = Math.max(14, Math.round(baseSize * 0.38));
    const radius = Math.round(baseSize * 0.55);
    const cx = baseSize / 2;
    const cy = baseSize / 2;

    const angleSets = {
      1: [225],
      2: [225, 315],
      3: [225, 315, 135],
    };
    const chosenAngles = angleSets[Math.min(showOtherCategroyIds.length, 3)] || [];

    showOtherCategroyIds.forEach((id, i) => {
      const isLast = i === showOtherCategroyIds.length - 1;
      const angleDeg = chosenAngles[i] ?? 225;

      const mini = document.createElement("div");
      mini.style.position = "absolute";
      mini.style.width = `${miniSize}px`;
      mini.style.height = `${miniSize}px`;
      mini.style.borderRadius = "50%";
      mini.style.background = "#fff";
      mini.style.border = "1px solid rgba(0,0,0,0.15)";
      mini.style.boxShadow = "0 1px 2px rgba(0,0,0,0.15)";
      mini.style.pointerEvents = "none";

      // choose icon: fallback on last if there were >3 categories overall
      const t = CRISIS_BY_ID[id] || {};
      const miniIconUrl = forceFallbackLast && isLast ? FALLBACK_ICON : t.iconUrl || FALLBACK_ICON;

      mini.style.backgroundImage = `url(${miniIconUrl})`;
      mini.style.backgroundRepeat = "no-repeat";
      mini.style.backgroundPosition = "center";
      mini.style.backgroundSize = "70%";

      const rad = (angleDeg * Math.PI) / 180;
      const dx = Math.round(Math.cos(rad) * radius);
      const dy = Math.round(Math.sin(rad) * radius);
      mini.style.left = `${Math.round(cx + dx - miniSize / 2)}px`;
      mini.style.top = `${Math.round(cy + dy - miniSize / 2)}px`;

      markerElement.appendChild(mini);
    });

    const marker = new mapboxgl.Marker({
      element: markerElement,
      anchor: 'center',
      pitchAlignment: 'viewport', // Keep marker upright when map is pitched
      rotationAlignment: 'viewport', // Keep marker oriented to screen
    }).setLngLat(location).addTo(map);

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
