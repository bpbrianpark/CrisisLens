import { useState, useEffect } from "react";
import * as Broadcast from "@livepeer/react/broadcast";
import { getIngest } from "@livepeer/react/external";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

export default function StreamBroadcast({ streamKey, onClose }) {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      {/* Broadcast Video */}
      <Broadcast.Root
        ingestUrl={getIngest(streamKey)}
        forceEnabled={true}
        audio={false}
        onError={(error) =>
          error?.type === "permissions"
            ? toast.error("You must accept permissions to broadcast. Please try again.")
            : toast.error("An error occurred while broadcasting.")
        }
      >
        <Broadcast.Container className="h-full w-full bg-gray-950 relative">
          <Broadcast.Video
            playsInline
            muted
            title="Current Livestream"
            className="h-full w-full object-cover"
          />

          {/* Overlay: Timer and Close Button */}
          <div
            style={{
              position: "absolute",
              top: "0px",
              left: "0",
              right: "0",
              zIndex: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 20px",
              background: "#000000",
              paddingTop: "8px",
              paddingBottom: "8px",
            }}
          >
            {/* Left: Live */}
            <span
              style={{
                fontWeight: "bold",
                color: "#ff6b6b",
                fontSize: "18px",
              }}
              className="text-sm font-semibold"
            >
              LIVE
            </span>

            {/* Center: Timer */}
            <div
              style={{
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              {formatTime(timer)}
            </div>

            {/* Right: Close Button */}
            <button
              onClick={onClose}
              style={{
                // backgroundColor: "rgba(255, 255, 255, 0.2)",
                backgroundColor: "#ff6b6b",
                color: "white",
                padding: "3px 5px",
                fontWeight: "bold",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.3s",
                fontSize: "18px",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.4)")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)")}
            >
              End
            </button>
          </div>
        </Broadcast.Container>
      </Broadcast.Root>
    </div>
  );
}

StreamBroadcast.propTypes = {
  streamKey: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
