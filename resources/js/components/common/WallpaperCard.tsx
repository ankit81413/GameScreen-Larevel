import { Link } from '@inertiajs/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { viewWallpaper } from '@/routes';

const PLAY_EVENT_NAME = 'wallpaper-card-play';
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v'];

type WallpaperCardProps = {
    item: any;
};

export default function WallpaperCard({ item }: WallpaperCardProps) {
    const is_livewallpaper = item.type === 2;
    const isLandscape = item.orientation === 'land';
    const isProcessing = Boolean(item.processing);
    const thumbnailUrl = String(item?.thumbnail ?? '');
    const isProcessingVideoPreview =
        is_livewallpaper ||
        VIDEO_EXTENSIONS.some((extension) =>
            thumbnailUrl.toLowerCase().includes(extension),
        );
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);
    const [isProcessingPreviewError, setIsProcessingPreviewError] = useState(
        false,
    );

    useEffect(() => {
        setIsProcessingPreviewError(false);
    }, [item.id, thumbnailUrl]);

    const video480pUrl = useMemo(() => {
        const links = Array.isArray(item.links) ? item.links : [];
        if (!links.length) {
            return '';
        }

        const parsedLinks = links
            .map((link: any) => ({
                url: link?.url,
                qualityValue: Number.parseInt(String(link?.quality ?? ''), 10),
            }))
            .filter(
                (link: any) =>
                    typeof link.url === 'string' &&
                    link.url.length > 0 &&
                    !Number.isNaN(link.qualityValue),
            );

        if (!parsedLinks.length) {
            return '';
        }

        const exact480 = parsedLinks.find((link: any) => link.qualityValue === 480);
        return exact480?.url ?? '';
    }, [item.links]);

    const maxQualityLabel = useMemo(() => {
        if (isProcessing) {
            return 'Processing...';
        }

        const links = Array.isArray(item.links) ? item.links : [];
        if (!links.length) {
            return 'Pending';
        }

        const parsedValues = links
            .map((link: any) => {
                const raw = String(link?.quality ?? '').trim().toLowerCase();
                if (!raw) {
                    return 0;
                }

                if (raw === '2k') return 1440;
                if (raw === '4k') return 2160;
                if (raw === '8k') return 4320;

                const kMatch = raw.match(/^(\d+)\s*k$/);
                if (kMatch) {
                    return Number.parseInt(kMatch[1], 10) * 1000;
                }

                const pMatch = raw.match(/^(\d+)\s*p$/);
                if (pMatch) {
                    return Number.parseInt(pMatch[1], 10);
                }

                const numMatch = raw.match(/^(\d+)$/);
                if (numMatch) {
                    return Number.parseInt(numMatch[1], 10);
                }

                return 0;
            })
            .filter((value: number) => !Number.isNaN(value) && value > 0);

        if (!parsedValues.length) {
            return 'Pending';
        }

        const maxValue = Math.max(...parsedValues);
        if (maxValue === 1440) return '2k';
        if (maxValue === 2160) return '4k';
        if (maxValue === 4320) return '8k';
        if (maxValue >= 2000 && maxValue % 1000 === 0) {
            return `${Math.round(maxValue / 1000)}k`;
        }

        return `${maxValue}p`;
    }, [isProcessing, item.links]);

    const stopVideoAndUnload = () => {
        const video = videoRef.current;
        if (video) {
            video.pause();
            video.currentTime = 0;
        }

        setIsPlayingVideo(false);
        setIsLoadingVideo(false);
        setShouldLoadVideo(false);
    };

    useEffect(() => {
        const onOtherCardPlay = (event: Event) => {
            const customEvent = event as CustomEvent<{ cardId: number | string }>;
            if (customEvent.detail?.cardId === item.id) {
                return;
            }

            stopVideoAndUnload();
        };

        window.addEventListener(PLAY_EVENT_NAME, onOtherCardPlay);

        return () => {
            window.removeEventListener(PLAY_EVENT_NAME, onOtherCardPlay);
        };
    }, [item.id]);

    const handlePlayButtonClick = async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (isProcessing || !is_livewallpaper || !video480pUrl) {
            return;
        }

        window.dispatchEvent(
            new CustomEvent(PLAY_EVENT_NAME, { detail: { cardId: item.id } }),
        );

        const video = videoRef.current;
        if (!shouldLoadVideo) {
            setShouldLoadVideo(true);
            setIsLoadingVideo(true);
            return;
        }

        if (!video) {
            return;
        }

        if (video.paused) {
            setIsLoadingVideo(true);
            try {
                await video.play();
                setIsPlayingVideo(true);
            } catch (_error) {
                setIsPlayingVideo(false);
            }
        } else {
            video.pause();
            setIsPlayingVideo(false);
        }
    };

    return (
        <div className={`wallpaper ${isLandscape ? 'landscape' : 'portrait'}`}>
            <div className="image">
                {isProcessing ? (
                    <div>
                        {isProcessingVideoPreview && !isProcessingPreviewError ? (
                            <video
                                src={thumbnailUrl}
                                muted
                                loop
                                autoPlay
                                playsInline
                                preload="metadata"
                                id={`wallpaper_${item.id}`}
                                onError={() => setIsProcessingPreviewError(true)}
                            />
                        ) : (
                            <img
                                src={thumbnailUrl}
                                alt="wallpaper"
                                id={`wallpaper_${item.id}`}
                                onError={() => setIsProcessingPreviewError(true)}
                            />
                        )}
                    </div>
                ) : (
                    <Link href={viewWallpaper(item.code)}>
                        {!shouldLoadVideo && (
                            <img
                                src={`${item.thumbnail}`}
                                alt="wallpaper"
                                id={`wallpaper_${item.id}`}
                            />
                        )}

                        {shouldLoadVideo && (
                            <video
                                ref={videoRef}
                                src={video480pUrl}
                                poster={item.thumbnail}
                                muted
                                loop
                                playsInline
                                onLoadStart={() => {
                                    setIsLoadingVideo(true);
                                }}
                                onCanPlay={async () => {
                                    setIsLoadingVideo(false);
                                    try {
                                        await videoRef.current?.play();
                                        setIsPlayingVideo(true);
                                    } catch (_error) {
                                        setIsPlayingVideo(false);
                                    }
                                }}
                                onWaiting={() => {
                                    setIsLoadingVideo(true);
                                }}
                                onLoadedData={() => {
                                    setIsLoadingVideo(false);
                                }}
                                onPlaying={() => {
                                    setIsLoadingVideo(false);
                                    setIsPlayingVideo(true);
                                }}
                                onPause={() => {
                                    setIsPlayingVideo(false);
                                }}
                                onError={() => {
                                    setIsLoadingVideo(false);
                                    setIsPlayingVideo(false);
                                }}
                            />
                        )}
                    </Link>
                )}

                {isProcessing && (
                    <div className="wallpaper-card-processing">
                        <div className="wallpaper-card-processing-badge">
                            <span className="wallpaper-card-processing-dot"></span>
                            Processing
                        </div>
                    </div>
                )}

                {isLoadingVideo && (
                    <div
                        className="loader-container wallpaper-card-loader"
                        style={{ display: 'flex' }}
                    >
                        <div className="loader"></div>
                    </div>
                )}

                {is_livewallpaper && !isProcessing && (
                    <div className="i_container">
                        <div
                            className="wallpaper-play-button"
                            onClick={handlePlayButtonClick}
                        >
                            <i
                                className={`fa-solid ${isPlayingVideo ? 'fa-pause' : 'fa-play'}`}
                            ></i>
                        </div>
                    </div>
                )}
            </div>
            <div className="details">
                <h2>{item.name}</h2>
                <p>Quality : {maxQualityLabel}</p>
            </div>
        </div>
    );
}
