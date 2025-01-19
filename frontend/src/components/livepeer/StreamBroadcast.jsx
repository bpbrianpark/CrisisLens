import { EnableVideoIcon, StopIcon } from "@livepeer/react/assets";
import * as Broadcast from "@livepeer/react/broadcast";
import { getIngest } from "@livepeer/react/external";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

export default function StreamBroadcast({ streamKey }) {
  return (
    <Broadcast.Root
      ingestUrl={getIngest(streamKey)}
      onError={(error) =>
        error?.type === "permissions"
          ? toast.error("You must accept permissions to broadcast. Please try again.")
          : toast.error("An error occurred while broadcasting.")
      }
    >
      <Broadcast.Container className="h-full w-full bg-gray-950">
        <Broadcast.Video title="Current Livestream" className="h-full w-full" />

        <Broadcast.Controls className="flex items-center justify-center">
          <Broadcast.EnabledTrigger className="w-10 h-10 hover:scale-105 flex-shrink-0">
            <Broadcast.EnabledIndicator asChild matcher={false}>
              <EnableVideoIcon className="w-full h-full" />
            </Broadcast.EnabledIndicator>
            <Broadcast.EnabledIndicator asChild>
              <StopIcon className="w-full h-full" />
            </Broadcast.EnabledIndicator>
          </Broadcast.EnabledTrigger>
        </Broadcast.Controls>

        <Broadcast.LoadingIndicator asChild matcher={false}>
          <div className="absolute overflow-hidden py-1 px-2 rounded-full top-1 left-1 bg-black/50 flex items-center backdrop-blur">
            <Broadcast.StatusIndicator matcher="live" className="flex gap-2 items-center">
              <div className="bg-red-500 animate-pulse h-1.5 w-1.5 rounded-full" />
              <span className="text-xs select-none">LIVE</span>
            </Broadcast.StatusIndicator>
            <Broadcast.StatusIndicator matcher="pending" className="flex gap-2 items-center">
              <div className="bg-white/80 h-1.5 w-1.5 rounded-full animate-pulse" />
              <span className="text-xs select-none">LOADING</span>
            </Broadcast.StatusIndicator>
            <Broadcast.StatusIndicator matcher="idle" className="flex gap-2 items-center">
              <div className="bg-white/80 h-1.5 w-1.5 rounded-full" />
              <span className="text-xs select-none">IDLE</span>
            </Broadcast.StatusIndicator>
          </div>
        </Broadcast.LoadingIndicator>
      </Broadcast.Container>
    </Broadcast.Root>
  );
}

StreamBroadcast.propTypes = {
  streamKey: PropTypes.string.isRequired,
};
