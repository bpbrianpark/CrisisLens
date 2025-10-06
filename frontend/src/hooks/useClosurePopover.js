import { useState } from "react";

export const useClosurePopover = () => {
  const [selectedClosureEvent, setSelectedClosureEvent] = useState(null);

  const openClosurePopover = (event) => {
    setSelectedClosureEvent(event);
  };

  const closeClosurePopover = () => {
    setSelectedClosureEvent(null);
  };

  return {
    selectedClosureEvent,
    openClosurePopover,
    closeClosurePopover,
  };
};
