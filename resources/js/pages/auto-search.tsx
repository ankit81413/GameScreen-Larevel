import { Head, usePage } from '@inertiajs/react';
import '../../css/style.css';
import '../../css/new_style.css';
import LoadMoreWallpapersButton from '@/components/common/LoadMoreWallpapersButton';
import WallpaperCard from '@/components/common/WallpaperCard';
import Footer from '@/components/includes/Footer';
import Header from '@/components/includes/Header';
import { usePaginatedList } from '@/hooks/use-paginated-list';

export default function AutoSearchPage() {
    const { wallpapers, search } = usePage().props as any;
    const initialWallpapers =
        wallpapers ?? ({ data: [], next_page_url: null } as any);
    const { items, isLoading, hasMore, loadMore } = usePaginatedList({
        initialData: initialWallpapers,
    });
    const normalizedSearch = String(search ?? '').trim();

    return (
        <>
            <Head title={normalizedSearch ? `Search: ${normalizedSearch}` : 'Search'}>
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
                <section className="wallpaper-container">
                    {items.map((item: any) => (
                        <WallpaperCard key={item.id} item={item} />
                    ))}
                </section>
            </section>

            <LoadMoreWallpapersButton
                onClick={loadMore}
                loading={isLoading}
                hasMore={hasMore}
            />
            <Footer />
        </>
    );
}
