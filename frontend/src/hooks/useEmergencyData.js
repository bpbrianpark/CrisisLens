import { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = "https://data.sfgov.org/resource/nuek-vuh3.json";
const TRAFFIC_DATA_POLLING_INTERVAL = 60 * 60 * 1000; // 1 hour
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const geocodeCache = new Map();

function formatLocalTimestamp(date) {
    const pad = (n) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000`;
  }

// Helper for geocoding missing coordinates
const geocodeAddress = async (address, zip) => {
  if (!mapboxToken) {
    console.error("Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN in your environment variables.");
    return null;
  }

  const cacheKey = zip;
  if (cacheKey && geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const makeGeocodeRequest = async (query) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
    const res = await axios.get(url, {
      params: {
        access_token: mapboxToken,
        limit: 1,
      },
    });
    return res.data.features[0]?.geometry?.coordinates || null;
  };

  try {
    let coords = null;

    if (!coords && zip) {
      const zipQuery = `${parseInt(zip)} San Francisco, CA`;
      coords = await makeGeocodeRequest(zipQuery);
    }

    if (coords && cacheKey) {
      geocodeCache.set(cacheKey, coords);
    }

    return coords || null;
  } catch (err) {
    console.error("Error geocoding:", zip, err);
    return null;
  }
};


export const useEmergencyData = (mapLoaded) => {
  const [emergencyData, setEmergencyData] = useState([]);
  const [emergencyLoaded, setEmergencyLoaded] = useState(false);
  const [emergencyLocations, setEmergencyLocations] = useState([]);

  const fetchEmergencyData = async () => {
    try {
        const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const yesterday = formatLocalTimestamp(yesterdayDate);

      // Tried to use params, but axios encodes the URL in a way that Socrata does not like
      const response = await axios.get(`${BASE_URL}?$where=response_dttm >= '${yesterday}' AND call_type='Structure Fire / Smoke in Building'&$order=response_dttm DESC`);
      

      let data = response.data;

      const geocoded = await Promise.all(
        data.map(async (item) => {
          const coords = await geocodeAddress(item.address, item.zipcode_of_incident);

          if (coords) {
            return {
              ...item,
              longitude: coords[0],
              latitude: coords[1],
            };
          }

          return null;
        })
      );

      data = geocoded.filter(Boolean);

      const groupedData = data.reduce((acc, item) => {
        const incidentKey = item.incident_number || item.call_number;
        if (!acc[incidentKey]) {
          acc[incidentKey] = {
            ...item,
            units: [item.unit_id],
            battalion: item.battalion,
            stationArea: item.station_area,
          };
        } else {
          if (!acc[incidentKey].units.includes(item.unit_id)) {
            acc[incidentKey].units.push(item.unit_id);
          }
        }
        return acc;
      }, {});

      const uniqueIncidents = Object.values(groupedData);

      setEmergencyData(uniqueIncidents);
      setEmergencyLoaded(true);
    } catch (error) {
      console.error("Error fetching emergency data:", error);
    }
  };

  useEffect(() => {
    if (!mapLoaded) return;

    fetchEmergencyData();

    const emergencyIntervalId = setInterval(fetchEmergencyData, TRAFFIC_DATA_POLLING_INTERVAL);
    return () => clearInterval(emergencyIntervalId);
  }, [mapLoaded]);

  useEffect(() => {
    if (!emergencyLoaded || !emergencyData.length) return;

    const locations = emergencyData.map((event) => ({
      coordinates: [parseFloat(event.longitude), parseFloat(event.latitude)],
      callType: event.call_type,
      address: event.address,
      zipcode_of_incident: event.zipcode_of_incident,
      timestamp: event.response_dttm,
      battalion: event.battalion,
      stationArea: event.station_area,
    }));

    setEmergencyLocations(locations);
  }, [emergencyLoaded, emergencyData]);

  return {
    emergencyData,
    emergencyLoaded,
    emergencyLocations,
  };
};
