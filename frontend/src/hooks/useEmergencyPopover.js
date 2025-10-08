import { useState } from "react";

export const useEmergencyPopover = () => {
  const [selectedEmergencyEvent, setSelectedEmergencyEvent] = useState(null);

  const openEmergencyPopover = (event) => {
    setSelectedEmergencyEvent(event);
  };

  const closeEmergencyPopover = () => {
    setSelectedEmergencyEvent(null);
  };

  return {
    selectedEmergencyEvent,
    openEmergencyPopover,
    closeEmergencyPopover,
  };
};
