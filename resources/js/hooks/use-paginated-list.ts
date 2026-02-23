import { useCallback, useState } from 'react';

export type PaginatedResponse<T> = {
    data: T[];
    next_page_url: string | null;
};

type UsePaginatedListOptions<T> = {
    initialData: PaginatedResponse<T>;
    fetcher?: (url: string) => Promise<PaginatedResponse<T>>;
};

const defaultFetcher = async <T,>(
    url: string,
): Promise<PaginatedResponse<T>> => {
    const response = await fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });

    if (!response.ok) {
        throw new Error('Failed to load more items');
    }

    return response.json();
};

export function usePaginatedList<T>({
    initialData,
    fetcher = defaultFetcher,
}: UsePaginatedListOptions<T>) {
    const [items, setItems] = useState<T[]>(initialData?.data ?? []);
    const [nextUrl, setNextUrl] = useState<string | null>(
        initialData?.next_page_url ?? null,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const loadMore = useCallback(async () => {
        if (!nextUrl || isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetcher(nextUrl);
            setItems((prev) => [...prev, ...(data.data ?? [])]);
            setNextUrl(data.next_page_url ?? null);
        } catch (err) {
            setError(err);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [fetcher, isLoading, nextUrl]);

    return {
        items,
        isLoading,
        hasMore: Boolean(nextUrl),
        loadMore,
        error,
    } as const;
}
