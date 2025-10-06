import { useState, useCallback, useEffect } from "react";

export const useVideoScroll = (fireData, viewportCenter, closeStream) => {
  const [showVideoScroll, setShowVideoScroll] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [filteredVideos, setFilteredVideos] = useState([]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getNearbyVideos = useCallback(() => {
    if (!viewportCenter || !fireData.length) return [];

    const maxDistance = 50;
    return fireData
      .filter((video) => {
        if (!video.latitude || !video.longitude) return false;
        const distance = calculateDistance(
          viewportCenter.latitude,
          viewportCenter.longitude,
          video.latitude,
          video.longitude
        );
        return distance <= maxDistance;
      })
      .sort((a, b) => {
        const distanceA = calculateDistance(viewportCenter.latitude, viewportCenter.longitude, a.latitude, a.longitude);
        const distanceB = calculateDistance(viewportCenter.latitude, viewportCenter.longitude, b.latitude, b.longitude);
        return distanceA - distanceB;
      });
  }, [fireData, viewportCenter]);

  useEffect(() => {
    const nearbyVideos = getNearbyVideos();
    setFilteredVideos(nearbyVideos);
  }, [getNearbyVideos]);

  const openVideoScroll = useCallback(
    (initialIndex = 0) => {
      const nearbyVideos = getNearbyVideos();
      if (nearbyVideos.length === 0) {
        console.warn("No videos found in the area");
        return;
      }

      if (closeStream) {
        closeStream();
      }

      setCurrentVideoIndex(Math.min(initialIndex, nearbyVideos.length - 1));
      setShowVideoScroll(true);
    },
    [getNearbyVideos, closeStream]
  );

  const closeVideoScroll = useCallback(() => {
    setShowVideoScroll(false);
    setCurrentVideoIndex(0);
  }, []);

  const changeVideo = useCallback(
    (newIndex) => {
      if (newIndex >= 0 && newIndex < filteredVideos.length) {
        setCurrentVideoIndex(newIndex);
      }
    },
    [filteredVideos.length]
  );

  const getCurrentVideo = useCallback(() => {
    return filteredVideos[currentVideoIndex] || null;
  }, [filteredVideos, currentVideoIndex]);

  const hasNextVideo = currentVideoIndex < filteredVideos.length - 1;
  const hasPreviousVideo = currentVideoIndex > 0;

  return {
    showVideoScroll,
    currentVideoIndex,
    filteredVideos,
    currentVideo: getCurrentVideo(),
    hasNextVideo,
    hasPreviousVideo,
    openVideoScroll,
    closeVideoScroll,
    changeVideo,
  };
};
