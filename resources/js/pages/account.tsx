import { Head, Link, usePage } from '@inertiajs/react';
import AccountDashboardLayout from '@/layouts/account-dashboard-layout';
import type { SharedData } from '@/types';
import React, { useEffect, useMemo, useState } from 'react';
import { showGamingAlert } from '@/lib/gaming-alerts';

type SavedWallpaperItem = {
    id: number;
    wallpaper: {
        id: number;
        code: string;
        name: string;
        thumbnail: string;
        type?: number;
    } | null;
};

type InterestItem = {
    id: number;
    name: string;
    thumbnail?: string | null;
};

export default function Account() {
    const { auth } = usePage<SharedData>().props as any;
    const user = auth?.user;
    const [savedWallpapers, setSavedWallpapers] = useState<SavedWallpaperItem[]>([]);
    const [interests, setInterests] = useState<InterestItem[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAccountData = async () => {
            setIsLoading(true);
            try {
                const [savedResponse, interestsResponse, searchesResponse] =
                    await Promise.all([
                        fetch('/saved-wallpapers', {
                            headers: { Accept: 'application/json' },
                            credentials: 'same-origin',
                        }),
                        fetch('/onboarding/my-interests', {
                            headers: { Accept: 'application/json' },
                            credentials: 'same-origin',
                        }),
                        fetch('/search-history', {
                            headers: { Accept: 'application/json' },
                            credentials: 'same-origin',
                        }),
                    ]);

                const savedJson = savedResponse.ok ? await savedResponse.json() : { data: [] };
                const interestsJson = interestsResponse.ok ? await interestsResponse.json() : [];
                const searchesJson = searchesResponse.ok ? await searchesResponse.json() : [];

                setSavedWallpapers(
                    Array.isArray(savedJson?.data) ? savedJson.data : [],
                );
                setInterests(Array.isArray(interestsJson) ? interestsJson : []);
                setRecentSearches(Array.isArray(searchesJson) ? searchesJson : []);
            } catch (error) {
                showGamingAlert({
                    type: 'error',
                    title: 'Account Load Failed',
                    message: 'Could not load your latest account data.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadAccountData();
    }, []);

    const profileCompletion = useMemo(() => {
        const checks = [
            Boolean(user?.name),
            Boolean(user?.username),
            Boolean(user?.email),
            Boolean(user?.birthdate),
            Boolean(user?.gender),
            Boolean(user?.bio),
            interests.length > 0,
        ];
        const score = checks.filter(Boolean).length;
        return Math.round((score / checks.length) * 100);
    }, [user, interests.length]);

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
                        <Link href="/settings/profile" className="primary_cta">
                            <i className="fa-regular fa-pen-to-square"></i> Edit profile
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
                            <h3>Saved</h3>
                            <p>{savedWallpapers.length}</p>
                        </div>
                        <div className="stat_card">
                            <h3>Interests</h3>
                            <p>{interests.length}</p>
                        </div>
                        <div className="stat_card">
                            <h3>Searches</h3>
                            <p>{recentSearches.length}</p>
                        </div>
                        <div className="stat_card">
                            <h3>Profile</h3>
                            <p>{profileCompletion}%</p>
                        </div>
                    </div>

                    <div className="account_tabs">
                        <span className="active">Gallery ({savedWallpapers.length})</span>
                        <span>Interests ({interests.length})</span>
                        <span>Searches ({recentSearches.length})</span>
                    </div>

                    <div className="panel panel_full">
                        {isLoading ? (
                            <p className="muted">Loading...</p>
                        ) : savedWallpapers.length ? (
                            <div className="saved_wall_grid">
                                {savedWallpapers.map((item) =>
                                    item.wallpaper ? (
                                        <Link
                                            key={item.id}
                                            href={`/view/${item.wallpaper.code}`}
                                            className="saved_wall_card"
                                        >
                                            <img
                                                src={item.wallpaper.thumbnail}
                                                alt={item.wallpaper.name}
                                            />
                                            <span>{item.wallpaper.name}</span>
                                        </Link>
                                    ) : null,
                                )}
                            </div>
                        ) : (
                            <div className="empty_block">
                                <h2>No content yet</h2>
                                <p>Save wallpapers to see your gallery here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </AccountDashboardLayout>
        </>
    );
}
