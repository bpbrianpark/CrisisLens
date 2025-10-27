import { useState, useEffect } from "react";

const SAN_FRANCISCO_TRAFFIC_API_KEY = import.meta.env.VITE_SAN_FRANCISCO_TRAFFIC_API_KEY;
const TRAFFIC_DATA_POLLING_INTERVAL = 60 * 60 * 1000; // 1 hour

export const useTrafficData = (mapLoaded) => {
  const [trafficData, setTrafficData] = useState(null);
  const [trafficLoaded, setTrafficLoaded] = useState(false);
  const [trafficLocations, setTrafficLocations] = useState([]);

  const fetchTrafficData = async () => {
    try {
      const response = await fetch(`https://api.511.org/traffic/events?api_key=${SAN_FRANCISCO_TRAFFIC_API_KEY}&format=json`);
      const data = await response.json();
      setTrafficData(data);
      setTrafficLoaded(true);
    } catch (error) {
      console.error("Error fetching traffic data:", error);
    }
  };

  useEffect(() => {
    if (!mapLoaded) return;

    // Initial fetch
    fetchTrafficData();

    const trafficIntervalId = setInterval(() => {
      fetchTrafficData();
    }, TRAFFIC_DATA_POLLING_INTERVAL);

    return () => {
      clearInterval(trafficIntervalId);
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (!trafficLoaded || !trafficData) return;

    const locations = trafficData.events
      .filter((event) => event.geography && event.geography.coordinates)
      .map((event) => ({
        coordinates: event.geography.coordinates,
        headline: event.headline,
        status: event.status,
        eventType: event.event_type,
        roadName: event.roads?.[0]?.name,
        severity: event.severity,
        description: event.description,
        startTime: event.start_time || event.created,
        endTime: event.end_time || event.schedule?.end_time,
        updatedTime: event.updated || event.last_updated,
        direction: event.direction,
        roads: event.roads,
      }));

    setTrafficLocations(locations);
  }, [trafficLoaded, trafficData]);

  return {
    trafficData,
    trafficLoaded,
    trafficLocations,
  };
};
