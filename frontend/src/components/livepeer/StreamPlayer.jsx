import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import { PlayIcon, PauseIcon } from "@livepeer/react/assets";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

import "./playback.css";
import LoadingOverlay from "./LoadingOverlay";
import { Livepeer } from "livepeer";

const getPlaybackSource = async ({ playbackId }) => {
  try {
    const livepeer = new Livepeer({ apiKey: import.meta.env.VITE_LIVEPEER_API_KEY });
    const playbackInfo = await livepeer.playback.get(playbackId);
    const src = getSrc(playbackInfo.playbackInfo);
    return src;
  } catch (error) {
    console.log("help! playback error", error);
    throw error;
  }
};

export default function StreamPlayer({ selectedCluster, onClose, isEmbedded = false }) {
  const playbackId = selectedCluster.fires[0].playbackId;
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overlayLoading, setOverlayLoading] = useState(true);
  const [videoError, setVideoError] = useState(null);
  const mediaElementRef = useRef(null);
  const autoPlayButtonRef = useRef(null);

  useEffect(() => {
    const loadPlaybackSource = async () => {
      try {
        setLoading(true);
        const playbackUrl = await getPlaybackSource({ playbackId });

        if (playbackUrl) {
          setSrc(playbackUrl);
        } else {
          const hlsUrl = `https://livepeercdn.com/hls/${playbackId}/index.m3u8`;
          setSrc(hlsUrl);
        }
      } catch (error) {
        console.error("Error setting up livestream:", error);
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
        autoPlayButtonRef.current.click();
      };
      clickAutoPlayButton();
      const timeoutId = setTimeout(clickAutoPlayButton, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [src]);

  if (loading) return <div className="player-loading"></div>;
  if (!src)
    return (
      <div className="playback-error-message">
        <p>Playback source not found for livestream.</p>
        <p className="text-sm">PlaybackId: {playbackId}</p>
      </div>
    );

  return (
    <div className={`player ${isEmbedded ? "player-embedded" : ""}`}>
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
        className="play-button"
        aria-hidden="true"
      />
      <div className="player-root" />
      <Player.Root
        src={src}
        onError={(error) => {
          console.error("Player error:", error);
          setVideoError(error);
        }}
      >
        <Player.Container className="player-container">
          <LoadingOverlay 
            isLoading={overlayLoading} 
            duration={3000}
            message="Loading..."
            onComplete={() => setOverlayLoading(false)}
          />
          <Player.Video
            title="Livestream"
            className="player-video"
            autoPlay
            playsInline
            preload="auto"
            muted={true}
            ref={mediaElementRef}
            quality={{
              auto: false,
              levels: [
                { name: "480p_high_quality", bitrate: 2500000 }
              ]
            }}
            adaptiveBitrate={false}                              
            onError={(e) => console.error("Video element error:", e)}
            onLoadStart={() => {}}
            onLoadedData={() => {}}
            onPlay={() => {}}
          />
          {!isEmbedded && (
            <button onClick={onClose} className="close-button">
              Close
            </button>
          )}

          <Player.Controls className="controls">
            <Player.PlayPauseTrigger className="pause-trigger">
              <Player.PlayingIndicator asChild matcher={false}>
                <PlayIcon className="player-icon" />
              </Player.PlayingIndicator>
              <Player.PlayingIndicator asChild>
                <PauseIcon className="player-icon" />
              </Player.PlayingIndicator>
            </Player.PlayPauseTrigger>
          </Player.Controls>

          {!isEmbedded && (
            <Player.LoadingIndicator asChild>
              <div className="loading-indicator">Loading livestream...</div>
            </Player.LoadingIndicator>
          )}

          <Player.LiveIndicator>
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                background: "#ff4444",
                padding: "2px 8px",
                borderRadius: "8px",
                color: "white",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div className="live-indicator" />
              LIVE
            </div>
          </Player.LiveIndicator>
        </Player.Container>
      </Player.Root>

      {videoError && <div className="playback-error">Error: {JSON.stringify(videoError)}</div>}
    </div>
  );
}

StreamPlayer.propTypes = {
  selectedCluster: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  isEmbedded: PropTypes.bool,
};
