import * as Player from "@livepeer/react/player";
import { getSrc } from "@livepeer/react/external";
import { PlayIcon, PauseIcon } from "@livepeer/react/assets";
import { useState, useEffect } from "react";

export default function StreamPlayer({ playbackId }) {
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
    }, [playbackId]);

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