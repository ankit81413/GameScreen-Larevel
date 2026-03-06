import { Link, usePage } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';
import { home, login, logout, register } from '@/routes';
import type { SharedData } from '@/types';

export default function Header() {
    const { auth } = usePage<SharedData>().props as any;
    const isAuthenticated = !!auth?.user;
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
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
                    <form action="" method="post">
                        <div
                            className={`searchbox ${isSearchFocused ? 'searchbox-focused' : ''}`}
                        >
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={placeholderText || '> booting search...'}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => {
                                    window.setTimeout(() => {
                                        setIsSearchFocused(false);
                                    }, 0);
                                }}
                            />
                            <div className="search_with_code"><i className="fa-solid fa-expand"></i>
                            
                            </div>
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
