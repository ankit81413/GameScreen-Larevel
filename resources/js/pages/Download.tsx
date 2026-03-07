import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import '../../css/style.css';
import '../../css/download.css';
import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/includes/Footer';
import Header from '@/components/includes/Header';

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
    const confettiResizeHandlerRef = useRef<(() => void) | null>(null);
    const confettiParticlesRef = useRef<
        Array<{
            color: { front: string; back: string };
            shape: 'rect' | 'diamond' | 'circle' | 'star' | 'heart' | 'kite';
            dimensions: { x: number; y: number };
            position: { x: number; y: number };
            rotation: number;
            scale: { x: number; y: number };
            velocity: { x: number; y: number };
        }>
    >([]);

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
        const confettiCount = 300;
        const colors = [
            { front: 'red', back: 'darkred' },
            { front: 'green', back: 'darkgreen' },
            { front: 'blue', back: 'darkblue' },
            { front: 'yellow', back: 'darkyellow' },
            { front: 'orange', back: 'darkorange' },
            { front: 'pink', back: 'darkpink' },
            { front: 'purple', back: 'darkpurple' },
            { front: 'turquoise', back: 'darkturquoise' },
        ];

        const randomRange = (min: number, max: number) =>
            Math.random() * (max - min) + min;
        const shapes: Array<
            'rect' | 'diamond' | 'circle' | 'star' | 'heart' | 'kite'
        > = ['rect', 'diamond', 'circle', 'star', 'heart', 'kite'];
        const confettiPieces = Array.from({ length: confettiCount }).map(() => {
            const color = colors[Math.floor(randomRange(0, colors.length))];
            return {
                color,
                shape: shapes[Math.floor(randomRange(0, shapes.length))],
                dimensions: {
                    x: randomRange(8, 25),
                    y: randomRange(8, 25),
                },
                position: {
                    x: randomRange(0, canvas.width),
                    y: canvas.height - 1,
                },
                rotation: randomRange(0, 2 * Math.PI),
                scale: {
                    x: 1,
                    y: 1,
                },
                velocity: {
                    x: randomRange(-25, 25),
                    y: randomRange(0, -50),
                },
            };
        });

        confettiParticlesRef.current = [
            ...confettiParticlesRef.current,
            ...confettiPieces,
        ];
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
        const canvas = confettiCanvasRef.current;
        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const gravity = 1;
        const terminalVelocity = 6;
        const drag = 0.075;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        confettiResizeHandlerRef.current = resizeCanvas;
        window.addEventListener('resize', confettiResizeHandlerRef.current);

        const render = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);

            confettiParticlesRef.current.forEach((confetto, index) => {
                context.translate(confetto.position.x, confetto.position.y);
                context.rotate(confetto.rotation);

                confetto.velocity.x -= confetto.velocity.x * drag;
                confetto.velocity.y = Math.min(
                    confetto.velocity.y + gravity,
                    terminalVelocity,
                );
                confetto.velocity.x +=
                    Math.random() > 0.5 ? Math.random() : -Math.random();

                confetto.position.x += confetto.velocity.x;
                confetto.position.y += confetto.velocity.y;

                if (confetto.position.y >= canvas.height) {
                    confettiParticlesRef.current.splice(index, 1);
                }

                if (confetto.position.x > canvas.width) confetto.position.x = 0;
                if (confetto.position.x < 0) confetto.position.x = canvas.width;

                if (confetto.shape === 'heart') {
                    // Keep heart shape static, no pulsing/beating animation.
                    confetto.scale.y = 1;
                    context.fillStyle = confetto.color.front;
                } else {
                    confetto.scale.y = Math.cos(confetto.position.y * 0.1);
                    context.fillStyle =
                        confetto.scale.y > 0
                            ? confetto.color.front
                            : confetto.color.back;
                }

                const width = confetto.dimensions.x * confetto.scale.x;
                const height = confetto.dimensions.y * confetto.scale.y;

                if (confetto.shape === 'rect') {
                    context.fillRect(-width / 2, -height / 2, width, height);
                } else if (confetto.shape === 'diamond') {
                    context.beginPath();
                    context.moveTo(0, -height / 2);
                    context.lineTo(width / 2, 0);
                    context.lineTo(0, height / 2);
                    context.lineTo(-width / 2, 0);
                    context.closePath();
                    context.fill();
                } else if (confetto.shape === 'circle') {
                    context.beginPath();
                    context.arc(0, 0, Math.max(width, height) / 3, 0, Math.PI * 2);
                    context.fill();
                } else if (confetto.shape === 'star') {
                    const spikes = 5;
                    const outerRadius = Math.max(width, height) / 2.2;
                    const innerRadius = outerRadius / 2.2;
                    let rot = -Math.PI / 2;
                    context.beginPath();
                    context.moveTo(0, -outerRadius);
                    for (let i = 0; i < spikes; i += 1) {
                        context.lineTo(
                            Math.cos(rot) * outerRadius,
                            Math.sin(rot) * outerRadius,
                        );
                        rot += Math.PI / spikes;
                        context.lineTo(
                            Math.cos(rot) * innerRadius,
                            Math.sin(rot) * innerRadius,
                        );
                        rot += Math.PI / spikes;
                    }
                    context.closePath();
                    context.fill();
                } else if (confetto.shape === 'heart') {
                    const heartSize = Math.max(width, height) / 3.2;
                    context.beginPath();
                    context.moveTo(0, heartSize);
                    context.bezierCurveTo(
                        heartSize * 2,
                        -heartSize * 0.6,
                        heartSize * 1.5,
                        -heartSize * 2.2,
                        0,
                        -heartSize,
                    );
                    context.bezierCurveTo(
                        -heartSize * 1.5,
                        -heartSize * 2.2,
                        -heartSize * 2,
                        -heartSize * 0.6,
                        0,
                        heartSize,
                    );
                    context.closePath();
                    context.fill();
                } else {
                    context.beginPath();
                    context.moveTo(0, -height / 2);
                    context.lineTo(width / 2, 0);
                    context.lineTo(0, height / 2);
                    context.lineTo(-width / 3, 0);
                    context.closePath();
                    context.fill();
                }
                context.setTransform(1, 0, 0, 1, 0, 0);
            });

            confettiAnimationFrameRef.current = window.requestAnimationFrame(render);
        };

        confettiAnimationFrameRef.current = window.requestAnimationFrame(render);

        return () => {
            if (confettiAnimationFrameRef.current) {
                window.cancelAnimationFrame(confettiAnimationFrameRef.current);
            }
            if (confettiResizeHandlerRef.current) {
                window.removeEventListener('resize', confettiResizeHandlerRef.current);
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
