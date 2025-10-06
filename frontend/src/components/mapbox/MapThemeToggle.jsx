import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./MapThemeToggle.css";

const MapThemeToggle = ({ map, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("crisisLensMapTheme") || "day";
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const logo = document.querySelector(".custom-geocoder-container img");
      const isClickOnLogo = logo && logo.contains(event.target);
      const isClickInDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);

      if (!isClickOnLogo && !isClickInDropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleLogoClick = () => setIsOpen((prev) => !prev);

    const attachLogoHandler = () => {
      const logo = document.querySelector(".custom-geocoder-container img");
      if (logo) {
        logo.addEventListener("click", handleLogoClick);
        logo.style.cursor = "pointer";
        return true;
      }
      return false;
    };

    if (!attachLogoHandler()) {
      const retryInterval = setInterval(() => {
        if (attachLogoHandler()) {
          clearInterval(retryInterval);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(retryInterval);
      }, 5000);

      return () => {
        clearInterval(retryInterval);
        clearTimeout(timeout);
        const logo = document.querySelector(".custom-geocoder-container img");
        if (logo) {
          logo.removeEventListener("click", handleLogoClick);
        }
      };
    }

    return () => {
      const logo = document.querySelector(".custom-geocoder-container img");
      if (logo) {
        logo.removeEventListener("click", handleLogoClick);
      }
    };
  }, []);

  // Set initial theme attribute on mount
  useEffect(() => {
    const searchContainer = document.querySelector(".custom-geocoder-container");
    if (searchContainer) {
      searchContainer.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    if (theme === newTheme || !map) return;

    setTheme(newTheme);
    setIsOpen(false);

    localStorage.setItem("crisisLensMapTheme", newTheme);

    // Update theme attribute on search container for styling
    const searchContainer = document.querySelector(".custom-geocoder-container");
    if (searchContainer) {
      searchContainer.setAttribute("data-theme", newTheme);
    }

    const styleUrl =
      newTheme === "day" ? "mapbox://styles/mapbox/navigation-day-v1" : "mapbox://styles/mapbox/navigation-night-v1";

    const onStyleLoad = () => {
      if (onThemeChange) {
        onThemeChange();
      }
      map.off("style.load", onStyleLoad);
    };

    map.on("style.load", onStyleLoad);
    map.setStyle(styleUrl);
  };

  return (
    <>
      {isOpen && (
        <div className={`theme-dropdown ${theme === "night" ? "dark" : ""}`} ref={dropdownRef}>
          <div className="theme-toggle-switch">
            <button
              className={`theme-option ${theme === "day" ? "active" : ""}`}
              onClick={() => handleThemeChange("day")}
              aria-label="Day mode"
            >
              <span className="theme-icon">☀️</span>
            </button>
            <button
              className={`theme-option ${theme === "night" ? "active" : ""}`}
              onClick={() => handleThemeChange("night")}
              aria-label="Night mode"
            >
              <span className="theme-icon">🌙</span>
            </button>
            <div
              className="theme-slider"
              style={{
                transform: theme === "night" ? "translateX(100%)" : "translateX(0)",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

MapThemeToggle.propTypes = {
  map: PropTypes.object.isRequired,
  onThemeChange: PropTypes.func,
};

export default MapThemeToggle;
