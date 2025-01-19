import { useState } from "react";
import "../App.css";

const GoLiveButton = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { latitude, longitude };
          setUserLocation(location);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Error getting location: ";
          switch (error.code) {
            case error.TIMEOUT:
              errorMessage += "Request timed out. Please try again.";
              break;
            case error.PERMISSION_DENIED:
              errorMessage += "Please enable location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information unavailable.";
              break;
            default:
              errorMessage += error.message;
          }
          alert(errorMessage);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setIsLoading(false);
    }
  };

  console.log(userLocation);

  return (
    <button className="record-button" onClick={handleClick} disabled={isLoading}>
      {isLoading ? "Getting Location..." : "Record Now"}
    </button>
  );
};

export default GoLiveButton;
