import { EnableVideoIcon, StopIcon, PlayIcon, PauseIcon } from "@livepeer/react/assets";
import * as Broadcast from "@livepeer/react/broadcast";
import * as Player from "@livepeer/react/player";
import { getIngest, getSrc } from "@livepeer/react/external";
import { useState, useEffect } from "react";

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
            {showPlayer && <DemoPlayer />}
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

function DemoPlayer() {
    const [src, setSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [videoError, setVideoError] = useState(null);

    useEffect(() => {
        try {
            const source = {
                type: "playback",
                meta: {
                    live: true,
                    playbackId: playbackId,
                }
            };
            
            const playbackUrl = getSrc(source);
            console.log("Livestream URL:", playbackUrl);
            
            if (playbackUrl) {
                setSrc(playbackUrl);
            } else {
                const hlsUrl = `https://livepeercdn.com/hls/${playbackId}/index.m3u8`;
                console.log("Falling back to HLS URL:", hlsUrl);
                setSrc(hlsUrl);
            }
        } catch (error) {
            console.error("Error setting up livestream:", error);
            setVideoError(error);
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) return <p>Loading player...</p>;
    if (!src) return (
        <div className="p-4 bg-red-100 text-red-700 rounded">
            <p>Playback source not found for livestream.</p>
            <p className="text-sm">PlaybackId: {playbackId}</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-2">
            <Player.Root 
                src={src}
                onError={(error) => {
                    console.error("Player error:", error);
                    setVideoError(error);
                }}
            >
                <Player.Container className="h-[400px] w-full bg-gray-950">
                    <Player.Video 
                        title="Livestream" 
                        className="h-full w-full" 
                        onError={(e) => console.error("Video element error:", e)}
                        onLoadStart={() => console.log("Livestream loading started")}
                        onLoadedData={() => console.log("Livestream data loaded")}
                        onPlay={() => console.log("Livestream started playing")}
                    />

                    <Player.Controls className="flex items-center justify-center">
                        <Player.PlayPauseTrigger className="w-10 h-10 hover:scale-105 flex-shrink-0">
                            <Player.PlayingIndicator asChild matcher={false}>
                                <PlayIcon className="w-full h-full" />
                            </Player.PlayingIndicator>
                            <Player.PlayingIndicator asChild>
                                <PauseIcon className="w-full h-full" />
                            </Player.PlayingIndicator>
                        </Player.PlayPauseTrigger>
                    </Player.Controls>

                    <Player.LoadingIndicator asChild>
                        <div className="absolute top-1 left-1 bg-black/50 px-2 py-1 rounded-full text-white text-sm">
                            Loading livestream...
                        </div>
                    </Player.LoadingIndicator>

                    <Player.LiveIndicator>
                        <div className="absolute top-1 right-1 bg-red-500 px-2 py-1 rounded-full text-white text-sm flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            LIVE
                        </div>
                    </Player.LiveIndicator>
                </Player.Container>
            </Player.Root>
            
            <div className="text-sm text-gray-600">
                <p>Livestream Source: {src}</p>
                <p>Playback ID: {playbackId}</p>
                {videoError && (
                    <p className="text-red-500">Error: {JSON.stringify(videoError)}</p>
                )}
            </div>
        </div>
    );
}
