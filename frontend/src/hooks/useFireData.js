import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const useFireData = (mapLoaded) => {
  const [fireData, setFireData] = useState([]);
  const [fireLocations, setFireLocations] = useState([]);

  const processFireData = (livestreams, assets) => {
    const activeLivestreams = livestreams
      .filter((stream) => 
        stream.status !== "finished" && 
        stream.longitude != null && 
        stream.latitude != null &&
        typeof stream.longitude === 'number' &&
        typeof stream.latitude === 'number'
      )
      .map((stream) => ({
        ...stream,
        isLiveStream: true,
        isOnGoing: true,
      }));

    const readyAssets = assets
      .filter((asset) => 
        asset.status === "ready" && 
        asset.longitude != null && 
        asset.latitude != null &&
        typeof asset.longitude === 'number' &&
        typeof asset.latitude === 'number'
      )
      .map((asset) => ({
        ...asset,
        isLiveStream: false,
        isOnGoing: false,
      }));

    const fires = [...activeLivestreams, ...readyAssets];
    setFireData(fires);
    setFireLocations(fires.map((fire) => [fire.longitude, fire.latitude]));
  };

  useEffect(() => {
    if (!mapLoaded) return;

    let livestreamsData = [];
    let assetsData = [];

    const updateFireData = () => {
      processFireData(livestreamsData, assetsData);
    };

    // Set up real-time listeners for livestreams
    const livestreamsUnsubscribe = onSnapshot(
      collection(db, "livestreams"),
      (snapshot) => {
        livestreamsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          longitude: doc.data().longitude,
          latitude: doc.data().latitude,
          ...doc.data(),
        }));
        updateFireData();
      },
      (error) => {
        console.error("Error listening to livestreams:", error);
      }
    );

    // Set up real-time listeners for assets
    const assetsUnsubscribe = onSnapshot(
      collection(db, "assets"),
      (snapshot) => {
        assetsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          longitude: doc.data().longitude,
          latitude: doc.data().latitude,
          ...doc.data(),
        }));
        updateFireData();
      },
      (error) => {
        console.error("Error listening to assets:", error);
      }
    );

    // Clean up listeners on unmount
    return () => {
      livestreamsUnsubscribe();
      assetsUnsubscribe();
    };
  }, [mapLoaded]);

  return {
    fireData,
    fireLocations,
  };
};
