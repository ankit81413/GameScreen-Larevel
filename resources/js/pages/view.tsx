import { Head, Link, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
import '../../css/style.css';
import '../../css/new_style.css';
import Header from '@/components/includes/Header';
import Footer from '@/components/includes/Footer';
import '../../css/view.css';
import ViewWallpaperDisplay from '@/components/pages/view/View_wallpaper_display';
import View_tag from '@/components/pages/view/View_Tag';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props as any;
    const { wallpaper } = usePage().props as any;
    console.log(wallpaper);

    return (
        <>
            <Head title="View">
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

            <section className="main">
                <div id="left">
                    <ViewWallpaperDisplay links={wallpaper.links} thumbnail={wallpaper.thumbnail} type={wallpaper.type}/>
                    <div className="menu">
                        <div className="name">
                            <h2 id="name-text">hi</h2>
                        </div>
                        <div className="buttons">
                            <div className="share">
                                <i className="fa-solid fa-arrow-up-from-bracket"></i>
                            </div>
                            <div className="save">
                                <i className="fa-solid fa-bookmark"></i>
                            </div>
                            <div className="download">
                                <i className="fa-regular fa-circle-down"></i>
                            </div>
                        </div>
                    </div>
                    <div className="similar">
                        <div id="similar_tags">
                            {wallpaper.tags.map((tag: any) => (
                                <View_tag key={tag.id} name={tag.name}/>
                            ))}

                        </div>
                        <div id="similar_wallpapers">
                            <section id="wallpaper-container">
                                <div className="wallpaper landscape">
                                    <div className="image">
                                        <a
                                            target="_blank"
                                            href="image.html?value=0008"
                                        >
                                            <img
                                                src="https://www.dropbox.com/scl/fi/pii9g3dejrnqi37pusjxk/480p_2k_Avengers.jpg?rlkey=je4urlmrp26wy86jjxaxqz13c&amp;dl=1"
                                                alt="wallpaper"
                                                id="wallpaper0"
                                            />
                                        </a>
                                    </div>
                                    <div className="details">
                                        <h2>Avengers - Marvel</h2>
                                        <p>Quality : 4k</p>
                                    </div>
                                </div>

                                <div className="wallpaper landscape">
                                    <div className="image">
                                        <a
                                            target="_blank"
                                            href="image.html?value=0002"
                                        >
                                            <img
                                                src="https://www.dropbox.com/scl/fi/1jjal5ryknk68zyfmn0nx/480p_2k_1727900138018.jpg?rlkey=5neqajj17kfw75ly7y7r3s25j&amp;dl=1"
                                                alt="wallpaper"
                                                id="wallpaper1"
                                            />
                                        </a>
                                    </div>
                                    <div className="details">
                                        <h2>
                                            The Ultimate Spiderman - Miles
                                            Morales Edition
                                        </h2>
                                        <p>Quality : 4k</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
                <div id="right">
                    <div id="download_box">
                        <h1>
                            <i className="fa-regular fa-circle-down"></i>Download
                        </h1>
                        <ul id="download_option_list">
                            <li className="download_option">
                                <a href="download.html?value=0028&amp;quality=1080p">
                                    1080p (2.37 MB)
                                </a>
                            </li>
                            <li className="download_option">
                                <a href="download.html?value=0028&amp;quality=720p">
                                    720p (920.85 KB)
                                </a>
                            </li>
                            <li className="download_option">
                                <a href="download.html?value=0028&amp;quality=480p">
                                    480p (267.82 KB)
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}
