import { useState } from "react";
import PropTypes from "prop-types";
import CrisisTypeModal from "./CrisisTypeModal";
import "../App.css";

const GoLiveButton = ({ handleStartStream }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleClick = async (typeId) => {
    setIsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            await handleStartStream({ latitude, longitude, crisis: typeId });
          } catch (error) {
            console.error("Error starting stream:", error);
            alert("Failed to start stream. Please try again.");
          } finally {
            setIsLoading(false);
          }
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

  return (
    <>
      <button
        className="record-button"
        onClick={() => {
          open ? setOpen(false) : setOpen(true);
        }}
        disabled={isLoading}
      >
        {open ? "Cancel" : "Record Now"}
      </button>
      <CrisisTypeModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={(typeId) => {
          handleClick(typeId);
          setOpen(false);
        }}
        defaultType="fire"
      />
    </>
  );
};

GoLiveButton.propTypes = {
  handleStartStream: PropTypes.func.isRequired,
};

export default GoLiveButton;
