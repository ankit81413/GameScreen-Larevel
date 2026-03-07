import { Head, Link, usePage } from '@inertiajs/react';
import Header from '@/components/includes/Header';
import Footer from '@/components/includes/Footer';
import type { SharedData } from '@/types';
import '../../css/style.css';
import '../../css/new_style.css';
import '../../css/account.css';
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
            <Header />

            <section className="account_page">
                <div className="account_shell">
                    <div className="account_hero">
                        <div className="account_avatar">
                            {String(user?.name ?? 'U')
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                        </div>
                        <div className="account_identity">
                            <h1>{user?.name ?? 'User Account'}</h1>
                            <p>@{user?.username ?? 'username'}</p>
                            <div className="account_completion">
                                <span>Profile completion: {profileCompletion}%</span>
                                <div className="meter">
                                    <div
                                        className="meter_fill"
                                        style={{ width: `${profileCompletion}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="account_actions">
                            <Link href="/settings/profile" className="primary_cta">
                                Edit Profile
                            </Link>
                            <Link href="/settings/password" className="ghost_cta">
                                Security
                            </Link>
                        </div>
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
                            <h3>Recent Searches</h3>
                            <p>{recentSearches.length}</p>
                        </div>
                    </div>

                    <div className="account_grid">
                        <div className="panel">
                            <div className="panel_head">
                                <h2>Saved Wallpapers</h2>
                            </div>
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
                                <p className="muted">No saved wallpapers yet.</p>
                            )}
                        </div>

                        <div className="panel">
                            <div className="panel_head">
                                <h2>Your Interests</h2>
                            </div>
                            {isLoading ? (
                                <p className="muted">Loading...</p>
                            ) : interests.length ? (
                                <div className="interest_grid">
                                    {interests.map((item) => (
                                        <div key={item.id} className="interest_chip">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} alt={item.name} />
                                            ) : (
                                                <div className="placeholder" />
                                            )}
                                            <span>{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="muted">No interests selected yet.</p>
                            )}
                        </div>

                        <div className="panel panel_full">
                            <div className="panel_head">
                                <h2>Recent Searches</h2>
                            </div>
                            {isLoading ? (
                                <p className="muted">Loading...</p>
                            ) : recentSearches.length ? (
                                <div className="search_chip_row">
                                    {recentSearches.map((query) => (
                                        <Link
                                            key={query}
                                            href={`/auto-search?search=${encodeURIComponent(query)}`}
                                            className="search_chip"
                                        >
                                            <i className="fa-solid fa-magnifying-glass" />
                                            {query}
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="muted">No recent searches yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}
