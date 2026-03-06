import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import '../../css/style.css';
import '../../css/download.css';
import Header from '@/components/includes/Header';
import Footer from '@/components/includes/Footer';
import { useEffect, useRef, useState } from 'react';

export default function Download() {
    const [showDonationBack, setShowDonationBack] = useState(false);
    const { wallpaper, download } = usePage().props as any;
    const [progress, setProgress] = useState(0);
    const [timerText, setTimerText] = useState('took : 0:00s');
    const [decryptingText, setDecryptingText] = useState(
        'Preparing your download...',
    );
    const [showSpinner, setShowSpinner] = useState(true);
    const [manualLinkVisible, setManualLinkVisible] = useState(false);
    const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const confettiAnimationFrameRef = useRef<number | null>(null);
    const confettiStopTimeoutRef = useRef<number | null>(null);

    const flipDonationCard = (action: 'donate' | 'back' | 'done') => {
        if (action === 'donate') {
            setShowDonationBack(true);
            return;
        }

        if (action === 'done') {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(100);
            }
            startConfetti();
        }

        setShowDonationBack(false);
    };

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        const formattedSec = sec < 10 ? `0${sec}` : sec;
        return `${min}:${formattedSec}`;
    };

    const triggerDownload = (fileLink: string, fileName: string) => {
        const anchor = document.createElement('a');
        anchor.href = fileLink;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    };

    const startConfetti = () => {
        const canvas = confettiCanvasRef.current;
        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        const colorPalette = ['#ff9900', '#ff4d00', '#ffd166', '#06d6a0', '#118ab2'];
        const particles = Array.from({ length: 140 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 5 + 2,
            dx: Math.random() * 2 - 1,
            dy: Math.random() * 2 + 2,
            color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        }));

        const draw = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                particle.x += particle.dx;
                particle.y += particle.dy;

                if (particle.y > canvas.height + 10) {
                    particle.y = -10;
                    particle.x = Math.random() * canvas.width;
                }

                context.beginPath();
                context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
                context.fillStyle = particle.color;
                context.fill();
            });

            confettiAnimationFrameRef.current = window.requestAnimationFrame(draw);
        };

        if (confettiAnimationFrameRef.current) {
            window.cancelAnimationFrame(confettiAnimationFrameRef.current);
        }
        if (confettiStopTimeoutRef.current) {
            window.clearTimeout(confettiStopTimeoutRef.current);
        }

        draw();

        confettiStopTimeoutRef.current = window.setTimeout(() => {
            if (confettiAnimationFrameRef.current) {
                window.cancelAnimationFrame(confettiAnimationFrameRef.current);
                confettiAnimationFrameRef.current = null;
            }
            context.clearRect(0, 0, canvas.width, canvas.height);
        }, 3000);
    };

    useEffect(() => {
        const wallpaperName = wallpaper?.name ?? 'wallpaper';
        const downloadLink = download?.url ?? '';

        setProgress(0);
        setTimerText('took : 0:00s');
        setShowSpinner(true);
        setManualLinkVisible(false);

        if (!downloadLink) {
            setDecryptingText('Download link not found for this wallpaper/quality.');
            setShowSpinner(false);
            return;
        }

        const guessedNumber = Math.floor(Math.random() * 5);
        let currentStep = 0;
        const totalSteps = Math.max(guessedNumber * 10, 1);
        let timer = 0;
        const timeoutHandles: number[] = [];

        const updateProgress = () => {
            currentStep += 1;
            const currentProgress = Math.min(
                100,
                Math.round((currentStep / totalSteps) * 1000) / 10,
            );
            setProgress(currentProgress);
            setDecryptingText(
                `Decrypting your data please wait (${currentProgress}%).`,
            );

            if (currentStep < totalSteps) {
                const handle = window.setTimeout(
                    updateProgress,
                    Math.random() * 200,
                );
                timeoutHandles.push(handle);
            }
        };

        updateProgress();

        const intervalHandle = window.setInterval(() => {
            const currentTime = formatTime(timer);
            setTimerText(`${currentTime}s`);
            timer += 1;

            if (timer > guessedNumber) {
                window.clearInterval(intervalHandle);
                setTimerText(`took : ${currentTime}s`);
                setDecryptingText("If the download didn't start ");
                setShowSpinner(false);
                setManualLinkVisible(true);
                setProgress(100);
                triggerDownload(downloadLink, wallpaperName);
            }
        }, 1000);

        return () => {
            window.clearInterval(intervalHandle);
            timeoutHandles.forEach((handle) => window.clearTimeout(handle));
        };
    }, [download?.url, wallpaper?.name]);

    useEffect(() => {
        return () => {
            if (confettiAnimationFrameRef.current) {
                window.cancelAnimationFrame(confettiAnimationFrameRef.current);
            }
            if (confettiStopTimeoutRef.current) {
                window.clearTimeout(confettiStopTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <Head title="Download">
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
            <canvas id="vvvf" ref={confettiCanvasRef}></canvas>

            <section id="downloads">
                {/* <a href="download.html?value=0008&quality=4k">click</a> */}
                <div id="downloads_h1">
                    <i className="fa-solid fa-download"></i>
                    <h1>Download</h1>
                </div>

                <main>
                    <section id="donation_container">
                        <div id="cards_container">
                            <div
                                id="donation_center"
                                className="card"
                                style={{
                                    transform: showDonationBack
                                        ? 'rotateY(180deg)'
                                        : 'rotateY(0deg)',
                                }}
                            >
                                <img
                                    src={
                                        wallpaper?.thumbnail ??
                                        'https://www.dropbox.com/scl/fi/ss30jk9zsffdy165d1ji8/480p_2k_2024-09-24_17-16-27_5406.jpg?rlkey=swxogykjakcj3jxusjhezl63v&dl=1'
                                    }
                                    alt=""
                                    id="donation_image"
                                />
                                <div id="donation_details">
                                    <h1>Say Thanks!</h1>
                                    <h2>
                                        Show some love to the Creator by giving
                                        them a small donation.
                                    </h2>
                                    <button
                                        id="donate_button"
                                        onClick={() =>
                                            flipDonationCard('donate')
                                        }
                                    >
                                        Donate
                                    </button>
                                    <a
                                        id="follow_button"
                                        href="https://chat.openai.com/c/a4e5c74a-e40c-4bc6-85ef-41dd9081f3ac"
                                    >
                                        <i className="fa-brands fa-instagram"></i>
                                        Follow us on Instagram
                                    </a>
                                </div>
                            </div>

                            <div
                                id="donation_back"
                                className="card"
                                style={{
                                    transform: showDonationBack
                                        ? 'rotateY(0deg)'
                                        : 'rotateY(180deg)',
                                }}
                            >
                                <div id="donation_qr">
                                    <img src="logo/donation qr.png" alt="" />
                                </div>
                                <div id="donation_back_buttons_div">
                                    <button
                                        id="donation_back_button"
                                        className="donation_back_buttons"
                                        onClick={() => flipDonationCard('back')}
                                    >
                                        Back
                                    </button>
                                    <button
                                        id="donation_done_button"
                                        className="donation_back_buttons"
                                        onClick={() => flipDonationCard('done')}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="wallpaper-container">
                        <div id="download_counter">
                            <div id="counter_heading">
                                <div id="spinner">
                                    <div
                                        className="spinner"
                                        style={{
                                            display: showSpinner ? 'block' : 'none',
                                        }}
                                    ></div>
                                    <h1>Downloading...</h1>
                                </div>
                                <div id="timer">
                                    <h2>{timerText}</h2>
                                </div>
                            </div>

                            <h2 id="download_name">{wallpaper?.name ?? 'Wallpaper'}</h2>
                            <h2 id="decrypting_text">{decryptingText}</h2>
                            <span id="download_a">
                                <a
                                    href={download?.url ?? '#'}
                                    download={wallpaper?.name ?? 'Wallpaper'}
                                    style={{
                                        display: manualLinkVisible
                                            ? 'inline'
                                            : 'none',
                                    }}
                                >
                                    Click here
                                </a>
                            </span>

                            <div id="progress_container">
                                <div
                                    id="progress"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </section>
                </main>
            </section>

            <Footer />
        </>
    );
}
