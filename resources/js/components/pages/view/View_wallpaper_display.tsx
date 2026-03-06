import React, { useEffect, useRef, useState } from 'react';
import { useFullScreen } from '@/hooks/useFullScreen';

const AUTOPLAY_STORAGE_KEY = 'viewWallpaperAutoplay';

export default function ViewWallpaperDisplay(props: any) {
    // console.log(props);
    const isVideoDisplay = Number(props.type) === 2;
    const preferredQuality = 720;

    const { toggleFullScreen } = useFullScreen();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [canPlayDisplayVideo, setCanPlayDisplayVideo] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(true);
    const [displayUrl, setDisplayUrl] = useState(props.thumbnail ?? '');
    const [displayQuality, setDisplayQuality] = useState('720p');
    const [autoplayEnabled, setAutoplayEnabled] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem(AUTOPLAY_STORAGE_KEY) === 'true';
    });
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hidePlayControlTimeoutRef = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);

    useEffect(() => {
        const links = Array.isArray(props.links) ? props.links : [];

        if (!links.length) {
            setDisplayUrl(props.thumbnail ?? '');
            setDisplayQuality('720p');
            return;
        }

        const parsedLinks = links
            .map((link: any) => ({
                ...link,
                qualityValue: Number.parseInt(link.quality, 10),
            }))
            .filter((link: any) => !Number.isNaN(link.qualityValue));

        if (!parsedLinks.length) {
            setDisplayUrl(props.thumbnail ?? '');
            setDisplayQuality('720p');
            return;
        }

        const exactMatch = parsedLinks.find(
            (link: any) => link.qualityValue === preferredQuality,
        );

        const lowerMatch = parsedLinks
            .filter((link: any) => link.qualityValue < preferredQuality)
            .sort((a: any, b: any) => b.qualityValue - a.qualityValue)[0];

        const fallbackMatch = parsedLinks.sort(
            (a: any, b: any) => a.qualityValue - b.qualityValue,
        )[0];

        const selectedLink = exactMatch ?? lowerMatch ?? fallbackMatch;

        setDisplayUrl(selectedLink?.url ?? props.thumbnail ?? '');
        setDisplayQuality(selectedLink?.quality ?? '720p');
    }, [props.links, props.thumbnail, preferredQuality]);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => {
            document.removeEventListener(
                'fullscreenchange',
                onFullscreenChange,
            );
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(
            AUTOPLAY_STORAGE_KEY,
            autoplayEnabled ? 'true' : 'false',
        );
    }, [autoplayEnabled]);

    useEffect(() => {
        return () => {
            if (hidePlayControlTimeoutRef.current) {
                clearTimeout(hidePlayControlTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isVideoDisplay) {
            return;
        }

        setCanPlayDisplayVideo(false);
        setIsPlaying(false);
        setShowPlayButton(true);
        clearHidePlayControlTimeout();
    }, [displayUrl, isVideoDisplay]);

    useEffect(() => {
        const video = videoRef.current;
        if (!isVideoDisplay || !autoplayEnabled || !canPlayDisplayVideo || !video) {
            return;
        }

        const autoPlayVideo = async () => {
            try {
                await video.play();
                setIsPlaying(true);
                setShowPlayButton(true);
                scheduleHidePlayControl();
            } catch (error) {
                setIsPlaying(false);
                setShowPlayButton(true);
            }
        };

        autoPlayVideo();
    }, [autoplayEnabled, canPlayDisplayVideo, displayUrl, isVideoDisplay]);

    const handleFullscreen = () => {
        toggleFullScreen('display_content');
    };

    const handleFullscreenimg = () => {
        let el = document.getElementById('display_content_img') as any;
        if(!document.fullscreenElement){
            el.querySelector('img').style.maxHeight = "unset"
        }else{
            el.querySelector('img').style.maxHeight = "500px"
        }
        toggleFullScreen('display_content_img');
    };

    const clearHidePlayControlTimeout = () => {
        if (hidePlayControlTimeoutRef.current) {
            clearTimeout(hidePlayControlTimeoutRef.current);
            hidePlayControlTimeoutRef.current = null;
        }
    };

    const scheduleHidePlayControl = () => {
        clearHidePlayControlTimeout();
        hidePlayControlTimeoutRef.current = setTimeout(() => {
            setShowPlayButton(false);
        }, 3000);
    };

    const toggleDisplayVideo = async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (video.paused) {
                await video.play();
                setIsPlaying(true);
                setShowPlayButton(true);
                scheduleHidePlayControl();
            } else {
                video.pause();
                setIsPlaying(false);
                setShowPlayButton(true);
                clearHidePlayControlTimeout();
            }
        } catch (error) {
            setIsPlaying(false);
            setShowPlayButton(true);
        }
    };

    const handleDisplayContentClick = () => {
        setShowPlayButton(true);
        if (isPlaying) {
            scheduleHidePlayControl();
        }
    };

    const toggleAutoplayPreference = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setAutoplayEnabled((currentValue) => !currentValue);
    };

    return (
        <>
            <div id="video_quality">
                <h2>Choose quality</h2>
                <ul id="video_quality_list">
                    <li>1080p</li>
                    <li>720p</li>
                    <li>480p</li>
                </ul>
                <button>Cancel</button>
            </div>

            {isVideoDisplay ? (
                <div className="display">
                    <div id="display_content" onClick={handleDisplayContentClick}>
                        {!canPlayDisplayVideo && (
                            <div
                                className="loader-container"
                                id="display_loader"
                                style={{ display: 'flex' }}
                            >
                                <div className="loader"></div>
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            autoPlay={autoplayEnabled}
                            loop
                            muted
                            src={displayUrl}
                            poster={props.thumbnail}
                            id="view_display"
                            style={{
                                width: '100%',
                                maxWidth: isFullscreen ? '100%' : '600px',
                                maxHeight: isFullscreen ? '100%' : '500px',
                                height: isFullscreen ? '100%' : 'auto',
                                objectFit: 'contain',
                            }}
                            onCanPlayThrough={() => {
                                setCanPlayDisplayVideo(true);
                            }}
                            onPlay={() => {
                                setIsPlaying(true);
                            }}
                            onPause={() => {
                                setIsPlaying(false);
                                setShowPlayButton(true);
                                clearHidePlayControlTimeout();
                            }}
                        />

                        <div
                            id="play_control"
                            style={{
                                opacity: showPlayButton ? 1 : 0,
                                cursor: 'pointer',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleDisplayVideo();
                            }}
                        >
                            <i
                                className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}
                            ></i>
                        </div>

                        <div id="setting">
                            <div id="dis_autoplay" onClick={toggleAutoplayPreference}>
                                <i className="fa-solid fa-forward"></i>
                                <span>{autoplayEnabled ? 'Auto' : 'Manual'}</span>
                            </div>
                            <div id="dis_quality" style={{ display: 'flex' }}>
                                <i className="fa-solid fa-gear" id="fa_gear">
                                    {displayQuality}
                                </i>
                            </div>

                            <div id="dis_fullscreen" onClick={handleFullscreen}>
                                <i className="fa-solid fa-expand"></i>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="display">
                    <div id="display_content_img">
                        <img
                            src={displayUrl || props.thumbnail}
                            alt="wallpaper"
                        />

                        <div id="setting">
                            <div id="dis_quality">
                                <i className="fa-solid fa-gear" id="fa_gear">
                                    {displayQuality}
                                </i>
                            </div>
                            <div id="dis_fullscreen" onClick={handleFullscreenimg}>
                                <i className="fa-solid fa-expand"></i>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
