import { Link, router, usePage } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';
import { home, login, logout, register, viewWallpaper } from '@/routes';
import type { SharedData } from '@/types';

export default function Header() {
    const { auth } = usePage<SharedData>().props as any;
    const isAuthenticated = !!auth?.user;
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isRecentSearchesLoading, setIsRecentSearchesLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearchResultsLoading, setIsSearchResultsLoading] = useState(false);
    const roboticPlaceholders = [
        '> calibrating query engine...',
        '> scan: neon_city_4k',
        '> query: samurai wallpapers',
        '> locate: cyberpunk landscape',
        '> fetch: space station view',
    ];
    const [placeholderText, setPlaceholderText] = useState('');

    useEffect(() => {
        let phraseIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const tick = () => {
            const currentPhrase = roboticPlaceholders[phraseIndex];

            if (!isDeleting) {
                charIndex += 1;
                setPlaceholderText(currentPhrase.slice(0, charIndex));

                if (charIndex === currentPhrase.length) {
                    isDeleting = true;
                    timeoutId = setTimeout(tick, 1100);
                    return;
                }

                timeoutId = setTimeout(tick, 55);
                return;
            }

            charIndex -= 1;
            setPlaceholderText(currentPhrase.slice(0, Math.max(charIndex, 0)));

            if (charIndex <= 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % roboticPlaceholders.length;
                timeoutId = setTimeout(tick, 5000);
                return;
            }

            timeoutId = setTimeout(tick, 30);
        };

        timeoutId = setTimeout(tick, 200);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    const loadGuestSearches = () => {
        if (typeof window === 'undefined') {
            return [];
        }
        try {
            const raw = window.localStorage.getItem('recent_searches');
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
        } catch (error) {
            return [];
        }
    };

    const saveGuestSearch = (query: string) => {
        if (typeof window === 'undefined') {
            return;
        }
        const existing = loadGuestSearches().filter((item) => item !== query);
        const updated = [query, ...existing].slice(0, 10);
        window.localStorage.setItem('recent_searches', JSON.stringify(updated));
        setRecentSearches(updated);
    };

    const getCsrfToken = () =>
        (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? ''
        ).trim();

    const loadRecentSearches = async () => {
        if (!isAuthenticated) {
            setRecentSearches(loadGuestSearches());
            return;
        }

        setIsRecentSearchesLoading(true);
        try {
            const response = await fetch('/search-history', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!response.ok) {
                setRecentSearches(loadGuestSearches());
                return;
            }
            const data = await response.json();
            const normalized = Array.isArray(data) ? data.slice(0, 10) : [];
            setRecentSearches(normalized.length ? normalized : loadGuestSearches());
        } catch (error) {
            setRecentSearches(loadGuestSearches());
        } finally {
            setIsRecentSearchesLoading(false);
        }
    };

    const persistSearch = async (query: string) => {
        if (!isAuthenticated) {
            saveGuestSearch(query);
            return;
        }

        try {
            const response = await fetch('/search-history', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ query }),
            });
            if (!response.ok) {
                saveGuestSearch(query);
                return;
            }
            await loadRecentSearches();
        } catch (error) {
            saveGuestSearch(query);
        }
    };

    const triggerSearch = async (query: string) => {
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
            return;
        }

        await persistSearch(normalizedQuery);
        setSearchValue(normalizedQuery);
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
        router.visit(`/auto-search?search=${encodeURIComponent(normalizedQuery)}`);
    };

    useEffect(() => {
        if (!isSearchFocused) {
            return;
        }
        loadRecentSearches();
    }, [isSearchFocused, isAuthenticated]);

    useEffect(() => {
        const query = searchValue.trim();

        if (!isSearchFocused || query.length === 0) {
            setSearchResults([]);
            setIsSearchResultsLoading(false);
            return;
        }

        const timeout = window.setTimeout(async () => {
            setIsSearchResultsLoading(true);
            try {
                const response = await fetch(
                    `/search-suggestions?q=${encodeURIComponent(query)}`,
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                    },
                );
                const data = await response.json();
                setSearchResults(Array.isArray(data) ? data : []);
            } catch (error) {
                setSearchResults([]);
            } finally {
                setIsSearchResultsLoading(false);
            }
        }, 220);

        return () => window.clearTimeout(timeout);
    }, [searchValue, isSearchFocused]);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!searchContainerRef.current) {
                return;
            }

            if (!searchContainerRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    return (
        <>
            <div
                className={`search_focus_backdrop ${isSearchFocused ? 'show' : ''}`}
                onMouseDown={() => {
                    setIsSearchFocused(false);
                    searchInputRef.current?.blur();
                }}
            />
            <header>
                <div className="left_container">
                    <Link href={home()}>
                        <div id="logo">
                            <img src="/logo.png" alt="G" id="logo_image" />
                            <h1 className="font-bold">GAME SCREEN</h1>
                        </div>
                    </Link>
                </div>
                <div className="mid_container">
                    <form
                        action=""
                        method="post"
                        onSubmit={(event) => {
                            event.preventDefault();
                            triggerSearch(searchValue);
                        }}
                    >
                        <div
                            ref={searchContainerRef}
                            className={`searchbox ${isSearchFocused ? 'searchbox-focused' : ''}`}
                        >
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchValue}
                                placeholder={placeholderText || '> booting search...'}
                                onFocus={() => setIsSearchFocused(true)}
                                onChange={(event) =>
                                    setSearchValue(event.target.value)
                                }
                            />
                            <div className="search_with_code"><i className="fa-solid fa-expand"></i>
                            
                            </div>

                            {isSearchFocused && (
                                <div className="search_history_container">
                                    <div className="search_history_header">
                                        <span>
                                            {searchValue.trim().length > 0
                                                ? 'Search Results'
                                                : 'Recent Searches'}
                                        </span>
                                    </div>

                                    {searchValue.trim().length > 0 ? (
                                        isSearchResultsLoading ? (
                                            <div className="search_history_empty">
                                                Searching...
                                            </div>
                                        ) : searchResults.length ? (
                                            <ul className="search_result_list">
                                                {searchResults.map((item) => (
                                                    <li key={item.code}>
                                                        <Link
                                                            href={viewWallpaper(item.code)}
                                                            onClick={() => {
                                                                persistSearch(
                                                                    searchValue.trim(),
                                                                );
                                                                setIsSearchFocused(false);
                                                            }}
                                                            onMouseDown={(event) =>
                                                                event.preventDefault()
                                                            }
                                                        >
                                                            <span className="thumb">
                                                                <img
                                                                    src={item.thumbnail}
                                                                    alt={item.name}
                                                                />
                                                            </span>
                                                            <span className="meta">
                                                                <span className="title">
                                                                    {item.name}
                                                                </span>
                                                                {item.quality ? (
                                                                    <span className="sub">
                                                                        Quality:{' '}
                                                                        {item.quality}
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="search_history_empty">
                                                No results found.
                                            </div>
                                        )
                                    ) : (
                                        <>
                                            {isRecentSearchesLoading ? (
                                                <div className="search_history_empty">
                                                    Loading...
                                                </div>
                                            ) : recentSearches.length ? (
                                                <ul className="search_history_list">
                                                    {recentSearches.map((item) => (
                                                        <li key={item}>
                                                            <button
                                                                type="button"
                                                                onMouseDown={(event) =>
                                                                    event.preventDefault()
                                                                }
                                                                onClick={() =>
                                                                    triggerSearch(item)
                                                                }
                                                            >
                                                                <i className="fa-solid fa-clock-rotate-left"></i>
                                                                <span>{item}</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="search_history_empty">
                                                    No recent searches yet.
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </form>
                </div>
                <div className="right_container">
                    {isAuthenticated ? (
                        <>
                            <Link href="/account" className="LoginButton AccountButton">
                                Account <i className="fa-solid fa-user-astronaut"></i>
                            </Link>
                            <Link
                                href={logout()}
                                method="post"
                                as="button"
                                className="SignupButton"
                            >
                                Logout
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href={login()} className="LoginButton">
                                Login{' '}
                                <i className="fa-solid fa-user-astronaut"></i>
                            </Link>
                            <Link href={register()} className="SignupButton">
                                Signup
                            </Link>
                        </>
                    )}
                </div>
            </header>
        </>
    );
}
