import { useState } from "react";

export const useStreamPlayer = () => {
  const [showStream, setShowStream] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const openStream = (cluster) => {
    setSelectedCluster(cluster);
    setShowStream(true);
  };

  const closeStream = () => {
    setShowStream(false);
    setSelectedCluster(null);
  };

  return {
    showStream,
    selectedCluster,
    openStream,
    closeStream,
  };
};
