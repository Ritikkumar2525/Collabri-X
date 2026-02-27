import React, { useEffect, useRef, useState } from 'react';
import { CameraOff, Loader2 } from 'lucide-react';

class VideoErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("VideoPlayer ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center rounded-2.5xl overflow-hidden ring-1 ring-red-500/50 flex-col gap-2 p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center text-red-400">
                        <CameraOff size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-red-400">Stream Error</span>
                </div>
            );
        }
        return this.props.children;
    }
}

const VideoPlayerBase = ({ stream, isLocal = false, autoPlay = true, muted = false, width = '100%', height = '100%' }) => {
    const videoRef = useRef(null);
    const [isStreamReady, setIsStreamReady] = useState(false);

    useEffect(() => {
        if (!stream) {
            console.warn("VideoPlayer: No stream provided");
            setIsStreamReady(false);
            return;
        }

        try {
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to have metadata before showing
                videoRef.current.onloadedmetadata = () => {
                    setIsStreamReady(true);
                };
            }
        } catch (error) {
            console.error("VideoPlayer: Failed to attach stream to video element", error);
        }

        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [stream]);

    if (!stream) {
        return (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center rounded-2.5xl overflow-hidden ring-1 ring-white/10" style={{ width, height }}>
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                    <CameraOff size={24} />
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full rounded-2.5xl overflow-hidden bg-slate-900 group" style={{ width, height }}>
            {!isStreamReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
                    <Loader2 size={24} className="text-slate-400 animate-spin" />
                </div>
            )}
            <video
                ref={videoRef}
                autoPlay={autoPlay}
                playsInline
                muted={isLocal ? true : muted} // Always mute local to prevent echo
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLocal ? 'scale-x-[-1]' : ''} ${isStreamReady ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
};

// Wrap with ErrorBoundary before exporting
const VideoPlayer = (props) => (
    <VideoErrorBoundary>
        <VideoPlayerBase {...props} />
    </VideoErrorBoundary>
);

export default VideoPlayer;
