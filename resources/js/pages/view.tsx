import { Head, Link, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
import '../../css/style.css';
import '../../css/new_style.css';
import Header from '@/components/includes/Header';
import Footer from '@/components/includes/Footer';

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
            <Head title="VIiew">
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
            </section>
            <Footer />
        </>
    );
}
