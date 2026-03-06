import { Head, Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';
import '../../../css/style.css';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
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
            <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[#0d0f14] px-4 py-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,_rgba(255,153,0,0.08),_transparent_40%),radial-gradient(circle_at_80%_90%,_rgba(255,153,0,0.05),_transparent_35%)]" />

                <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#11141c] p-8 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
                    <div
                        className="flex flex-col gap-8"
                        style={{ padding: '20px' }}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex items-center gap-3"
                            >
                                {/* <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ff9900]/40 bg-[#0a0c11]">
                                <img src="/logo.png" alt="Game Screen" className="h-6 w-6" />
                            </div> */}
                                {/* <span className="text-sm font-semibold tracking-[0.18em] text-[#e6e6e6]">
                                GAME SCREEN
                            </span> */}
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1
                                    className="text-[30px] leading-none text-white"
                                    style={{
                                        fontFamily: '"Doto", sans-serif',
                                        fontOpticalSizing: 'auto',
                                        fontWeight: 500,
                                        fontStyle: 'normal',
                                        fontVariationSettings: '"ROND" 0',
                                    }}
                                >
                                    {title}
                                </h1>
                                <p
                                    className="text-center text-sm text-[#9ca3af]"
                                    style={{
                                        fontFamily: '"Doto", sans-serif',
                                        fontOpticalSizing: 'auto',
                                        fontWeight: 500,
                                        fontStyle: 'normal',
                                        fontVariationSettings: '"ROND" 0',
                                    }}
                                >
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}
