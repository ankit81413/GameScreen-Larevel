import { Head, Link, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import WallpaperCard from '@/components/common/WallpaperCard';
import AccountDashboardLayout from '@/layouts/account-dashboard-layout';
import { showGamingAlert } from '@/lib/gaming-alerts';
import type { SharedData } from '@/types';

type SavedWallpaperItem = {
    id: number;
    wallpaper: {
        id: number;
        code: string;
        name: string;
        thumbnail: string;
        type?: number;
        orientation?: 'land' | 'port';
        links?: Array<{ quality?: string | number; url?: string }>;
    } | null;
};

type OwnedWallpaperItem = {
    id: number;
    code: string;
    name: string;
    thumbnail: string;
    type?: number;
    is_private?: boolean;
    deleted_at?: string | null;
    processing?: boolean;
    orientation?: 'land' | 'port';
    links?: Array<{ quality?: string | number; url?: string }>;
};

type AccountTab = 'profile' | 'saved' | 'archive';

export default function Account() {
    const { auth } = usePage<SharedData>().props as any;
    const user = auth?.user;
    const [activeTab, setActiveTab] = useState<AccountTab>('profile');
    const [openMenuWallpaperId, setOpenMenuWallpaperId] = useState<number | null>(null);
    const [ownedWallpapers, setOwnedWallpapers] = useState<OwnedWallpaperItem[]>([]);
    const [savedWallpapers, setSavedWallpapers] = useState<SavedWallpaperItem[]>([]);
    const [archivedWallpapers, setArchivedWallpapers] = useState<OwnedWallpaperItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshingProcessing, setIsRefreshingProcessing] = useState(false);

    const loadAccountData = async (showLoadingState = false) => {
        if (showLoadingState) {
            setIsLoading(true);
        }

        try {
            const [ownedResponse, savedResponse, archivedResponse] = await Promise.all([
                fetch('/my-wallpapers', {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                }),
                fetch('/saved-wallpapers', {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                }),
                fetch('/my-wallpapers-archived', {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                }),
            ]);

            const ownedJson = ownedResponse.ok ? await ownedResponse.json() : [];
            const savedJson = savedResponse.ok ? await savedResponse.json() : { data: [] };
            const archivedJson = archivedResponse.ok ? await archivedResponse.json() : [];

            setOwnedWallpapers(Array.isArray(ownedJson) ? ownedJson : []);
            setSavedWallpapers(Array.isArray(savedJson?.data) ? savedJson.data : []);
            setArchivedWallpapers(Array.isArray(archivedJson) ? archivedJson : []);
        } catch (_error) {
            showGamingAlert({
                type: 'error',
                title: 'Account Load Failed',
                message: 'Could not load your latest account data.',
            });
        } finally {
            if (showLoadingState) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        loadAccountData(true);
    }, []);

    useEffect(() => {
        if (!ownedWallpapers.some((item) => item.processing)) {
            return;
        }

        const intervalId = window.setInterval(async () => {
            setIsRefreshingProcessing(true);
            await loadAccountData(false);
            setIsRefreshingProcessing(false);
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, [ownedWallpapers]);

    useEffect(() => {
        const handleWindowClick = () => {
            setOpenMenuWallpaperId(null);
        };

        window.addEventListener('click', handleWindowClick);
        return () => window.removeEventListener('click', handleWindowClick);
    }, []);

    const getCsrfToken = () =>
        (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? ''
        ).trim();

    const togglePrivacy = async (wallpaperId: number, nextPrivate: boolean) => {
        try {
            const csrfToken = getCsrfToken();
            const response = await fetch(`/account/wallpapers/${wallpaperId}/privacy`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({ is_private: nextPrivate, _token: csrfToken }),
            });

            if (!response.ok) {
                throw new Error('Privacy update failed');
            }

            setOwnedWallpapers((current) =>
                current.map((item) =>
                    item.id === wallpaperId
                        ? { ...item, is_private: nextPrivate }
                        : item,
                ),
            );
            showGamingAlert({
                type: 'success',
                title: 'Privacy Updated',
                message: nextPrivate
                    ? 'Wallpaper is now private.'
                    : 'Wallpaper is now public.',
            });
        } catch (_error) {
            showGamingAlert({
                type: 'error',
                title: 'Action Failed',
                message: 'Could not update privacy.',
            });
        }
    };

    const processingCount = ownedWallpapers.filter((item) => item.processing).length;

    const deleteOwnedWallpaper = async (wallpaperId: number) => {
        try {
            const csrfToken = getCsrfToken();
            const response = await fetch(`/account/wallpapers/${wallpaperId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
            });

            if (!response.ok) {
                throw new Error('Delete failed');
            }

            setOwnedWallpapers((current) => {
                const target = current.find((item) => item.id === wallpaperId);
                if (target) {
                    setArchivedWallpapers((archived) => [
                        { ...target, deleted_at: new Date().toISOString() },
                        ...archived,
                    ]);
                }
                return current.filter((item) => item.id !== wallpaperId);
            });
            showGamingAlert({
                type: 'warning',
                title: 'Wallpaper Deleted',
                message: 'Wallpaper moved to archive.',
            });
        } catch (_error) {
            showGamingAlert({
                type: 'error',
                title: 'Delete Failed',
                message: 'Could not delete wallpaper.',
            });
        }
    };

    const restoreArchivedWallpaper = async (wallpaperId: number) => {
        try {
            const csrfToken = getCsrfToken();
            const response = await fetch(`/account/wallpapers/${wallpaperId}/restore`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({ _token: csrfToken }),
            });

            if (!response.ok) {
                throw new Error('Restore failed');
            }

            const data = await response.json();
            const restored = data?.wallpaper;
            if (restored) {
                setOwnedWallpapers((current) => [restored, ...current]);
            }
            setArchivedWallpapers((current) =>
                current.filter((item) => item.id !== wallpaperId),
            );

            showGamingAlert({
                type: 'success',
                title: 'Wallpaper Restored',
                message: 'Wallpaper restored from archive.',
            });
        } catch (_error) {
            showGamingAlert({
                type: 'error',
                title: 'Restore Failed',
                message: 'Could not restore wallpaper.',
            });
        }
    };

    return (
        <>
            <Head title="Account" />
            <AccountDashboardLayout section="overview">
                <div className="account_shell">
                    <div className="account_top">
                        <div className="account_identity">
                            <div className="account_avatar">
                                {String(user?.name ?? 'U')
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                            <div>
                                <h1>{user?.name ?? 'User Account'}</h1>
                                <p>@{user?.username ?? 'username'}</p>
                            </div>
                        </div>
                        <Link href="/upload" className="primary_cta">
                            <i className="fa-solid fa-upload"></i> Upload
                        </Link>
                    </div>

                    <div className="account_quick_actions">
                        <Link href="/account/edit-profile" className="quick_link">
                            Edit Profile
                        </Link>
                        <Link href="/account/change-password" className="quick_link">
                            Change Password
                        </Link>
                        <Link href="/account/delete-account" className="quick_link danger">
                            Delete Account
                        </Link>
                    </div>

                    <div className="account_stats">
                        <div className="stat_card">
                            <h3>Profile Wallpapers</h3>
                            <p>{ownedWallpapers.length}</p>
                        </div>
                        <div className="stat_card">
                            <h3>Saved</h3>
                            <p>{savedWallpapers.length}</p>
                        </div>
                        <div className="stat_card">
                            <h3>Archive</h3>
                            <p>{archivedWallpapers.length}</p>
                        </div>
                        <div className="stat_card">
                            <h3>Total</h3>
                            <p>{ownedWallpapers.length + savedWallpapers.length + archivedWallpapers.length}</p>
                        </div>
                    </div>

                    <div className="account_tabs">
                        <button
                            type="button"
                            className={activeTab === 'profile' ? 'active' : ''}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profile ({ownedWallpapers.length})
                        </button>
                        <button
                            type="button"
                            className={activeTab === 'saved' ? 'active' : ''}
                            onClick={() => setActiveTab('saved')}
                        >
                            Saved ({savedWallpapers.length})
                        </button>
                        <button
                            type="button"
                            className={activeTab === 'archive' ? 'active' : ''}
                            onClick={() => setActiveTab('archive')}
                        >
                            Archive ({archivedWallpapers.length})
                        </button>
                    </div>

                    {processingCount > 0 && (
                        <div className="account_processing_notice">
                            <div>
                                <strong>
                                    {processingCount} upload{processingCount > 1 ? 's are' : ' is'} still processing
                                </strong>
                                <p>
                                    Quality variants and thumbnails are being generated in the
                                    background.
                                </p>
                            </div>
                            <span>{isRefreshingProcessing ? 'Refreshing...' : 'Auto-refreshing'}</span>
                        </div>
                    )}

                    <div className="panel panel_full">
                        {isLoading ? (
                            <p className="muted">Loading...</p>
                        ) : activeTab === 'profile' && ownedWallpapers.length ? (
                            <div className="wallpaper-container">
                                {ownedWallpapers.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`owned_wallpaper_item ${item.orientation === 'port' ? 'portrait' : 'landscape'}`}
                                    >
                                        <WallpaperCard item={item} />
                                        <div className="owned_menu_wrap">
                                            <button
                                                type="button"
                                                className="owned_menu_trigger"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setOpenMenuWallpaperId((current) =>
                                                        current === item.id ? null : item.id,
                                                    );
                                                }}
                                            >
                                                <i className="fa-solid fa-ellipsis"></i>
                                            </button>
                                            {openMenuWallpaperId === item.id && (
                                                <div
                                                    className="owned_menu_dropdown"
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <div className="owned_menu_item muted">
                                                        {item.is_private ? 'Private' : 'Public'}
                                                    </div>
                                                    <Link
                                                        href={`/account/wallpapers/${item.id}/edit`}
                                                        className="owned_menu_item"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="owned_menu_item"
                                                        onClick={() =>
                                                            togglePrivacy(
                                                                item.id,
                                                                !item.is_private,
                                                            )
                                                        }
                                                    >
                                                        {item.is_private
                                                            ? 'Make Public'
                                                            : 'Make Private'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="owned_menu_item danger"
                                                        onClick={() =>
                                                            deleteOwnedWallpaper(item.id)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'saved' && savedWallpapers.length ? (
                            <div className="wallpaper-container">
                                {savedWallpapers.map((item) =>
                                    item.wallpaper ? (
                                        <WallpaperCard key={item.id} item={item.wallpaper} />
                                    ) : null,
                                )}
                            </div>
                        ) : activeTab === 'archive' && archivedWallpapers.length ? (
                            <div className="wallpaper-container">
                                {archivedWallpapers.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`owned_wallpaper_item ${item.orientation === 'port' ? 'portrait' : 'landscape'}`}
                                    >
                                        <WallpaperCard item={item} />
                                        <div className="owned_menu_wrap">
                                            <button
                                                type="button"
                                                className="owned_menu_trigger"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setOpenMenuWallpaperId((current) =>
                                                        current === item.id ? null : item.id,
                                                    );
                                                }}
                                            >
                                                <i className="fa-solid fa-ellipsis"></i>
                                            </button>
                                            {openMenuWallpaperId === item.id && (
                                                <div
                                                    className="owned_menu_dropdown"
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    <div className="owned_menu_item muted">
                                                        Archived
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="owned_menu_item"
                                                        onClick={() =>
                                                            restoreArchivedWallpaper(item.id)
                                                        }
                                                    >
                                                        Restore
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty_block">
                                <h2>No content yet</h2>
                                <p>
                                    {activeTab === 'profile' &&
                                        'Upload wallpapers to build your profile.'}
                                    {activeTab === 'saved' &&
                                        'Save wallpapers to see them here.'}
                                    {activeTab === 'archive' &&
                                        'Deleted wallpapers appear here. Restore any time.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </AccountDashboardLayout>
        </>
    );
}
