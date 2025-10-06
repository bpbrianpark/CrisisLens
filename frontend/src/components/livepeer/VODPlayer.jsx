import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import { PlayIcon, PauseIcon } from "@livepeer/react/assets";
import { useState, useEffect, useRef } from "react";
import { Livepeer } from "livepeer";
import PropTypes from "prop-types";

import './playback.css'

// Helper function to get playback source
const getPlaybackSource = async ({ playbackId }) => {
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

export default function VODPlayer({ playbackId, onClose }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(null);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const mediaElementRef = useRef(null);

  useEffect(() => {
    const loadPlaybackSource = async () => {
      try {
        setLoading(true);
        const playbackUrl = await getPlaybackSource({playbackId});

        if (playbackUrl) {
          setSrc(playbackUrl);
        } else {
          const hlsUrl = `https://livepeercdn.com/hls/${playbackId}/index.m3u8`;
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

  // Handle autoplay when video is ready
  useEffect(() => {
    if (mediaElementRef.current && src) {
      const videoElement = mediaElementRef.current;
      
      const handleCanPlay = () => {
        // Only attempt to play if the video is paused
        if (videoElement.paused) {
          videoElement.play().catch((error) => {
            console.log("Autoplay prevented by browser:", error);
            // This is normal - browsers often prevent autoplay
            // Show the play button for manual start
            setAutoplayFailed(true);
          });
        }
      };

      videoElement.addEventListener('canplay', handleCanPlay);
      
      return () => {
        videoElement.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [src]);

  if (loading) return <p>Loading player...</p>;
  if (!src)
    return (
      <div className="playback-error-message">
        <p>Playback source not found for livestream.</p>
        <p className="text-sm">PlaybackId: {playbackId}</p>
      </div>
    );

  return (
    <div
      className="player"
    >
      {/* Manual play button for when autoplay fails */}
      {autoplayFailed && (
        <button
          onClick={() => {
            if (mediaElementRef.current) {
              mediaElementRef.current.play().then(() => {
                setAutoplayFailed(false);
              }).catch((error) => {
                console.error("Failed to play video:", error);
              });
            }
          }}
          className="manual-play-button"
        >
          ▶
        </button>
      )}
      <div
        className="player-root"
      />
      <Player.Root
        src={src}
        onError={(error) => {
          console.error("Player error:", error);
          if (error && error !== null) {
            setVideoError(error);
          }
        }}
      >
        <Player.Container
          className="player-container"
        >
          <Player.Video
            title="Livestream"
            className="player-video"
            autoPlay
            muted
            ref={mediaElementRef}
            onError={(e) => {
              console.error("Video element error:", e);
              // Only set error if it's a meaningful error
              if (e && e.target && e.target.error) {
                setVideoError(e.target.error);
              }
            }}
            onLoadStart={() => {}}
            onLoadedData={() => {}}
            onPlay={() => {
              setAutoplayFailed(false);
            }}
          />
          <button
            onClick={onClose}
            className="close-button"
          >
            Close
          </button>
          <Player.Controls
            className="controls"
          >
            <Player.PlayPauseTrigger className="pause-trigger">
              <Player.PlayingIndicator asChild matcher={false}>
                <PlayIcon className="player-icon" />
              </Player.PlayingIndicator>
              <Player.PlayingIndicator asChild>
                <PauseIcon className="player-icon" />
              </Player.PlayingIndicator>
            </Player.PlayPauseTrigger>
          </Player.Controls>

          <Player.LoadingIndicator asChild>
            <div
              className="loading-indicator"
            >
              Loading clip...
            </div>
          </Player.LoadingIndicator>

          <Player.LiveIndicator>
            <div
              className="live-indicator-container"
            >
              <div
                className='live-indicator'
              />
              LIVE
            </div>
          </Player.LiveIndicator>
        </Player.Container>
      </Player.Root>

      {videoError && (
        <div
          className="playback-error"
        >
          Error: {JSON.stringify(videoError)}
        </div>
      )}
    </div>
  );
}

VODPlayer.propTypes = {
  playbackId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
