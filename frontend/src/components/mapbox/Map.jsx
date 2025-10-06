import { useEffect } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import StreamPlayer from "../livepeer/StreamPlayer";
import CrisisMarker from "./CrisisMarker";
import NewsMarker from "./NewsMarker";
import ClosureMarker from "./ClosureMarker";
import ClosurePopover from "./ClosurePopover";
import NewsModal from "../NewsModal";
import VODPlayer from "../livepeer/VODPlayer";
import { useMapInitialization } from "../../hooks/useMapInitialization";
import { useCrisisData } from "../../hooks/useCrisisData";
import { useNewsData } from "../../hooks/useNewsData";
import { useCrisisClustering } from "../../hooks/useCrisisClustering";
import { useMapLayers } from "../../hooks/useMapLayers";
import { useStreamPlayer } from "../../hooks/useStreamPlayer";
import { useNewsModal } from "../../hooks/useNewsModal";
import { useTrafficData } from "../../hooks/useTrafficData";
import { useClosurePopover } from "../../hooks/useClosurePopover";

function Map() {
  const { mapRef, mapContainerRef, mapLoaded } = useMapInitialization();
  const { crisisData, crisisLocations } = useCrisisData(mapLoaded);
  const { newsLoaded, newsLocations, newsArticlesForLocation } = useNewsData(crisisLocations);
  const { crisesClusters, updateClusters } = useCrisisClustering(crisisData, mapRef, mapLoaded);
  const { showStream, selectedCluster, openStream, closeStream } = useStreamPlayer();
  const { selectedNews, isModalOpen, openModal, closeModal } = useNewsModal();
  const { trafficLoaded, trafficLocations } = useTrafficData(mapLoaded);
  const { selectedClosureEvent, openClosurePopover, closeClosurePopover } = useClosurePopover();

  useMapLayers(crisisData, mapRef, mapLoaded);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const currentMap = mapRef.current;
    let debounceTimeout = null;
    const handleMoveEnd = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        updateClusters();
      }, 300);
    };

    currentMap.on("moveend", handleMoveEnd);

    return () => {
      currentMap.off("moveend", handleMoveEnd);
      clearTimeout(debounceTimeout);
    };
  }, [mapLoaded, updateClusters, mapRef]);

  return (
    <>
      {/* Stream Player Overlay */}
      {showStream && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
          }}
        >
          {selectedCluster.fires[0].isLiveStream ? (
            <StreamPlayer selectedCluster={selectedCluster} onClose={closeStream} />
          ) : (
            <VODPlayer playbackId={selectedCluster.fires[0].playbackId} onClose={closeStream} />
          )}
        </div>
      )}

      {/* Map Container */}
      <div id="map-container" ref={mapContainerRef} style={{ height: "100vh" }} />

      {/* Crisis Markers */}
      {mapLoaded &&
        crisesClusters.map((cluster, index) => (
          <CrisisMarker
            key={index}
            map={mapRef.current}
            location={cluster.center}
            count={cluster.fires.length}
            crises={cluster.fires}
            onClick={() => {
              openStream(cluster);
              console.log(cluster);
            }}
          />
        ))}

      {/* News Markers */}
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

      {/* Traffic Closure Markers */}
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

      {/* Closure Popover */}
      {selectedClosureEvent && (
        <ClosurePopover
          map={mapRef.current}
          location={selectedClosureEvent.coordinates}
          event={selectedClosureEvent}
          onClose={closeClosurePopover}
        />
      )}

      {/* News Modal */}
      <NewsModal isOpen={isModalOpen} news={selectedNews} onClose={closeModal} />
    </>
  );
}

export default Map;
