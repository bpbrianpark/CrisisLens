import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import { PlayIcon, PauseIcon } from "@livepeer/react/assets";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Livepeer } from "livepeer";

export const getPlaybackSource = async ({ playbackId }) => {
  try {
    const livepeer = new Livepeer({ apiKey: import.meta.env.VITE_LIVEPEER_API_KEY });
    const playbackInfo = await livepeer.playback.get(playbackId);
    const src = getSrc(playbackInfo.playbackInfo);
    return src;
  } catch (error) {
    console.error("Error getting playback info:", error);
    throw error;
  }
};

export default function VODPlayer({ playbackId }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(null);
  const mediaElementRef = useRef(null);
  const autoPlayButtonRef = useRef(null);

  useEffect(() => {
    const loadPlaybackSource = async () => {
      try {
        setLoading(true);
        // Use the getPlaybackSource function
        const playbackUrl = await getPlaybackSource(playbackId);
        console.log("VOD URL:", playbackUrl);

        if (playbackUrl) {
          setSrc(playbackUrl);
        } else {
          const hlsUrl = `https://livepeercdn.com/hls/${playbackId}/index.m3u8`;
          console.log("Falling back to HLS URL:", hlsUrl);
          setSrc(hlsUrl);
        }
      } catch (error) {
        console.error("Error setting up video:", error);
        setVideoError(error);
      } finally {
        setLoading(false);
      }
    };

    loadPlaybackSource();
  }, [playbackId]);

  useEffect(() => {
    if (autoPlayButtonRef.current) {
      const clickAutoPlayButton = () => {
        console.log("Clicking auto-play button");
        autoPlayButtonRef.current.click();
      };
      clickAutoPlayButton();
      const timeoutId = setTimeout(clickAutoPlayButton, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [src]);

  if (loading) return <p>Loading player...</p>;
  if (!src)
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        <p>Playback source not found for livestream.</p>
        <p className="text-sm">PlaybackId: {playbackId}</p>
      </div>
    );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vw",
        background: "transparent",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        ref={autoPlayButtonRef}
        onClick={() => {
          const playButton = document.querySelector('[aria-label="Play"]');
          if (playButton) {
            playButton.click();
          }
          if (mediaElementRef.current) {
            mediaElementRef.current.play().catch((err) => console.error("Failed to play:", err));
          }
        }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      <Player.Root
        src={src}
        onError={(error) => {
          console.error("Player error:", error);
          setVideoError(error);
        }}
      >
        <Player.Container
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "black",
          }}
        >
          <Player.Video
            title="Livestream"
            style={{
              width: "100vw",
              height: "80vh",
              maxWidth: "none",
              maxHeight: "none",
              objectFit: "cover",
            }}
            autoPlay
            muted
            ref={mediaElementRef}
            onError={(e) => console.error("Video element error:", e)}
            onLoadStart={() => console.log("Livestream loading started")}
            onLoadedData={() => console.log("Livestream data loaded")}
            onPlay={() => console.log("Livestream started playing")}
          />

          <Player.Controls
            style={{
              position: "absolute",
              bottom: "10%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <Player.PlayPauseTrigger className="w-16 h-16 hover:scale-105 flex-shrink-0">
              <Player.PlayingIndicator asChild matcher={false}>
                <PlayIcon className="w-full h-full text-white" />
              </Player.PlayingIndicator>
              <Player.PlayingIndicator asChild>
                <PauseIcon className="w-full h-full text-white" />
              </Player.PlayingIndicator>
            </Player.PlayPauseTrigger>
          </Player.Controls>

          <Player.LoadingIndicator asChild>
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                background: "rgba(0,0,0,0.5)",
                padding: "8px 16px",
                borderRadius: "20px",
                color: "white",
                fontSize: "14px",
              }}
            >
              Loading livestream...
            </div>
          </Player.LoadingIndicator>

          <Player.LiveIndicator>
            <div
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#ff0000",
                padding: "8px 16px",
                borderRadius: "20px",
                color: "white",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "white",
                  animation: "pulse 2s infinite",
                }}
              />
              LIVE
            </div>
          </Player.LiveIndicator>
        </Player.Container>
      </Player.Root>

      {videoError && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            color: "red",
            background: "rgba(0,0,0,0.5)",
            padding: "8px 16px",
            borderRadius: "20px",
            zIndex: 999999,
          }}
        >
          Error: {JSON.stringify(videoError)}
        </div>
      )}
    </div>
  );
}

VODPlayer.propTypes = {
  playbackId: PropTypes.string.isRequired,
};
