import { useState, useEffect } from "react";
// import axios from "axios";

// const BASE_URL = "https://data.sfgov.org/resource/nuek-vuh3.json"; // TEMP: disabled for deploy branch
const TRAFFIC_DATA_POLLING_INTERVAL = 60 * 60 * 1000; // 1 hour
// const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN; // TEMP: disabled for deploy branch
// const geocodeCache = new Map(); // TEMP: disabled for deploy branch

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

// TEMP: Geocoding helper disabled for deploy branch (no network calls)
// const geocodeAddress = async (address, zip) => { return null; };

// TEMP: Hardcoded emergency generator (no API calls)
const generateMockEmergencyData = () => {
  const now = new Date();
  const battalions = ["B01", "B02", "B03", "B04", "B05", "B06", "B07"];
  const stationAreas = ["SA01", "SA02", "SA03", "SA04", "SA05", "SA06", "SA07", "SA08", "SA09", "SA10"];
  const unitsPool = [
    "E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08", "E09", "E10",
    "T01", "T02", "T03", "T04", "T05",
    "R01", "R02", "R03"
  ];
  // Fixed coordinates per ZIP (94110 and 94112 omitted due to missing centroids)
  const zipToCoords = {
    "94102": { lat: 37.77956, lng: -122.41931 },
    "94103": { lat: 37.77374, lng: -122.41403 },
    "94107": { lat: 37.77903, lng: -122.41991 },
    "94109": { lat: 37.79298, lng: -122.42124 },
    "94114": { lat: 37.75821, lng: -122.43556 },
    "94116": { lat: 37.74540, lng: -122.48607 },
    "94121": { lat: 37.76818, lng: -122.51050 },
    "94122": { lat: 37.75975, lng: -122.47503 },
  };

  const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sampleUnique = (arr, k) => {
    const copy = [...arr];
    const out = [];
    const n = Math.min(k, copy.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  };

  const makeUnits = () => {
    const count = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...unitsPool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const zips = sampleUnique(Object.keys(zipToCoords), 7);
  return zips.map((zipcode) => {
    const { lat, lng } = zipToCoords[zipcode];
    const incident = 100000 + Math.floor(Math.random() * 900000);
    const callNum = 500000 + Math.floor(Math.random() * 400000);
    const minutesAgo = Math.floor(Math.random() * 180);
    const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);
    const station_area = randomPick(stationAreas);
    const battalion = randomPick(battalions);
    const units = makeUnits();

    return {
      incident_number: String(incident),
      call_number: String(callNum),
      call_type: "Structure Fire / Smoke in Building",
      address: `${100 + Math.floor(Math.random() * 800)} Market St`,
      zipcode_of_incident: zipcode,
      response_dttm: formatLocalTimestamp(timestamp),
      latitude: lat,
      longitude: lng,
      battalion,
      station_area,
      units,
      unit_id: units[0],
    };
  });
};


export const useEmergencyData = (mapLoaded) => {
  const [emergencyData, setEmergencyData] = useState([]);
  const [emergencyLoaded, setEmergencyLoaded] = useState(false);
  const [emergencyLocations, setEmergencyLocations] = useState([]);

  // TEMP: Replace network fetch with hardcoded mock generator
  const loadMockEmergencyData = () => {
    const data = generateMockEmergencyData();
    // Group by incident to merge unit responses similar to original logic
    const groupedData = data.reduce((acc, item) => {
      const incidentKey = item.incident_number || item.call_number;
      if (!acc[incidentKey]) {
        acc[incidentKey] = {
          ...item,
          units: Array.isArray(item.units) ? [...item.units] : [item.unit_id].filter(Boolean),
        };
      } else {
        const unitIds = Array.isArray(item.units) ? item.units : [item.unit_id].filter(Boolean);
        unitIds.forEach((u) => {
          if (!acc[incidentKey].units.includes(u)) acc[incidentKey].units.push(u);
        });
      }
      return acc;
    }, {});
    const uniqueIncidents = Object.values(groupedData);
    setEmergencyData(uniqueIncidents);
    setEmergencyLoaded(true);
  };

  useEffect(() => {
    if (!mapLoaded) return;

    // TEMP: Use mock data instead of network fetch
    loadMockEmergencyData();

    // TEMP: Disable polling while using mock data
    // const emergencyIntervalId = setInterval(fetchEmergencyData, TRAFFIC_DATA_POLLING_INTERVAL);
    // return () => clearInterval(emergencyIntervalId);
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
