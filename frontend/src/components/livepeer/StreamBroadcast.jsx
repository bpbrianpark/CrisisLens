import { useState, useEffect } from "react";
import * as Broadcast from "@livepeer/react/broadcast";
import { getIngest } from "@livepeer/react/external";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

export default function StreamBroadcast({ streamKey, onClose }) {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let intervalId;

    intervalId = setInterval(() => {
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
      <div
        className="absolute top-4 w-full flex flex-row items-center justify-between px-8"
        style={{ zIndex: 10001 }}
      >
        {/* Left: Recording Icon */}
        <div className="flex items-center gap-2">
          <div className="bg-red-500 h-2 w-2 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-white">LIVE</span>
        </div>

        {/* Center: Timer */}
        <div className="text-sm font-semibold text-white">
          {formatTime(timer)}
        </div>

        {/* Right: Close Button */}
        <button
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>

      {/* Broadcast Video */}
      <Broadcast.Root
        ingestUrl={getIngest(streamKey)}
        forceEnabled={true}
        onError={(error) =>
          error?.type === "permissions"
            ? toast.error("You must accept permissions to broadcast. Please try again.")
            : toast.error("An error occurred while broadcasting.")
        }
      >
        <Broadcast.Container className="h-full w-full bg-gray-950 relative">
          <Broadcast.Video autoPlay title="Current Livestream" className="h-full w-full object-cover" />
        </Broadcast.Container>
      </Broadcast.Root>
    </div>
  );
}

StreamBroadcast.propTypes = {
  streamKey: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
