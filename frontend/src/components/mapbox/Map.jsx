import { useEffect } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import StreamPlayer from "../livepeer/StreamPlayer";
import FireMarker from "./FireMarker";
import NewsMarker from "./NewsMarker";
import ClosureMarker from "./ClosureMarker";
import ClosurePopover from "./ClosurePopover";
import NewsModal from "../NewsModal";
import VODPlayer from "../livepeer/VODPlayer";
import { useMapInitialization } from "../../hooks/useMapInitialization";
import { useFireData } from "../../hooks/useFireData";
import { useNewsData } from "../../hooks/useNewsData";
import { useFireClustering } from "../../hooks/useFireClustering";
import { useNewsClustering } from "../../hooks/useNewsClustering";
import { useMapLayers } from "../../hooks/useMapLayers";
import { useStreamPlayer } from "../../hooks/useStreamPlayer";
import { useNewsModal } from "../../hooks/useNewsModal";
import { useTrafficData } from "../../hooks/useTrafficData";
import { useClosurePopover } from "../../hooks/useClosurePopover";

function Map() {
  const { mapRef, mapContainerRef, mapLoaded } = useMapInitialization();
  const { fireData, fireLocations } = useFireData(mapLoaded);
  const { newsLoaded, newsLocations, newsArticlesForLocation } = useNewsData(fireLocations);
  const { fireClusters, updateClusters } = useFireClustering(fireData, mapRef, mapLoaded);
  const { newsClusters, updateNewsClusters } = useNewsClustering(newsLocations, newsArticlesForLocation, mapRef, mapLoaded);
  const { showStream, selectedCluster, openStream, closeStream } = useStreamPlayer();
  const { selectedNews, isModalOpen, openModal, closeModal } = useNewsModal();
  const { trafficLoaded, trafficLocations } = useTrafficData(mapLoaded);
  const { selectedClosureEvent, openClosurePopover, closeClosurePopover } = useClosurePopover();

  useMapLayers(fireData, mapRef, mapLoaded);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const currentMap = mapRef.current;
    let debounceTimeout = null;
    const handleMoveEnd = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        updateClusters();
        updateNewsClusters();
      }, 300);
    };

    currentMap.on("moveend", handleMoveEnd);

    return () => {
      currentMap.off("moveend", handleMoveEnd);
      clearTimeout(debounceTimeout);
    };
  }, [mapLoaded, updateClusters, updateNewsClusters, mapRef]);

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

      {/* Fire Markers */}
      {mapLoaded &&
        fireClusters.map((cluster, index) => (
          <FireMarker
            key={index}
            map={mapRef.current}
            location={cluster.center}
            count={cluster.fires.length}
            fires={cluster.fires}
            onClick={() => {
              openStream(cluster);
              console.log(cluster);
            }}
          />
        ))}

      {/* News Markers */}
      {mapLoaded &&
        newsLoaded &&
        newsClusters.map((cluster, index) => (
          <NewsMarker
            key={`news-${index}`}
            map={mapRef.current}
            location={cluster.center}
            news={cluster.locations.flatMap(location => location.articles)}
            count={cluster.locations.length}
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