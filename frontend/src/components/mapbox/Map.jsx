import { useEffect, useState } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import CrisisMarker from "./CrisisMarker";
import NewsMarker from "./NewsMarker";
import ClosureMarker from "./ClosureMarker";
import ClosurePopover from "./ClosurePopover";
import NewsModal from "../NewsModal/NewsModal";
import VideoScroll from "../VideoScroll/VideoScroll";
import MapThemeToggle from "./MapThemeToggle";
import { useMapInitialization } from "../../hooks/useMapInitialization";
import { useCrisisData } from "../../hooks/useCrisisData";
import { useNewsData } from "../../hooks/useNewsData";
import { useCrisisClustering } from "../../hooks/useCrisisClustering";
import { useNewsClustering } from "../../hooks/useNewsClustering";
import { useMapLayers } from "../../hooks/useMapLayers";
import { useStreamPlayer } from "../../hooks/useStreamPlayer";
import { useNewsModal } from "../../hooks/useNewsModal";
import { useTrafficData } from "../../hooks/useTrafficData";
import { useClosurePopover } from "../../hooks/useClosurePopover";
import { useEmergencyData } from "../../hooks/useEmergencyData";
import { useEmergencyPopover } from "../../hooks/useEmergencyPopover";
import EmergencyMarker from "./EmergencyMarker";
import EmergencyPopover from "./EmergencyPopover";
import { useVideoScroll } from "../../hooks/useVideoScroll";

function Map() {
  const { mapRef, mapContainerRef, mapLoaded } = useMapInitialization();
  const { crisisData, crisisLocations } = useCrisisData(mapLoaded);
  const { newsLoaded, newsLocations, newsArticlesForLocation } = useNewsData(crisisLocations);
  const { crisesClusters, updateClusters } = useCrisisClustering(crisisData, mapRef, mapLoaded);
  const { newsClusters, updateNewsClusters } = useNewsClustering(
    newsLocations,
    newsArticlesForLocation,
    mapRef,
    mapLoaded
  );
  const { selectedNews, locationNames, isModalOpen, openModal, closeModal } = useNewsModal();
  const { closeStream } = useStreamPlayer();
  const { trafficLoaded, trafficLocations } = useTrafficData(mapLoaded);
  const { selectedClosureEvent, openClosurePopover, closeClosurePopover } = useClosurePopover();
  const { emergencyLoaded, emergencyLocations } = useEmergencyData(mapLoaded);
  const { selectedEmergencyEvent, openEmergencyPopover, closeEmergencyPopover } = useEmergencyPopover();
  const [mapCenter, setMapCenter] = useState(null);
  const [mapStyleVersion, setMapStyleVersion] = useState(0);
  const { showVideoScroll, currentVideoIndex, filteredVideos, openVideoScroll, closeVideoScroll, changeVideo } =
    useVideoScroll(crisisData, mapCenter, closeStream);

  useMapLayers(crisisData, mapRef, mapLoaded);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const currentMap = mapRef.current;
    const c = currentMap.getCenter();
    setMapCenter({ latitude: c.lat, longitude: c.lng });

    let debounceTimeout = null;
    const handleMoveEnd = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        updateClusters();
        updateNewsClusters();
        const center = currentMap.getCenter();
        setMapCenter({ latitude: center.lat, longitude: center.lng });
      }, 150);
    };

    currentMap.on("moveend", handleMoveEnd);

    return () => {
      currentMap.off("moveend", handleMoveEnd);
      clearTimeout(debounceTimeout);
    };
  }, [mapLoaded, updateClusters, updateNewsClusters, mapRef]);

  // Handle map style changes and re-apply layers
  useEffect(() => {
    if (mapStyleVersion > 0) {
      // Give the style time to fully load before updating
      const timer = setTimeout(() => {
        updateClusters();
        updateNewsClusters();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapStyleVersion, updateClusters, updateNewsClusters]);

  const handleThemeChange = () => {
    // Increment version to trigger layer re-application
    setMapStyleVersion((prev) => prev + 1);
  };

  return (
    <>
      <div id="map-container" ref={mapContainerRef} style={{ height: "100vh" }} />

      {mapLoaded && <MapThemeToggle map={mapRef.current} onThemeChange={handleThemeChange} />}

      {mapLoaded &&
        crisesClusters.map((cluster, index) => (
          <CrisisMarker
            key={index}
            map={mapRef.current}
            location={cluster.center}
            count={cluster.crises.length}
            crises={cluster.crises}
            onClick={() => {
              openVideoScroll(cluster);
              console.log(cluster);
            }}
          />
        ))}

      {mapLoaded &&
        newsLoaded &&
        newsClusters.map((cluster, index) => (
          <NewsMarker
            key={`news-${index}`}
            map={mapRef.current}
            location={cluster.center}
            news={cluster.locations.flatMap((location) => location.articles)}
            count={cluster.locations.length}
            locationNames={cluster.locations.map((location) => location.name)}
            onClick={(news, locationNames) => openModal(news, locationNames)}
          />
        ))}

      {mapLoaded &&
        trafficLoaded &&
        trafficLocations.map((event, index) => (
          <ClosureMarker
            key={index}
            map={mapRef.current}
            location={event.coordinates}
            event={event}
            onClick={openClosurePopover}
          />
        ))}

      {selectedClosureEvent && (
        <ClosurePopover
          map={mapRef.current}
          location={selectedClosureEvent.coordinates}
          event={selectedClosureEvent}
          onClose={closeClosurePopover}
        />
      )}

      {/* Emergency Markers */}
      {mapLoaded &&
        emergencyLoaded &&
        emergencyLocations.map((event, index) => (
          <EmergencyMarker
            key={index}
            map={mapRef.current}
            location={event.coordinates}
            event={event}
            onClick={openEmergencyPopover}
          />
        ))}

      {/* Emergency Popover */}
      {selectedEmergencyEvent && (
        <EmergencyPopover
          map={mapRef.current}
          location={selectedEmergencyEvent.coordinates}
          event={selectedEmergencyEvent}
          onClose={closeEmergencyPopover}
        />
      )}

      {/* News Modal */}
      <NewsModal
        isOpen={isModalOpen}
        news={selectedNews}
        onClose={closeModal}
        locationName={locationNames && locationNames.length > 0 ? locationNames.join(", ") : null}
      />

      {showVideoScroll && (
        <VideoScroll
          videos={filteredVideos}
          currentVideoIndex={currentVideoIndex}
          onVideoChange={changeVideo}
          onClose={closeVideoScroll}
        />
      )}
    </>
  );
}

export default Map;
