import { Head, Link, router, usePage } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';
import { showGamingAlert } from '@/lib/gaming-alerts';
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
    const [isCodeSearchOpen, setIsCodeSearchOpen] = useState(false);
    const [codeDigits, setCodeDigits] = useState(['', '', '', '']);
    const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);
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

    const getCsrfToken = () =>
        (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? ''
        ).trim();

    const getXsrfTokenFromCookie = () => {
        if (typeof document === 'undefined') {
            return '';
        }
        const cookie = document.cookie
            .split('; ')
            .find((item) => item.startsWith('XSRF-TOKEN='));
        if (!cookie) {
            return '';
        }
        const value = cookie.split('=').slice(1).join('=');
        return decodeURIComponent(value ?? '').trim();
    };

    const loadRecentSearches = async () => {
        if (!isAuthenticated) {
            setRecentSearches([]);
            return;
        }

        setIsRecentSearchesLoading(true);
        try {
            const response = await fetch('/search-history', {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!response.ok) {
                setRecentSearches([]);
                return;
            }
            const data = await response.json();
            const normalized = Array.isArray(data) ? data.slice(0, 10) : [];
            setRecentSearches(normalized);
        } catch (error) {
            setRecentSearches([]);
        } finally {
            setIsRecentSearchesLoading(false);
        }
    };

    const persistSearch = async (query: string) => {
        if (!isAuthenticated) {
            return;
        }

        try {
            const csrfToken = getCsrfToken();
            const xsrfToken = getXsrfTokenFromCookie();
            const response = await fetch('/search-history', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                },
                body: JSON.stringify({
                    query,
                    _token: csrfToken,
                }),
            });
            if (!response.ok) {
                return;
            }
            await loadRecentSearches();
        } catch (error) {
            return;
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

    const triggerCodeSearch = () => {
        const normalizedCode = codeDigits.join('').replace(/[^0-9]/g, '').slice(0, 4);
        if (!normalizedCode) {
            return;
        }

        const paddedCode = normalizedCode.padStart(4, '0');

        setCodeDigits(['', '', '', '']);
        router.visit(viewWallpaper(paddedCode).url);
    };

    const handleLogout = () => {
        router.post(logout().url, {}, {
            onSuccess: () => {
                showGamingAlert({
                    type: 'success',
                    title: 'Logged Out',
                    message: 'You have been signed out.',
                });
            },
            onError: () => {
                showGamingAlert({
                    type: 'error',
                    title: 'Logout Failed',
                    message: 'Could not log out. Please try again.',
                });
            },
        });
    };

    const handleCodeDigitChange = (index: number, value: string) => {
        const digit = value.replace(/[^0-9]/g, '').slice(-1);
        setCodeDigits((current) => {
            const next = [...current];
            next[index] = digit;
            return next;
        });

        if (digit && index < 3) {
            codeInputRefs.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyDown = (
        index: number,
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            triggerCodeSearch();
        }
    };

    const handleCodePaste = (
        event: React.ClipboardEvent<HTMLInputElement>,
    ) => {
        event.preventDefault();
        const pastedDigits = event.clipboardData
            .getData('text')
            .replace(/[^0-9]/g, '')
            .slice(0, 4)
            .split('');
        if (!pastedDigits.length) {
            return;
        }

        const nextDigits = ['', '', '', ''];
        pastedDigits.forEach((digit, index) => {
            nextDigits[index] = digit;
        });
        setCodeDigits(nextDigits);

        const focusIndex = Math.min(pastedDigits.length, 4) - 1;
        codeInputRefs.current[focusIndex]?.focus();
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
                setIsCodeSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    return (
        <>
            <Head>
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
                                onChange={(event) => {
                                    setSearchValue(event.target.value);
                                    setIsCodeSearchOpen(false);
                                }}
                            />
                            <button
                                type="button"
                                className="search_with_code"
                                aria-label="Search by code"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    setIsCodeSearchOpen((current) => !current);
                                    window.setTimeout(() => codeInputRefs.current[0]?.focus(), 0);
                                }}
                            >
                                <i className="fa-solid fa-expand"></i>
                            </button>

                            {isSearchFocused && (
                                <div className="search_history_container">
                                    {isCodeSearchOpen ? (
                                        <div className="search_block code_search_block">
                                            <div className="search_history_header">
                                                <span>Search With Code</span>
                                            </div>
                                            <form
                                                className="code_digit_form"
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    triggerCodeSearch();
                                                }}
                                            >
                                                <div className="code_digit_inputs">
                                                    {codeDigits.map((digit, index) => (
                                                        <input
                                                            key={`code-digit-${index}`}
                                                            ref={(element) => {
                                                                codeInputRefs.current[index] =
                                                                    element;
                                                            }}
                                                            className="code_digit_input"
                                                            value={digit}
                                                            onChange={(event) =>
                                                                handleCodeDigitChange(
                                                                    index,
                                                                    event.target.value,
                                                                )
                                                            }
                                                            onKeyDown={(event) =>
                                                                handleCodeKeyDown(index, event)
                                                            }
                                                            onPaste={handleCodePaste}
                                                            inputMode="numeric"
                                                            maxLength={1}
                                                            aria-label={`Code digit ${index + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                                <button type="submit" className="code_go_button">
                                                    Go
                                                </button>
                                            </form>
                                        </div>
                                    ) : searchValue.trim().length > 0 ? (
                                        <div className="search_block search_results_block">
                                            <div className="search_history_header">
                                                <span>Search Results</span>
                                            </div>
                                            {isSearchResultsLoading ? (
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
                                            )}
                                        </div>
                                    ) : (
                                        <div className="search_block">
                                        <div className="search_history_header">
                                            <span>Search History</span>
                                        </div>
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
                                    </div>
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
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="SignupButton"
                            >
                                Logout
                            </button>
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
