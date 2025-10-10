import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const useCrisisData = (mapLoaded) => {
  const [crisisData, setCrisisData] = useState([]);

  const processCrisisData = (livestreams, assets) => {
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

    const crises = [...activeLivestreams, ...readyAssets];
    setCrisisData(crises);
  };

  useEffect(() => {
    if (!mapLoaded) return;

    let livestreamsData = [];
    let assetsData = [];

    const updateCrisisData = () => {
      processCrisisData(livestreamsData, assetsData);
    };

    // Set up real-time listeners for livestreams
    const livestreamsUnsubscribe = onSnapshot(
      collection(db, "livestreams"),
      (snapshot) => {
        livestreamsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          longitude: doc.data().longitude,
          latitude: doc.data().latitude,
          crisis: doc.data().crisis,
          ...doc.data(),
        }));
        updateCrisisData();
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
          crisis: doc.data().crisis,
          ...doc.data(),
        }));
        updateCrisisData();
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
    crisisData,
  };
};
