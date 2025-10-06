import { useEffect, useState } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import FireMarker from "./FireMarker";
import NewsMarker from "./NewsMarker";
import ClosureMarker from "./ClosureMarker";
import ClosurePopover from "./ClosurePopover";
import NewsModal from "../NewsModal/NewsModal";
import VideoScroll from "../VideoScroll/VideoScroll";
import { useMapInitialization } from "../../hooks/useMapInitialization";
import { useFireData } from "../../hooks/useFireData";
import { useNewsData } from "../../hooks/useNewsData";
import { useFireClustering } from "../../hooks/useFireClustering";
import { useMapLayers } from "../../hooks/useMapLayers";
import { useStreamPlayer } from "../../hooks/useStreamPlayer";
import { useNewsModal } from "../../hooks/useNewsModal";
import { useTrafficData } from "../../hooks/useTrafficData";
import { useClosurePopover } from "../../hooks/useClosurePopover";
import { useVideoScroll } from "../../hooks/useVideoScroll";

function Map() {
  const { mapRef, mapContainerRef, mapLoaded } = useMapInitialization();
  const { fireData, fireLocations } = useFireData(mapLoaded);
  const { newsLoaded, newsLocations, newsArticlesForLocation } = useNewsData(fireLocations);
  const { fireClusters, updateClusters } = useFireClustering(fireData, mapRef, mapLoaded);
  const { closeStream } = useStreamPlayer();
  const { selectedNews, isModalOpen, openModal, closeModal } = useNewsModal();
  const { trafficLoaded, trafficLocations } = useTrafficData(mapLoaded);
  const { selectedClosureEvent, openClosurePopover, closeClosurePopover } = useClosurePopover();
  const [mapCenter, setMapCenter] = useState(null);
  const { showVideoScroll, currentVideoIndex, filteredVideos, openVideoScroll, closeVideoScroll, changeVideo } =
    useVideoScroll(fireData, mapCenter, closeStream);

  useMapLayers(fireData, mapRef, mapLoaded);

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
        const center = currentMap.getCenter();
        setMapCenter({ latitude: center.lat, longitude: center.lng });
      }, 150);
    };

    currentMap.on("moveend", handleMoveEnd);

    return () => {
      currentMap.off("moveend", handleMoveEnd);
      clearTimeout(debounceTimeout);
    };
  }, [mapLoaded, updateClusters, mapRef]);

  return (
    <>
      <div id="map-container" ref={mapContainerRef} style={{ height: "100vh" }} />

      {mapLoaded &&
        fireClusters.map((cluster, index) => (
          <FireMarker
            key={index}
            map={mapRef.current}
            location={cluster.center}
            count={cluster.fires.length}
            fires={cluster.fires}
            onClick={() => {
              openVideoScroll(0);
              console.log(cluster);
            }}
          />
        ))}

      {mapLoaded &&
        newsLoaded &&
        Object.entries(newsLocations).map(([locationName, coordinates], index) => (
          <NewsMarker
            key={index}
            map={mapRef.current}
            location={coordinates}
            news={newsArticlesForLocation[locationName]}
            onClick={(news) => openModal(news)}
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

      <NewsModal isOpen={isModalOpen} news={selectedNews} onClose={closeModal} />

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
