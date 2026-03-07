import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFullScreen } from '@/hooks/useFullScreen';

const AUTOPLAY_STORAGE_KEY = 'viewWallpaperAutoplay';

export default function ViewWallpaperDisplay(props: any) {
    // console.log(props);
    const isVideoDisplay = Number(props.type) === 2;
    const preferredQuality = 720;
    const qualityOptions = useMemo(() => {
        const links = Array.isArray(props.links) ? props.links : [];

        return links
            .map((link: any) => {
                const qualityText = String(link?.quality ?? '');
                const qualityValue = Number.parseInt(qualityText, 10);
                const qualityLabel = qualityText.endsWith('p')
                    ? qualityText
                    : `${qualityValue}p`;

                return {
                    url: link?.url ?? '',
                    qualityValue,
                    qualityLabel,
                };
            })
            .filter(
                (option: any) =>
                    !!option.url && !Number.isNaN(option.qualityValue),
            )
            .sort((a: any, b: any) => b.qualityValue - a.qualityValue);
    }, [props.links]);

    const { toggleFullScreen } = useFullScreen();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [canPlayDisplayVideo, setCanPlayDisplayVideo] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(true);
    const [displayUrl, setDisplayUrl] = useState(props.thumbnail ?? '');
    const [displayQuality, setDisplayQuality] = useState('720p');
    const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
    const [resumeOnQualityChange, setResumeOnQualityChange] = useState(false);
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
        if (!qualityOptions.length) {
            setDisplayUrl(props.thumbnail ?? '');
            setDisplayQuality('720p');
            return;
        }

        const exactMatch = qualityOptions.find(
            (link: any) => link.qualityValue === preferredQuality,
        );

        const lowerMatch = qualityOptions
            .filter((link: any) => link.qualityValue < preferredQuality)
            .sort((a: any, b: any) => b.qualityValue - a.qualityValue)[0];

        const fallbackMatch = qualityOptions[0];

        const selectedLink = exactMatch ?? lowerMatch ?? fallbackMatch;

        setDisplayUrl(selectedLink?.url ?? props.thumbnail ?? '');
        setDisplayQuality(selectedLink?.qualityLabel ?? '720p');
    }, [qualityOptions, props.thumbnail, preferredQuality]);

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

    useEffect(() => {
        setIsQualityMenuOpen(false);
    }, [displayUrl]);

    const handleFullscreen = () => {
        toggleFullScreen('display_content');
    };

    const handleFullscreenimg = () => {
        const el = document.getElementById('display_content_img') as any;
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

    const openQualityMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setIsQualityMenuOpen(true);
    };

    const selectQuality = (option: any) => {
        if (!option?.url || option.url === displayUrl) {
            setIsQualityMenuOpen(false);
            return;
        }

        if (isVideoDisplay) {
            const wasPlaying = !!videoRef.current && !videoRef.current.paused;
            if (videoRef.current) {
                videoRef.current.pause();
            }
            setResumeOnQualityChange(wasPlaying);
            setCanPlayDisplayVideo(false);
        }

        setDisplayUrl(option.url);
        setDisplayQuality(option.qualityLabel);
        setIsQualityMenuOpen(false);
    };

    return (
        <>
            {isQualityMenuOpen && (
                <div
                    id="video_quality_backdrop"
                    onClick={() => setIsQualityMenuOpen(false)}
                >
                    <div id="video_quality" onClick={(e) => e.stopPropagation()}>
                        <h2>Choose quality</h2>
                        <ul id="video_quality_list">
                            {qualityOptions.map((option: any) => (
                                <li
                                    key={`${option.qualityLabel}-${option.url}`}
                                    onClick={() => selectQuality(option)}
                                    style={{
                                        outline:
                                            option.qualityLabel === displayQuality
                                                ? '2px solid #ff9900'
                                                : 'none',
                                    }}
                                >
                                    {option.qualityLabel}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

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
                                if (resumeOnQualityChange) {
                                    videoRef.current?.play().catch(() => null);
                                    setResumeOnQualityChange(false);
                                }
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
                                <div onClick={openQualityMenu}>
                                    <i className="fa-solid fa-gear" id="fa_gear">
                                        {displayQuality}
                                    </i>
                                </div>
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
                            <div id="dis_quality" onClick={openQualityMenu}>
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
