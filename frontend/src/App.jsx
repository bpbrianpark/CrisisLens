import { EnableVideoIcon, StopIcon } from "@livepeer/react/assets";
import * as Broadcast from "@livepeer/react/broadcast";
import { getIngest } from "@livepeer/react/external";
import { useState, useEffect } from "react";
import StreamPlayer from "./components/StreamPlayer";

const streamKey = import.meta.env.VITE_LIVEPEER_STREAM_KEY;
const playbackId = import.meta.env.VITE_LIVEPEER_PLAYBACK_ID;

export default function App() {
    const [showBroadcast, setShowBroadcast] = useState(false);
    const [showPlayer, setShowPlayer] = useState(false);

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex gap-4">
                <button 
                    onClick={() => setShowBroadcast(!showBroadcast)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                >
                    {showBroadcast ? 'Stop Broadcasting' : 'Start Broadcasting'}
                </button>
                <button 
                    onClick={() => setShowPlayer(!showPlayer)}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
                >
                    {showPlayer ? 'Hide Player' : 'Watch Stream'}
                </button>
            </div>
            {showBroadcast && <DemoBroadcast />}
            {showPlayer && <StreamPlayer playbackId={playbackId} />}
        </div>
    );
}

function DemoBroadcast() {
    const [ingestUrl, setIngestUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const url = getIngest(streamKey);
        if (url) {
            setIngestUrl(url);
        } else {
            console.error("Failed to get ingest URL.");
        }
        setLoading(false);
    }, []);

    if (loading) return <p>Loading...</p>;
    if (!ingestUrl) return <p>Ingest URL not found for the stream.</p>;

    return (
        <Broadcast.Root ingestUrl={ingestUrl}>
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
