import { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { motion, useAnimationControls } from "framer-motion";
import PropTypes from "prop-types";
import { Livepeer } from "livepeer";
import { getSrc } from "@livepeer/react/external";
import VODPlayer from "../livepeer/VODPlayer";
import StreamPlayer from "../livepeer/StreamPlayer";

import "./VideoScroll.css";
import { getCrisisType } from "../../constants/crisisTypes";

const livepeer = new Livepeer({ apiKey: import.meta.env.VITE_LIVEPEER_API_KEY });

const VideoScroll = ({ videos, currentVideoIndex, onVideoChange, onClose }) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [locationNames, setLocationNames] = useState({});
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stagedNextIndex, setStagedNextIndex] = useState(1);
  const [srcCache, setSrcCache] = useState(new Map());
  const [index, setIndex] = useState(currentVideoIndex ?? 0);
  const containerRef = useRef(null);
  const locationNamesRef = useRef({});
  const controls = useAnimationControls();

  const prefetchSrc = useCallback(
    async (video) => {
      if (!video || !video.playbackId || srcCache.has(video.playbackId) || video.isLiveStream) return;
      try {
        const info = await livepeer.playback.get(video.playbackId);
        const src = getSrc(info.playbackInfo) ?? `https://livepeercdn.com/hls/${video.playbackId}/index.m3u8`;
        setSrcCache((prev) => new Map(prev).set(video.playbackId, src));
      } catch {
        setSrcCache((prev) =>
          new Map(prev).set(video.playbackId, `https://livepeercdn.com/hls/${video.playbackId}/index.m3u8`)
        );
      }
    },
    [srcCache]
  );

  const nearbyVideos = videos;

  const getLocationName = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,locality,neighborhood&access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`,
        {
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.features && data.features.length > 0) {
        // Get the most specific place name (usually the first feature)
        const place = data.features[0];
        
        // Try to get city and state/country from context
        let city = null;
        let state = null;
        let country = null;

        // Check if the first feature is a place/locality
        if (place.place_type.includes('place') || place.place_type.includes('locality')) {
          city = place.text;
        }

        // Parse context for state/region and country
        if (place.context) {
          for (const ctx of place.context) {
            if (ctx.id.startsWith('region')) {
              state = ctx.text;
            } else if (ctx.id.startsWith('country')) {
              country = ctx.text;
            } else if (!city && (ctx.id.startsWith('place') || ctx.id.startsWith('locality'))) {
              city = ctx.text;
            }
          }
        }

        // Format the location string
        if (city && state) {
          return `${city}, ${state}`;
        } else if (city && country) {
          return `${city}, ${country}`;
        } else if (city) {
          return city;
        } else if (state && country) {
          return `${state}, ${country}`;
        } else if (place.place_name) {
          // Use the full place name as fallback
          return place.place_name.split(',').slice(0, 2).join(',');
        }
      }

      return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("Geocoding request timed out:", lat, lng);
      } else {
        console.warn("Geocoding failed:", error.message);
      }
      return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    }
  }, []);

  useEffect(() => {
    locationNamesRef.current = locationNames;
  }, [locationNames]);

  useEffect(() => {
    let isCancelled = false;

    const fetchLocationNames = async () => {
      setLoadingLocations(true);

      // Get first 10 videos and filter out ones we already have
      const videosToProcess = nearbyVideos.slice(0, 10).filter((video) => {
        if (!video.latitude || !video.longitude) return false;
        const key = `${video.latitude},${video.longitude}`;
        return !locationNamesRef.current[key];
      });

      if (videosToProcess.length === 0) {
        setLoadingLocations(false);
        return;
      }

      // Fetch all locations in parallel for much faster loading
      const locationPromises = videosToProcess.map(async (video) => {
        const key = `${video.latitude},${video.longitude}`;
        try {
          const locationName = await getLocationName(video.latitude, video.longitude);
          return { key, locationName };
        } catch (error) {
          console.warn(`Failed to geocode ${key}:`, error);
          return { key, locationName: `${video.latitude.toFixed(2)}, ${video.longitude.toFixed(2)}` };
        }
      });

      try {
        const results = await Promise.all(locationPromises);
        
        if (!isCancelled) {
          const newLocationNames = {};
          results.forEach(({ key, locationName }) => {
            newLocationNames[key] = locationName;
          });

          if (Object.keys(newLocationNames).length > 0) {
            setLocationNames((prev) => ({ ...prev, ...newLocationNames }));
          }
        }
      } catch (error) {
        console.error("Error fetching location names:", error);
      } finally {
        if (!isCancelled) {
          setLoadingLocations(false);
        }
      }
    };

    if (nearbyVideos.length > 0) {
      fetchLocationNames();
    }

    return () => {
      isCancelled = true;
    };
  }, [nearbyVideos, getLocationName]);

  const formatDuration = useCallback((duration) => {
    if (!duration || duration === 0) return "--:--";

    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const preloadVideos = useCallback(() => {
    if (nearbyVideos.length === 0) return;

    const preloadCount = 10;

    for (let i = 0; i < preloadCount; i++) {
      const nextIndex = (index + i + 1) % nearbyVideos.length;
      const prevIndex = (index - i - 1 + nearbyVideos.length) % nearbyVideos.length;
      prefetchSrc(nearbyVideos[nextIndex]);
      prefetchSrc(nearbyVideos[prevIndex]);
    }
  }, [index, nearbyVideos, prefetchSrc]);

  useEffect(() => {
    prefetchSrc(nearbyVideos[index]);
  }, [index, nearbyVideos, prefetchSrc]);

  const computeNext = useCallback(
    (current, direction) => {
      if (direction === "down") return (current + 1) % nearbyVideos.length;
      return (current - 1 + nearbyVideos.length) % nearbyVideos.length;
    },
    [nearbyVideos.length]
  );

  const prevPropIndexRef = useRef(currentVideoIndex);
  useEffect(() => {
    if (currentVideoIndex == null) return;
    if (currentVideoIndex === prevPropIndexRef.current) return;
    prevPropIndexRef.current = currentVideoIndex;
    setIndex(currentVideoIndex);
    setStagedNextIndex(computeNext(currentVideoIndex, "down"));
  }, [currentVideoIndex, computeNext]);

  const handleScroll = useCallback(
    async (direction) => {
      if (isScrolling || isTransitioning || nearbyVideos.length <= 1) return;

      setIsScrolling(true);
      setIsTransitioning(true);

      const next = computeNext(index, direction);
      setStagedNextIndex(next);

      await controls.start({
        y: direction === "down" ? "-50%" : "50%",
        transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
      });

      flushSync(() => {
        setIndex(next);
      });

      onVideoChange?.(next);
      preloadVideos();

      controls.set({ y: "0%" });

      const nextNext = computeNext(next, direction);
      setStagedNextIndex(nextNext);

      setIsTransitioning(false);
      setIsScrolling(false);
    },
    [isScrolling, isTransitioning, nearbyVideos.length, computeNext, index, controls, onVideoChange, preloadVideos]
  );

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        handleScroll(e.key === "ArrowUp" ? "up" : "down");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleScroll]);

  useEffect(() => {
    if (nearbyVideos.length > 0) {
      setIsInitialLoading(false);
      preloadVideos();
    }
  }, [nearbyVideos, preloadVideos]);

  if (!nearbyVideos.length) {
    return (
      <div className="video-scroll-container">
        <div className="video-scroll-content">
          <div className="no-videos-message">
            <h3>No videos in this area</h3>
            <p>No videos found within 50km of your location</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="video-scroll-container">
        <div className="video-scroll-content">
          <div className="initial-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading videos...</div>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  const currentVideo = nearbyVideos[index];

  return (
    <div className="video-scroll-container" ref={containerRef}>
      <div className="video-scroll-content">
        <div className="video-main">
          <motion.div className="stack-wrapper" initial={false}>
            <motion.div className="stack" animate={controls} initial={{ y: "0%" }}>
              <div className="stack-item">
                {currentVideo.isLiveStream ? (
                  <StreamPlayer
                    key={`live-${currentVideo.playbackId ?? stagedNextIndex}`}
                    selectedCluster={{ fires: [currentVideo] }}
                    onClose={onClose}
                    isEmbedded
                  />
                ) : (
                  <VODPlayer
                    key={`vod-${currentVideo.playbackId}`}
                    playbackId={currentVideo.playbackId}
                    srcOverride={srcCache.get(currentVideo.playbackId)}
                    onClose={onClose}
                    isEmbedded
                  />
                )}
              </div>
              <div className="stack-item">
                {(() => {
                  const nextVideo = nearbyVideos[stagedNextIndex];
                  if (!nextVideo) return null;

                  return nextVideo.isLiveStream ? (
                    <StreamPlayer
                      key={`live-${nextVideo.playbackId ?? stagedNextIndex}`}
                      selectedCluster={{ fires: [nextVideo] }}
                      onClose={onClose}
                      isEmbedded
                    />
                  ) : (
                    <VODPlayer
                      key={`vod-${nextVideo.playbackId}`}
                      playbackId={nextVideo.playbackId}
                      srcOverride={srcCache.get(nextVideo.playbackId)}
                      onClose={onClose}
                      isEmbedded
                    />
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="video-navigation">
          <button
            className={`nav-arrow nav-arrow-up ${isScrolling ? "disabled" : ""}`}
            onClick={() => handleScroll("up")}
            disabled={isScrolling || nearbyVideos.length <= 1}
            aria-label="Next video"
          >
            ↑
          </button>

          <button
            className={`nav-arrow nav-arrow-down ${isScrolling ? "disabled" : ""}`}
            onClick={() => handleScroll("down")}
            disabled={isScrolling || nearbyVideos.length <= 1}
            aria-label="Previous video"
          >
            ↓
          </button>
        </div>

        <div className="video-info-overlay">
          <div className="video-info">
            <h3 className="video-title">{currentVideo.isLiveStream ? "Live Stream" : "Recorded Video"}</h3>
            <p className="video-location">
              📍{" "}
              {loadingLocations
                ? "Loading location..."
                : locationNames[`${currentVideo.latitude},${currentVideo.longitude}`] ||
                  `${currentVideo.latitude?.toFixed(2)}, ${currentVideo.longitude?.toFixed(2)}`}
            </p>
            {currentVideo?.crisis && <p className="video-location">🚨 {getCrisisType(currentVideo.crisis).label}</p>}
            {currentVideo.duration && !currentVideo.isLiveStream && (
              <p className="video-duration-info">⏱️ {formatDuration(currentVideo.duration)}</p>
            )}
          </div>
        </div>

        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

VideoScroll.propTypes = {
  videos: PropTypes.array.isRequired,
  currentVideoIndex: PropTypes.number,
  onVideoChange: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  userLocation: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
  }),
};

export default VideoScroll;
