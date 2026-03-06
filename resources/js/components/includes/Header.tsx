import { Link } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import { home, login, register } from '@/routes';

export default function Header() {
    const roboticPlaceholders = [
        '> booting search module...',
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
                timeoutId = setTimeout(tick, 500);
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
                        <div className="searchbox">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input
                                type="text"
                                placeholder={placeholderText || '> booting search...'}
                            />
                            <div className="search_with_code"><i className="fa-solid fa-expand"></i>
                            
                            </div>
                        </div>
                    </form>
                </div>
                <div className="right_container">
                    <Link href={login()} className="LoginButton">
                        Login <i className="fa-solid fa-user-astronaut"></i>
                    </Link>
                    <Link href={register()} className="SignupButton">
                        Signup
                    </Link>
                </div>
            </header>
        </>
    );
}
