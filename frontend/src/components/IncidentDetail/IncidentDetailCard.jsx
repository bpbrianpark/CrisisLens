import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { CRISIS_BY_ID } from "../../constants/crisisTypes";
import "./IncidentDetailCard.css";

/**
 * Responsive Incident Detail Card
 * - Desktop: Top banner with breaking news style
 * - Mobile: Bottom sheet with swipe-to-dismiss
 * - Supports EMS incidents and Traffic incidents with countdown
 */
function IncidentDetailCard({ incident, onClose, isEMS = false, isTraffic = false }) {
  const [isMobile, setIsMobile] = useState(false);
  const [animationState, setAnimationState] = useState("entering");
  const [countdown, setCountdown] = useState(null);
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

  // Calculate countdown for traffic incidents
  useEffect(() => {
    if (!isTraffic || !incident.endTime) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(incident.endTime);
      const diff = end - now;

      if (diff <= 0) {
        setCountdown({ expired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      // Calculate progress percentage (assuming 24h typical duration if no start time)
      const start = incident.startTime ? new Date(incident.startTime) : new Date(now - 24 * 60 * 60 * 1000);
      const total = end - start;
      const elapsed = now - start;
      const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));

      setCountdown({
        days,
        hours,
        minutes,
        progress,
        expired: false,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isTraffic, incident.endTime, incident.startTime]);

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

  // Handle different incident types
  let crisisType, iconUrl, crisisLabel, isLive, statusText;
  
  if (isTraffic) {
    // Traffic/Construction incident
    iconUrl = "/icons/openmoji/road_closure.svg";
    crisisLabel = incident.eventType || "Road Closure";
    isLive = incident.status === "ACTIVE";
    statusText = incident.status || "ACTIVE";
  } else if (isEMS) {
    // EMS incident
    crisisType = CRISIS_BY_ID["structure_fire"];
    iconUrl = "/icons/openmoji/structure_fire.svg";
    crisisLabel = incident.callType || "Emergency Response";
    isLive = true;
    statusText = "RESPONDING";
  } else {
    // Crisis incident
    crisisType = CRISIS_BY_ID[incident.crisis];
    iconUrl = crisisType?.iconUrl || "/icons/openmoji/other.svg";
    crisisLabel = crisisType?.label || "Incident";
    isLive = incident.isLiveStream || incident.isOnGoing;
    statusText = isLive ? "LIVE" : "ARCHIVED";
  }

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
              {isTraffic ? "Traffic Advisory" : (isEMS ? "Emergency Services Response" : (isLive ? "Live Incident" : "Recent Incident"))}
            </div>
            <div className="incident-status">
              <h2 className="incident-type">{crisisLabel}</h2>
              {isEMS && incident.units && (
                <span className="status-badge live">
                  <span className="status-indicator" />
                  {incident.units.length} UNIT{incident.units.length > 1 ? "S" : ""}
                </span>
              )}
              {isTraffic && (
                <span className={`status-badge ${isLive ? "live" : "archived"}`}>
                  {isLive && <span className="status-indicator" />}
                  {statusText}
                </span>
              )}
              {!isEMS && !isTraffic && (
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
      {!isEMS && (isTraffic ? incident.headline : incident.description) && (
        <div className="incident-details">
          <div className="incident-description">
            {isTraffic ? incident.headline : incident.description}
          </div>
          
          {/* Road name for traffic incidents */}
          {isTraffic && incident.roadName && (
            <div className="incident-road">
              <span className="road-label">Location:</span> {incident.roadName}
            </div>
          )}
        </div>
      )}

      {/* Countdown Timer for Traffic Incidents */}
      {isTraffic && countdown && !countdown.expired && (
        <div className="incident-countdown">
          <div className="countdown-header">
            <span className="countdown-label">Estimated Clearance</span>
            {incident.updatedTime && (
              <span className="countdown-timestamp">
                Data as of {new Date(incident.updatedTime).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            )}
          </div>
          
          <div className="countdown-time">
            {countdown.days > 0 && <span className="countdown-segment">{countdown.days}d</span>}
            {countdown.hours > 0 && <span className="countdown-segment">{countdown.hours}h</span>}
            <span className="countdown-segment">{countdown.minutes}m</span>
          </div>
          
          <div className="countdown-progress">
            <div 
              className="countdown-progress-bar" 
              style={{ width: `${countdown.progress}%` }}
            />
          </div>
        </div>
      )}

      {isTraffic && countdown?.expired && (
        <div className="incident-countdown expired">
          <span className="countdown-label">⚠️ Scheduled clearance time passed</span>
        </div>
      )}
    </div>
  );
}

IncidentDetailCard.propTypes = {
  incident: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  isEMS: PropTypes.bool,
  isTraffic: PropTypes.bool,
};

export default IncidentDetailCard;

