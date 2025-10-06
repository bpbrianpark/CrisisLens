import { useEffect } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "mapbox-gl/dist/mapbox-gl.css";
import StreamPlayer from "../livepeer/StreamPlayer";
import FireMarker from "./FireMarker";
import NewsMarker from "./NewsMarker";
import NewsModal from "../NewsModal";
import VODPlayer from "../livepeer/VODPlayer";

// Custom hooks
import { useMapInitialization } from "../../hooks/useMapInitialization";
import { useFireData } from "../../hooks/useFireData";
import { useNewsData } from "../../hooks/useNewsData";
import { useFireClustering } from "../../hooks/useFireClustering";
import { useMapLayers } from "../../hooks/useMapLayers";
import { useStreamPlayer } from "../../hooks/useStreamPlayer";
import { useNewsModal } from "../../hooks/useNewsModal";

function Map() {
  const { mapRef, mapContainerRef, mapLoaded } = useMapInitialization();
  const { fireData, fireLocations } = useFireData();
  const { newsLoaded, newsLocations, newsArticlesForLocation } = useNewsData(fireLocations);
  const { fireClusters, updateClusters } = useFireClustering(fireData, mapRef, mapLoaded);
  const { showStream, selectedCluster, openStream, closeStream } = useStreamPlayer();
  const { selectedNews, isModalOpen, openModal, closeModal } = useNewsModal();

  useMapLayers(fireData, mapRef, mapLoaded);

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
        Object.entries(newsLocations).map(([locationName, coordinates], index) => (
          <NewsMarker
            key={index}
            map={mapRef.current}
            location={coordinates}
            news={newsArticlesForLocation[locationName]}
            onClick={(news) => openModal(news)}
          />
        ))}

      {/* News Modal */}
      <NewsModal isOpen={isModalOpen} news={selectedNews} onClose={closeModal} />
    </>
  );
}

export default Map;