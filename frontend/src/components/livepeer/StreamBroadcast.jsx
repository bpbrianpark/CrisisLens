import { useState, useEffect } from "react";
import * as Broadcast from "@livepeer/react/broadcast";
import { getIngest } from "@livepeer/react/external";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

import "./stream-broadcast.css";

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
    <div className="broadcast-container">
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
        <Broadcast.Container className="broadcast-body">
          <Broadcast.Video playsInline muted title="Current Livestream" className="broadcast" />

          <div className="broadcast-overlay">
            <span className="live-indicator">LIVE</span>

            <div className="timer">{formatTime(timer)}</div>

            <button onClick={onClose} className="end-button">
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
