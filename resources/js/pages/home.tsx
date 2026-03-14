import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import type { SharedData } from '@/types';
import '../../css/style.css';
import '../../css/new_style.css';
import Header from '@/components/includes/Header';
import WallpaperCard from '@/components/common/WallpaperCard';
import LoadMoreWallpapersButton from '@/components/common/LoadMoreWallpapersButton';
import Footer from '@/components/includes/Footer';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import React, { useEffect, useRef, useState } from 'react';
import { useFullScreen } from '@/hooks/useFullScreen';

const BANNER_AUTOPLAY_STORAGE_KEY = 'bannerAutoplayEnabled';
const DEFAULT_BANNER_VIDEO_URL = 'storage/live_wallpaper/spaceship_720.mp4';
const DEFAULT_BANNER_POSTER_URL = 'storage/live_wallpaper/spaceShip_thumb.jpeg';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props as any;
    const { wallpapers } = usePage().props as any;
    const initialWallpapers =
        wallpapers ?? ({ data: [], next_page_url: null } as any);
    const { items, isLoading, hasMore, loadMore } = usePaginatedList({
        initialData: initialWallpapers,
    });
    const { toggleFullScreen } = useFullScreen();

    const [bannerWallpapers, setBannerWallpapers] = useState<any[]>([]);
    const [CanplayBannerVideo, SetCanplayBannerVideo] = useState(false);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [bannerAutoplayEnabled, setBannerAutoplayEnabled] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return (
            window.localStorage.getItem(BANNER_AUTOPLAY_STORAGE_KEY) === 'true'
        );
    });
    const bannerVideoReff = useRef<HTMLVideoElement | null>(null);
    const play_buttonReff = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const fetchBannerWallpapers = async () => {
            try {
                const response = await fetch('/banner-wallpapers', {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    setBannerWallpapers([]);
                    return;
                }

                const data = await response.json();
                if (!Array.isArray(data)) {
                    setBannerWallpapers([]);
                    return;
                }

                setBannerWallpapers(data);
            } catch (error: any) {
                if (error?.name === 'AbortError') {
                    return;
                }

                setBannerWallpapers([]);
            }
        };

        fetchBannerWallpapers();

        return () => controller.abort();
    }, []);

    const selectedBannerWallpaper =
        bannerWallpapers[currentBannerIndex] ?? bannerWallpapers[0] ?? null;

    const getBannerVideoUrl = (wallpaper: any) => {
        const links = Array.isArray(wallpaper?.links) ? wallpaper.links : [];
        const parsedLinks = links
            .map((link: any) => ({
                ...link,
                qualityValue: Number.parseInt(String(link?.quality ?? ''), 10),
            }))
            .filter((link: any) => !Number.isNaN(link.qualityValue));

        if (!parsedLinks.length) {
            return '';
        }

        const exact720 = parsedLinks.find((link: any) => link.qualityValue === 720);
        const higherThan720 = parsedLinks
            .filter((link: any) => link.qualityValue > 720)
            .sort((a: any, b: any) => a.qualityValue - b.qualityValue)[0];
        const fallback = parsedLinks.sort(
            (a: any, b: any) => b.qualityValue - a.qualityValue,
        )[0];

        return (exact720 ?? higherThan720 ?? fallback)?.url ?? '';
    };

    const selectedBannerVideoUrl =
        getBannerVideoUrl(selectedBannerWallpaper) || DEFAULT_BANNER_VIDEO_URL;
    const selectedBannerPoster =
        selectedBannerWallpaper?.thumbnail ?? DEFAULT_BANNER_POSTER_URL;
    const selectedBannerHref = selectedBannerWallpaper
        ? `/view/${selectedBannerWallpaper.code}`
        : '#';

    useEffect(() => {
        if (!bannerWallpapers.length) {
            setCurrentBannerIndex(0);
            return;
        }

        if (currentBannerIndex >= bannerWallpapers.length) {
            setCurrentBannerIndex(0);
        }
    }, [bannerWallpapers, currentBannerIndex]);

    useEffect(() => {
        SetCanplayBannerVideo(false);
        if (!selectedBannerVideoUrl) {
            SetCanplayBannerVideo(true);
        }

        const playButton = play_buttonReff.current;
        if (!playButton) {
            return;
        }

        const playText = playButton.querySelector('h3');
        const playIcon = playButton.querySelector('i');

        if (playText) playText.innerText = 'Play';
        playIcon?.classList.add('fa-play');
        playIcon?.classList.remove('fa-pause');
    }, [currentBannerIndex, selectedBannerVideoUrl]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(
            BANNER_AUTOPLAY_STORAGE_KEY,
            bannerAutoplayEnabled ? 'true' : 'false',
        );
    }, [bannerAutoplayEnabled]);

    useEffect(() => {
        const video = bannerVideoReff.current;

        if (!video || !CanplayBannerVideo) {
            return;
        }

        const syncBannerPlayback = async () => {
            if (bannerAutoplayEnabled) {
                try {
                    await video.play();
                } catch (error) {
                    video.pause();
                }
            } else {
                video.pause();
            }

            checkPlayText();
        };

        syncBannerPlayback();
    }, [CanplayBannerVideo, bannerAutoplayEnabled]);

    const play_pause_bannerVideo = () => {
        const video = bannerVideoReff.current;

        if (!video) {
            return;
        }

        if (video.paused) {
            video.play();
            checkPlayText();
        } else {
            video.pause();
            checkPlayText();
        }
    };

    const checkPlayText = () => {
        const play_button = play_buttonReff.current;
        const video = bannerVideoReff.current;

        if (!video || !play_button) {
            return;
        }

        const play_text: HTMLElement | null = play_button.querySelector('h3');
        const play_icon: HTMLElement | null = play_button.querySelector('i');
        if (!video.paused) {
            if (play_text) play_text.innerText = 'Pause';
            play_icon?.classList.add('fa-pause');
            play_icon?.classList.remove('fa-play');
        } else {
            if (play_text) play_text.innerText = 'Play';
            play_icon?.classList.add('fa-play');
            play_icon?.classList.remove('fa-pause');
        }
    };

    const goToNextBanner = () => {
        if (bannerWallpapers.length <= 1) {
            return;
        }
        setCurrentBannerIndex(
            (current) => (current + 1) % bannerWallpapers.length,
        );
    };

    const goToPreviousBanner = () => {
        if (bannerWallpapers.length <= 1) {
            return;
        }
        setCurrentBannerIndex(
            (current) =>
                (current - 1 + bannerWallpapers.length) % bannerWallpapers.length,
        );
    };

    const toggleBannerAutoplay = () => {
        setBannerAutoplayEnabled((currentValue) => !currentValue);
    };


    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Doto:wght@100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Rethink+Sans:ital,wght@0,400..800;1,400..800&family=Roboto:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]"> */}
            {/* <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header> 
             </div> */}

            <Header />
            <div className="banner" id="banner">
                <div id="autoplay_div" className="zindexup">
                    <div
                        className="play_button"
                        onClick={play_pause_bannerVideo}
                        style={{ cursor: 'pointer' }}
                        ref={play_buttonReff}
                    >
                        <i className="fa-solid fa-play"></i>
                        <h3>Play</h3>
                    </div>
                    <div className="autoplay_button">
                        <h3>Autoplay</h3>
                        <label className="switch">
                            <input
                                type="checkbox"
                                id="autoplaySwitch"
                                checked={bannerAutoplayEnabled}
                                onChange={toggleBannerAutoplay}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>

                <Link href={selectedBannerHref} id="board_a"></Link>

                <div id="left" className="zindexup" onClick={goToPreviousBanner}>
                    <p>Prev</p>
                </div>

                <video
                    key={selectedBannerWallpaper?.id ?? 'empty-banner'}
                    loop
                    muted
                    autoPlay={bannerAutoplayEnabled}
                    className="background-clip"
                    id="myVideo"
                    poster={selectedBannerPoster}
                    src={selectedBannerVideoUrl}
                    onLoadStart={() => {
                        SetCanplayBannerVideo(false);
                    }}
                    onCanPlay={() => {
                        SetCanplayBannerVideo(true);
                    }}
                    ref={bannerVideoReff}
                />

                {!CanplayBannerVideo && (
                    <div className="loader-container" id="loader_banner">
                        <div className="loader"></div>
                    </div>
                )}
                <div id="right" className="zindexup" onClick={goToNextBanner}>
                    <p>Next</p>
                </div>

                <div
                    id="dis_fullscreen"
                    onClick={() => toggleFullScreen('banner')}
                >
                    <i className="fa-solid fa-expand banner_fullscreen"></i>
                </div>
            </div>

            <section className="main">
                <section className="wallpaper-container">
                    {items.map((item: any) => (
                        <WallpaperCard key={item.id} item={item} />
                    ))}
                </section>
            </section>
            <LoadMoreWallpapersButton
                onClick={loadMore}
                loading={isLoading}
                hasMore={hasMore}
            />
            <Footer />
        </>
    );
}
