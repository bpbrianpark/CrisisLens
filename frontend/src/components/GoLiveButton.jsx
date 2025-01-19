import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import PropTypes from "prop-types";
import "../App.css";

const GoLiveButton = ({ handleStartStream }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            await addDoc(collection(db, "videos"), {
              userId: null,
              longitude,
              latitude,
              videoId: null,
              startTime: serverTimestamp(),
              streamKey: null,
              playbackId: null,
              category: null,
            });
            handleStartStream();
          } catch (error) {
            console.error("Error saving to Firestore:", error);
            alert("Failed to save stream data. Please try again.");
          }

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

  return (
    <button className="record-button" onClick={handleClick} disabled={isLoading}>
      Record Now
    </button>
  );
};

GoLiveButton.propTypes = {
  handleStartStream: PropTypes.func.isRequired,
};

export default GoLiveButton;
