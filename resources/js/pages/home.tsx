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
import { useState } from 'react';
import { useFullScreen } from '@/hooks/useFullScreen';

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
    const {toggleFullScreen} = useFullScreen();

    const [CanplayBannerVideo, SetCanplayBannerVideo] = useState(false);


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
            <div className="banner" id='banner'>
                <div id="autoplay_div" className="zindexup">
                    <div className="play_button">
                        <i className="fa-solid fa-play"></i>
                        <h3>Play</h3>
                    </div>
                    <div className="autoplay_button">
                        <h3>Autoplay</h3>
                        <label className="switch">
                            <input type="checkbox" id="autoplaySwitch" />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>

                <a href="" id="board_a"></a>

                <div id="left" className="zindexup">
                    <p>Prev</p>
                </div>

                <video
                    loop
                    muted
                    autoPlay
                    className="background-clip"
                    id="myVideo"
                    poster="https://images.pexels.com/photos/531880/pexels-photo-531880.jpeg"
                    onCanPlayThrough={()=>{SetCanplayBannerVideo(true)}}
                >
                    <source
                        src="storage/live_wallpaper/spaceship_720.mp4"
                        type="video/mp4"
                        id="bannersrc"
                    />
                </video>

                {!CanplayBannerVideo && (
                <div className="loader-container" id="loader_banner">
                    <div className="loader"></div>
                </div>)}
                <div id="right">
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
