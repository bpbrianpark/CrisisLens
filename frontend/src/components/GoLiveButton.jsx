// GoLiveButton.jsx
import { useRef, useState, useMemo } from "react";
import PropTypes from "prop-types";
import CrisisTypeModal from "./CrisisTypeModal";
import "../App.css";

const GoLiveButton = ({ handleStartStream }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [modalView, setModalView] = useState("quick");
  const modalRef = useRef(null);

  const atTopLevel = modalView === "quick";

  const mainLabel = useMemo(() => {
    if (!open) return "Record Now";
    return atTopLevel ? "Cancel" : "Back";
  }, [open, atTopLevel]);

  const handleMainClick = () => {
    if (!open) {
      setOpen(true);
      return;
    }
    if (atTopLevel) {
      setOpen(false);
    } else {
      modalRef.current?.goBack();
    }
  };

  const handleClick = async (typeId) => {
    setOpen(false);
    setModalView("quick");
    if (!typeId) return;

    setIsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
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
          let msg = "Error getting location: ";
          switch (error.code) {
            case error.TIMEOUT:
              msg += "Request timed out. Please try again.";
              break;
            case error.PERMISSION_DENIED:
              msg += "Please enable location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              msg += "Location information unavailable.";
              break;
            default:
              msg += error.message;
          }
          alert(msg);
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <button className="record-button" onClick={handleMainClick} disabled={isLoading}>
        {mainLabel}
      </button>

      <CrisisTypeModal
        ref={modalRef}
        isOpen={open}
        onConfirm={handleClick}
        onViewChange={setModalView}
        defaultType="wildfire"
      />
    </>
  );
};

GoLiveButton.propTypes = {
  handleStartStream: PropTypes.func.isRequired,
};

export default GoLiveButton;
