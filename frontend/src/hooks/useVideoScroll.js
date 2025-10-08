import { useState, useCallback, useEffect } from "react";

export const useVideoScroll = (fireData, viewportCenter, closeStream) => {
  const [showVideoScroll, setShowVideoScroll] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [referenceLocation, setReferenceLocation] = useState(null);

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

  const getNearbyVideos = useCallback((clickedCluster = null) => {
    if (!viewportCenter || !fireData.length) return [];

    const maxDistance = 50;
    
    // If we have a clicked cluster, use its location as reference
    const refLat = clickedCluster ? clickedCluster.center[1] : viewportCenter.latitude;
    const refLon = clickedCluster ? clickedCluster.center[0] : viewportCenter.longitude;
    
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
        const distanceA = calculateDistance(refLat, refLon, a.latitude, a.longitude);
        const distanceB = calculateDistance(refLat, refLon, b.latitude, b.longitude);
        return distanceA - distanceB;
      });
  }, [fireData, viewportCenter]);

  useEffect(() => {
    // Only update if we don't have a reference location set
    // (i.e., this is a passive update, not from a click)
    if (!referenceLocation) {
      const nearbyVideos = getNearbyVideos();
      setFilteredVideos(nearbyVideos);
    }
  }, [getNearbyVideos, referenceLocation]);

  const openVideoScroll = useCallback(
    (clickedCluster) => {
      // Get videos sorted by distance from the clicked cluster
      const nearbyVideos = getNearbyVideos(clickedCluster);
      if (nearbyVideos.length === 0) {
        console.warn("No videos found in the area");
        return;
      }

      if (closeStream) {
        closeStream();
      }

      // Store the reference location for this session
      if (clickedCluster && clickedCluster.center) {
        setReferenceLocation({
          latitude: clickedCluster.center[1],
          longitude: clickedCluster.center[0],
        });
      }

      setFilteredVideos(nearbyVideos);
      setCurrentVideoIndex(0); // Start with the first video (closest to clicked fire)
      setShowVideoScroll(true);
    },
    [getNearbyVideos, closeStream]
  );

  const closeVideoScroll = useCallback(() => {
    setShowVideoScroll(false);
    setCurrentVideoIndex(0);
    setReferenceLocation(null); // Reset reference location when closing
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
