import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { CRISIS_BY_ID } from "../../constants/crisisTypes";
import "./IncidentDetailCard.css";

/**
 * Responsive Incident Detail Card
 * - Desktop: Top banner with breaking news style
 * - Mobile: Bottom sheet with swipe-to-dismiss
 */
function IncidentDetailCard({ incident, onClose, isEMS = false }) {
  const [isMobile, setIsMobile] = useState(false);
  const [animationState, setAnimationState] = useState("entering");
  const sheetRef = useRef(null);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => {
      setAnimationState("entered");
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle touch events for swipe-to-dismiss on mobile
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = touchStartY.current;
  };

  const handleTouchMove = (e) => {
    if (!isMobile) return;
    touchCurrentY.current = e.touches[0].clientY;
    
    const deltaY = touchCurrentY.current - touchStartY.current;
    
    // Only allow upward swipe (negative deltaY to dismiss)
    if (deltaY < 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    
    const deltaY = touchCurrentY.current - touchStartY.current;
    
    // If swiped up more than 100px, dismiss
    if (deltaY < -100) {
      handleClose();
    } else if (sheetRef.current) {
      // Reset position
      sheetRef.current.style.transform = "translateY(0)";
    }
  };

  const handleClose = () => {
    setAnimationState("exiting");
    setTimeout(() => {
      onClose();
    }, 400);
  };

  if (!incident) return null;

  // Handle EMS incidents differently from crisis incidents
  const crisisType = isEMS ? CRISIS_BY_ID["structure_fire"] : CRISIS_BY_ID[incident.crisis];
  const iconUrl = isEMS ? "/icons/openmoji/structure_fire.svg" : (crisisType?.iconUrl || "/icons/openmoji/other.svg");
  const crisisLabel = isEMS ? (incident.callType || "Emergency Response") : (crisisType?.label || "Incident");
  const isLive = isEMS ? true : (incident.isLiveStream || incident.isOnGoing);

  const className = isMobile 
    ? `incident-detail-sheet ${animationState}`
    : `incident-detail-banner ${animationState}`;

  return (
    <div
      ref={sheetRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe handle (mobile only) */}
      {isMobile && <div className="sheet-handle" />}

      {/* Breaking news header (desktop only) */}
      {!isMobile && isLive && (
        <div className="breaking-header">
          <div className="breaking-label">
            <span className="breaking-pulse" />
            Breaking: Active Incident in Area
          </div>
        </div>
      )}

      {/* Header */}
      <div className="incident-header">
        <div className="incident-title-section">
          <div className="incident-icon">
            <img src={iconUrl} alt={crisisLabel} />
          </div>
          
          <div className="incident-title-text">
            <div className="incident-label">
              {isEMS ? "Emergency Services Response" : (isLive ? "Live Incident" : "Recent Incident")}
            </div>
            <div className="incident-status">
              <h2 className="incident-type">{crisisLabel}</h2>
              {isEMS && incident.units && (
                <span className="status-badge live">
                  <span className="status-indicator" />
                  {incident.units.length} UNIT{incident.units.length > 1 ? "S" : ""}
                </span>
              )}
              {!isEMS && (
                <span className={`status-badge ${isLive ? "live" : "archived"}`}>
                  {isLive && <span className="status-indicator" />}
                  {isLive ? "LIVE" : "ARCHIVED"}
                </span>
              )}
            </div>
          </div>
        </div>

        <button className="close-button" onClick={handleClose} aria-label="Close">
          ×
        </button>
      </div>

      {/* Details */}
      {!isEMS && incident.description && (
        <div className="incident-details">
          <div className="incident-description">
            {incident.description}
          </div>
        </div>
      )}
    </div>
  );
}

IncidentDetailCard.propTypes = {
  incident: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  isEMS: PropTypes.bool,
};

export default IncidentDetailCard;

