import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import { PlayIcon, PauseIcon } from "@livepeer/react/assets";
import { useState, useEffect, useRef } from "react";
import { Livepeer } from "livepeer";

import './vod-player.css'

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

export default function VODPlayer({ playbackId, onClose }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(null);
  const mediaElementRef = useRef(null);
  const autoPlayButtonRef = useRef(null);

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
      className="vod-player"
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
        className="play-button"
        aria-hidden="true"
      />
      <div
        className="vod-player-root"
      />
      <Player.Root
        src={src}
        onError={(error) => {
          console.error("Player error:", error);
          setVideoError(error);
        }}
      >
        <Player.Container
          className="vod-player-container"
        >
          <Player.Video
            title="Livestream"
            className="vod-player-video"
            autoPlay
            muted
            ref={mediaElementRef}
            onError={(e) => console.error("Video element error:", e)}
            onLoadStart={() => {}}
            onLoadedData={() => {}}
            onPlay={() => {}}
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
          className="vod-error"
        >
          Error: {JSON.stringify(videoError)}
        </div>
      )}
    </div>
  );
}
