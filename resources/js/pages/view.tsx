import { Head, Link, router, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
import { login } from '@/routes';
import '../../css/style.css';
import '../../css/new_style.css';
import Header from '@/components/includes/Header';
import Footer from '@/components/includes/Footer';
import '../../css/view.css';
import ViewWallpaperDisplay from '@/components/pages/view/View_wallpaper_display';
import View_tag from '@/components/pages/view/View_Tag';
import React, { useEffect, useState } from 'react';
import WallpaperCard from '@/components/common/WallpaperCard';
import LoadMoreWallpapersButton from '@/components/common/LoadMoreWallpapersButton';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { showGamingAlert } from '@/lib/gaming-alerts';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props as any;
    const { wallpaper } = usePage().props as any;
    const [isDownloadBoxOpen, setIsDownloadBoxOpen] = useState(false);
    const [isSaved, setIsSaved] = useState<boolean>(Boolean(wallpaper?.is_saved));
    const [isSaveLoading, setIsSaveLoading] = useState(false);
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
    const normalizeQuality = (quality: unknown) => {
        const raw = String(quality ?? '').trim().toLowerCase();
        const compact = raw.replace(/\s+/g, '');

        if (compact === '2k') return { value: 1440, label: '2k' };
        if (compact === '4k') return { value: 2160, label: '4k' };
        if (compact === '8k') return { value: 4320, label: '8k' };

        const pMatch = compact.match(/^(\d+)p$/);
        if (pMatch) {
            const pValue = Number.parseInt(pMatch[1], 10);
            return Number.isNaN(pValue)
                ? { value: NaN, label: '' }
                : { value: pValue, label: `${pValue}p` };
        }

        const numberMatch = compact.match(/^(\d+)$/);
        if (numberMatch) {
            const num = Number.parseInt(numberMatch[1], 10);
            return Number.isNaN(num)
                ? { value: NaN, label: '' }
                : { value: num, label: `${num}p` };
        }

        return { value: NaN, label: '' };
    };

    const downloadLinks = (Array.isArray(wallpaper?.links) ? wallpaper.links : [])
        .map((link: any) => {
            const normalized = normalizeQuality(link?.quality);

            return {
                ...link,
                qualityValue: normalized.value,
                qualityLabel: normalized.label,
            };
        })
        .filter((link: any) => !Number.isNaN(link.qualityValue) && !!link.url)
        .sort((a: any, b: any) => b.qualityValue - a.qualityValue);
    const toDownloadQualityQuery = (qualityValue: number) => {
        if (qualityValue === 4320) return '8k';
        if (qualityValue === 2160) return '4k';
        if (qualityValue === 1440) return '2k';
        return `${qualityValue}p`;
    };
    const getDownloadPageUrl = (qualityValue: number) =>
        `/download/${wallpaper.code}?quality=${encodeURIComponent(
            toDownloadQualityQuery(qualityValue),
        )}`;

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
                showGamingAlert({
                    type: 'success',
                    title: 'Link Copied',
                    message: 'Wallpaper URL copied to clipboard.',
                });
                return;
            }

            window.prompt('Copy this wallpaper URL:', wallpaperUrl);
        } catch (error) {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(wallpaperUrl);
                showGamingAlert({
                    type: 'success',
                    title: 'Link Copied',
                    message: 'Wallpaper URL copied to clipboard.',
                });
            }
        }
    };

    useEffect(() => {
        setIsSaved(Boolean(wallpaper?.is_saved));
    }, [wallpaper?.id, wallpaper?.is_saved]);

    const getCsrfToken = () =>
        (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? ''
        ).trim();

    const handleSaveWallpaper = async () => {
        if (!auth?.user) {
            showGamingAlert({
                type: 'warning',
                title: 'Login Needed',
                message: 'Please login to save wallpapers.',
            });
            router.visit(login().url);
            return;
        }

        if (isSaveLoading) {
            return;
        }

        setIsSaveLoading(true);
        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/saved-wallpapers/toggle', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({
                    wallpaper_id: wallpaper.id,
                    _token: csrfToken,
                }),
            });

            if (response.status === 401) {
                showGamingAlert({
                    type: 'warning',
                    title: 'Login Needed',
                    message: 'Please login to save wallpapers.',
                });
                router.visit(login().url);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to save wallpaper');
            }

            const data = await response.json();
            setIsSaved(Boolean(data?.saved));
            showGamingAlert({
                type: data?.saved ? 'success' : 'warning',
                title: data?.saved ? 'Wallpaper Saved' : 'Wallpaper Unsaved',
                message:
                    typeof data?.message === 'string'
                        ? data.message
                        : data?.saved
                          ? 'Added to your saved wallpapers.'
                          : 'Removed from your saved wallpapers.',
            });
        } catch (error) {
            showGamingAlert({
                type: 'error',
                title: 'Save Failed',
                message: 'Could not update saved wallpaper. Please try again.',
            });
        } finally {
            setIsSaveLoading(false);
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
                            <h2 id="name-text">{wallpaper.name}</h2>
                        </div>
                        <div className="buttons">
                            <div className="share" onClick={handleShareWallpaper}>
                                <i className="fa-solid fa-arrow-up-from-bracket"></i>
                            </div>
                            <div
                                className={`save ${isSaved ? 'saved' : ''} ${isSaveLoading ? 'saving' : ''}`}
                                onClick={handleSaveWallpaper}
                            >
                                <i className={isSaved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'}></i>
                            </div>
                            <div className="download">
                                <i
                                    className="fa-regular fa-circle-down"
                                    onClick={() => setIsDownloadBoxOpen(true)}
                                ></i>
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
                <div
                    id="right"
                    style={isDownloadBoxOpen ? { display: 'block' } : undefined}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsDownloadBoxOpen(false);
                        }
                    }}
                >
                    <div id="download_box">
                        <h1>
                            <i className="fa-regular fa-circle-down"></i>Download
                        </h1>
                        <ul id="download_option_list">
                            {downloadLinks.length ? (
                                downloadLinks.map((link: any) => (
                                    <li
                                        className="download_option"
                                        key={link.url}
                                    >
                                        <Link
                                            href={getDownloadPageUrl(
                                                link.qualityValue,
                                            )}
                                            onClick={() =>
                                                setIsDownloadBoxOpen(false)
                                            }
                                        >
                                            {link.qualityLabel}
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <li className="download_option">
                                    <span>No download links available</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}
