import { Head, Link, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
import '../../css/style.css';
import '../../css/new_style.css';
import Header from '@/components/includes/Header';
import Footer from '@/components/includes/Footer';
import '../../css/view.css';
import ViewWallpaperDisplay from '@/components/pages/view/View_wallpaper_display';
import View_tag from '@/components/pages/view/View_Tag';
import React, { useEffect } from 'react';
import WallpaperCard from '@/components/common/WallpaperCard';
import LoadMoreWallpapersButton from '@/components/common/LoadMoreWallpapersButton';
import { usePaginatedList } from '@/hooks/use-paginated-list';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props as any;
    const { wallpaper } = usePage().props as any;
    const {
        items: similarWallpapers,
        isLoading: isSimilarWallpapersLoading,
        hasMore: hasMoreSimilarWallpapers,
        loadMore: loadMoreSimilarWallpapers,
    } = usePaginatedList({
        initialData: {
            data: [],
            next_page_url: '/similar-wallpapers?page=1',
        },
    });
    const downloadLinks = (Array.isArray(wallpaper?.links) ? wallpaper.links : [])
        .map((link: any) => {
            const qualityText = String(link?.quality ?? '');
            const qualityValue = Number.parseInt(qualityText, 10);
            const qualityLabel = qualityText.endsWith('p')
                ? qualityText
                : `${qualityValue}p`;

            return {
                ...link,
                qualityValue,
                qualityLabel,
            };
        })
        .filter((link: any) => !Number.isNaN(link.qualityValue) && !!link.url)
        .sort((a: any, b: any) => b.qualityValue - a.qualityValue);

    useEffect(() => {
        if (!similarWallpapers.length && hasMoreSimilarWallpapers) {
            loadMoreSimilarWallpapers();
        }
    }, [
        similarWallpapers.length,
        hasMoreSimilarWallpapers,
        loadMoreSimilarWallpapers,
    ]);

    const handleShareWallpaper = async () => {
        const wallpaperUrl =
            typeof window !== 'undefined'
                ? `${window.location.origin}/view/${wallpaper.code}`
                : `/view/${wallpaper.code}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: wallpaper?.name ?? 'Wallpaper',
                    text: 'Check out this wallpaper',
                    url: wallpaperUrl,
                });
                return;
            }

            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(wallpaperUrl);
                window.alert('Wallpaper URL copied to clipboard');
                return;
            }

            window.prompt('Copy this wallpaper URL:', wallpaperUrl);
        } catch (error) {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(wallpaperUrl);
                window.alert('Wallpaper URL copied to clipboard');
            }
        }
    };

    return (
        <>
            <Head title="View">
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

            <Header />

            <section className="main">
                <div id="left">
                    <ViewWallpaperDisplay links={wallpaper.links} thumbnail={wallpaper.thumbnail} type={wallpaper.type}/>
                    <div className="menu">
                        <div className="name">
                            <h2 id="name-text">hi</h2>
                        </div>
                        <div className="buttons">
                            <div className="share" onClick={handleShareWallpaper}>
                                <i className="fa-solid fa-arrow-up-from-bracket"></i>
                            </div>
                            <div className="save">
                                <i className="fa-solid fa-bookmark"></i>
                            </div>
                            <div className="download">
                                <i className="fa-regular fa-circle-down"></i>
                            </div>
                        </div>
                    </div>
                    <div className="similar">
                        <div id="similar_tags">
                            {wallpaper.tags.map((tag: any) => (
                                <View_tag key={tag.id} name={tag.name}/>
                            ))}

                        </div>
                        <div id="similar_wallpapers">
                            <section id="wallpaper-container">
                                {similarWallpapers.map((item: any, index: number) => (
                                    <WallpaperCard
                                        key={`${item.id}-${index}`}
                                        item={item}
                                    />
                                ))}
                            </section>
                            <LoadMoreWallpapersButton
                                onClick={loadMoreSimilarWallpapers}
                                loading={isSimilarWallpapersLoading}
                                hasMore={hasMoreSimilarWallpapers}
                            />
                        </div>
                    </div>
                </div>
                <div id="right">
                    <div id="download_box">
                        <h1>
                            <i className="fa-regular fa-circle-down"></i>Download
                        </h1>
                        <ul id="download_option_list">
                            {downloadLinks.map((link: any) => (
                                <li className="download_option" key={link.url}>
                                    <a href={link.url} target="_blank">
                                        {link.qualityLabel}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}
