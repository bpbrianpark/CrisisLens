import { useEffect, useState } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import CrisisMarker from "./CrisisMarker";
// import NewsMarker from "./NewsMarker";
import ClosureMarker from "./ClosureMarker";
// import NewsModal from "../NewsModal/NewsModal";
import VideoScroll from "../VideoScroll/VideoScroll";
import MapThemeToggle from "./MapThemeToggle";
import IncidentDetailCard from "../IncidentDetail/IncidentDetailCard";
import { useMapInitialization } from "../../hooks/useMapInitialization";
import { useCrisisData } from "../../hooks/useCrisisData";
// import { useNewsData } from "../../hooks/useNewsData";
import { useCrisisClustering } from "../../hooks/useCrisisClustering";
// import { useNewsClustering } from "../../hooks/useNewsClustering";
import { useMapLayers } from "../../hooks/useMapLayers";
import { useStreamPlayer } from "../../hooks/useStreamPlayer";
// import { useNewsModal } from "../../hooks/useNewsModal";
import { useTrafficData } from "../../hooks/useTrafficData";
import { useEmergencyData } from "../../hooks/useEmergencyData";
import EmergencyMarker from "./EmergencyMarker";
import { useVideoScroll } from "../../hooks/useVideoScroll";
import { useSpotlightMode } from "../../hooks/useSpotlightMode";
import { useTrafficFlyover } from "../../hooks/useTrafficFlyover";

function Map() {
  const { mapRef, mapContainerRef, mapLoaded } = useMapInitialization();
  const { crisisData } = useCrisisData(mapLoaded);
  // const { newsLoaded, newsLocations, newsArticlesForLocation } = useNewsData(crisisLocations);
  const { crisesClusters, updateClusters } = useCrisisClustering(crisisData, mapRef, mapLoaded);
  // const { newsClusters, updateNewsClusters } = useNewsClustering(
  //   newsLocations,
  //   newsArticlesForLocation,
  //   mapRef,
  //   mapLoaded
  // );
  // const { selectedNews, locationNames, isModalOpen, openModal, closeModal } = useNewsModal();
  const { closeStream } = useStreamPlayer();
  const { trafficLoaded, trafficLocations } = useTrafficData(mapLoaded);
  const { emergencyLoaded, emergencyLocations } = useEmergencyData(mapLoaded);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapStyleVersion, setMapStyleVersion] = useState(0);
  const { showVideoScroll, currentVideoIndex, filteredVideos, openVideoScroll, closeVideoScroll, changeVideo } =
    useVideoScroll(crisisData, mapCenter, closeStream);
  const { spotlightState, enterSpotlight, exitSpotlight } = useSpotlightMode(mapRef);
  const { flyoverState, enterFlyover, exitFlyover } = useTrafficFlyover(mapRef);

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
        // updateNewsClusters();
        const center = currentMap.getCenter();
        setMapCenter({ latitude: center.lat, longitude: center.lng });
      }, 150);
    };

    // Handle zoom changes to update convex hulls
    const handleZoomEnd = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        updateClusters();
        // updateNewsClusters();
      }, 150);
    };

    currentMap.on("moveend", handleMoveEnd);
    currentMap.on("zoomend", handleZoomEnd);

    return () => {
      currentMap.off("moveend", handleMoveEnd);
      currentMap.off("zoomend", handleZoomEnd);
      clearTimeout(debounceTimeout);
    };
  }, [mapLoaded, updateClusters, mapRef]);

  // Handle map background clicks to exit flyover mode (EMS or Traffic)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || (!spotlightState.isActive && !flyoverState.isActive)) return;

    const currentMap = mapRef.current;
    
    const handleMapClick = (e) => {
      // Only exit if clicking on the map canvas, not on markers
      if (e.originalEvent.target.classList.contains('mapboxgl-canvas')) {
        if (spotlightState.isActive) {
          exitSpotlight();
        }
        if (flyoverState.isActive) {
          exitFlyover();
        }
      }
    };

    currentMap.on("click", handleMapClick);

    return () => {
      currentMap.off("click", handleMapClick);
    };
  }, [mapRef, mapLoaded, spotlightState.isActive, flyoverState.isActive, exitSpotlight, exitFlyover]);

  // Handle ESC key to exit flyover mode
  useEffect(() => {
    if (!spotlightState.isActive && !flyoverState.isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (spotlightState.isActive) {
          exitSpotlight();
        }
        if (flyoverState.isActive) {
          exitFlyover();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [spotlightState.isActive, flyoverState.isActive, exitSpotlight, exitFlyover]);

  // Handle map style changes and re-apply layers
  useEffect(() => {
    if (mapStyleVersion > 0) {
      // Give the style time to fully load before updating
      const timer = setTimeout(() => {
        updateClusters();
        // updateNewsClusters();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapStyleVersion, updateClusters]);

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
            }}
          />
        ))}

      {/* News markers temporarily disabled */}
      {/* {mapLoaded &&
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
        ))} */}

      {mapLoaded &&
        trafficLoaded &&
        trafficLocations.map((event, index) => (
          <ClosureMarker
            key={index}
            map={mapRef.current}
            location={event.coordinates}
            event={event}
            onClick={(clickedEvent) => {
              // Trigger flyover for traffic incidents
              enterFlyover(clickedEvent);
            }}
          />
        ))}

      {/* Emergency Markers */}
      {mapLoaded &&
        emergencyLoaded &&
        emergencyLocations.map((event, index) => (
          <EmergencyMarker
            key={index}
            map={mapRef.current}
            location={event.coordinates}
            event={event}
            isInSpotlight={spotlightState.isActive}
            onClick={(clickedEvent) => {
              // Trigger flyover for EMS
              enterSpotlight(clickedEvent);
            }}
          />
        ))}


      {/* News Modal - temporarily disabled */}
      {/* <NewsModal
        isOpen={isModalOpen}
        news={selectedNews}
        onClose={closeModal}
        locationName={locationNames && locationNames.length > 0 ? locationNames.join(", ") : null}
      /> */}

      {showVideoScroll && (
        <VideoScroll
          videos={filteredVideos}
          currentVideoIndex={currentVideoIndex}
          onVideoChange={changeVideo}
          onClose={closeVideoScroll}
        />
      )}

      {/* EMS Detail Card (flyover mode) */}
      {spotlightState.isActive && spotlightState.focusedIncident && (
        <IncidentDetailCard
          incident={spotlightState.focusedIncident}
          onClose={exitSpotlight}
          isEMS={true}
        />
      )}

      {/* Traffic Detail Card (flyover mode) */}
      {flyoverState.isActive && flyoverState.focusedIncident && (
        <IncidentDetailCard
          incident={flyoverState.focusedIncident}
          onClose={exitFlyover}
          isTraffic={true}
        />
      )}
    </>
  );
}

export default Map;
