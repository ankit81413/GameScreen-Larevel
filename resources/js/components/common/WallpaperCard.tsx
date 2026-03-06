import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { viewWallpaper } from '@/routes';

const PLAY_EVENT_NAME = 'wallpaper-card-play';

type WallpaperCardProps = {
    item: any;
};

export default function WallpaperCard({ item }: WallpaperCardProps) {
    const is_livewallpaper = item.type === 2;
    const isLandscape = item.orientation === 'land';
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);

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

        if (!is_livewallpaper || !video480pUrl) {
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
            } catch (error) {
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
                                } catch (error) {
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

                {isLoadingVideo && (
                    <div
                        className="loader-container wallpaper-card-loader"
                        style={{ display: 'flex' }}
                    >
                        <div className="loader"></div>
                    </div>
                )}

                {is_livewallpaper && (
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
                <p>Quality : 4k</p>
            </div>
        </div>
    );
}
